'use strict';

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS for the specified frontend origin
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const HEIDI_FILE = path.join(DATA_DIR, 'heidi_patients.json');
const STATE_FILE = path.join(DATA_DIR, 'patient_state.json');

const VALID_RUN_STATUSES = new Set(['NOT_RUN', 'IN_FLOW', 'COMPLETED']);
const EDITABLE_HEIDI_FIELDS = new Set([
  'first_name',
  'last_name',
  'phone',
  'email',
  'additional_context',
  'current_medications',
  'allergies',
  'past_medical_history',
]);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function ensureStateForAllPatients(patients, state) {
  const idToState = new Map(state.map((s) => [s.id, s.runStatus]));
  for (const p of patients) {
    if (!idToState.has(p.id)) {
      idToState.set(p.id, 'NOT_RUN');
    }
  }
  return Array.from(idToState.entries()).map(([id, runStatus]) => ({
    id,
    runStatus,
  }));
}

function buildPatientListItem(heidiPatient, runStatus) {
  return {
    id: heidiPatient.id,
    fullName: [heidiPatient.first_name, heidiPatient.last_name]
      .filter(Boolean)
      .join(' ')
      .trim(),
    birthDate: heidiPatient.birth_date || '',
    gender: heidiPatient.gender || '',
    phone: heidiPatient.phone || '',
    email: heidiPatient.email || '',
    demographic: heidiPatient.demographic_string || '',
    runStatus,
  };
}

function findPatientById(patients, id) {
  return patients.find((p) => p.id === id) || null;
}

function getRunStatusForId(stateArr, id) {
  const s = stateArr.find((x) => x.id === id);
  return s?.runStatus || 'NOT_RUN';
}

// GET /api/patients - list view
app.get('/api/patients', (req, res) => {
  try {
    const heidiPatients = readJson(HEIDI_FILE);
    const patientStateRaw = readJson(STATE_FILE);
    const patientState = ensureStateForAllPatients(heidiPatients, patientStateRaw);

    const items = heidiPatients.map((p) =>
      buildPatientListItem(p, getRunStatusForId(patientState, p.id))
    );
    res.json(items);
  } catch (err) {
    console.error('GET /api/patients error:', err);
    res.status(500).json({ error: 'Failed to load patients' });
  }
});

// GET /api/patients/:id - detail view (list fields + rawHeidi)
app.get('/api/patients/:id', (req, res) => {
  try {
    const id = req.params.id;
    const heidiPatients = readJson(HEIDI_FILE);
    const state = readJson(STATE_FILE);

    const patient = findPatientById(heidiPatients, id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const runStatus = getRunStatusForId(state, id);
    const view = {
      ...buildPatientListItem(patient, runStatus),
      rawHeidi: patient,
    };
    res.json(view);
  } catch (err) {
    console.error(`GET /api/patients/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to load patient' });
  }
});

// PATCH /api/patients/:id - update heidi fields and/or runStatus
app.patch('/api/patients/:id', (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const heidiPatients = readJson(HEIDI_FILE);
    const state = readJson(STATE_FILE);

    const idx = heidiPatients.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update Heidi fields (only whitelisted)
    const updatedPatient = { ...heidiPatients[idx] };
    for (const [key, value] of Object.entries(body)) {
      if (EDITABLE_HEIDI_FIELDS.has(key)) {
        updatedPatient[key] = value;
      }
    }
    heidiPatients[idx] = updatedPatient;
    writeJson(HEIDI_FILE, heidiPatients);

    // Update runStatus if present
    if (Object.prototype.hasOwnProperty.call(body, 'runStatus')) {
      const newStatus = body.runStatus;
      if (!VALID_RUN_STATUSES.has(newStatus)) {
        return res.status(400).json({
          error: 'Invalid runStatus',
          allowed: Array.from(VALID_RUN_STATUSES),
        });
      }
      const sIdx = state.findIndex((s) => s.id === id);
      if (sIdx === -1) {
        state.push({ id, runStatus: newStatus });
      } else {
        state[sIdx] = { id, runStatus: newStatus };
      }
      writeJson(STATE_FILE, state);
    }

    const runStatus = getRunStatusForId(readJson(STATE_FILE), id);
    const view = {
      ...buildPatientListItem(updatedPatient, runStatus),
      rawHeidi: updatedPatient,
    };
    res.json(view);
  } catch (err) {
    console.error(`PATCH /api/patients/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

app.listen(PORT, () => {
  console.log(`EMR backend listening on http://localhost:${PORT}`);
});


