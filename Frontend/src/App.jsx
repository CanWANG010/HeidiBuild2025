import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import { api } from './services/api';
import './index.css';

function App() {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedRpaIds, setSelectedRpaIds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // RPA Queue system
  const [rpaQueue, setRpaQueue] = useState([]); // Queue of patient IDs waiting
  const [currentRpaId, setCurrentRpaId] = useState(null); // Currently running patient
  const isProcessingRef = useRef(false);

  // Fetch patients logic moved to App
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [refreshTrigger]);

  const handleToggleRpaSelect = (id) => {
    setSelectedRpaIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pid => pid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedPatientId(null);
    setView('list');
  };

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    handleBack();
  };

  // Add patients to queue
  const addToQueue = (patientIds) => {
    setRpaQueue(prev => {
      const newIds = patientIds.filter(id =>
        !prev.includes(id) && id !== currentRpaId
      );
      return [...prev, ...newIds];
    });
  };

  // Process queue - runs one patient at a time
  const processQueue = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    while (true) {
      // Get next patient from queue
      let nextId = null;
      setRpaQueue(prev => {
        if (prev.length === 0) return prev;
        nextId = prev[0];
        return prev.slice(1);
      });

      // Wait a tick for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      // Re-check after state update
      if (!nextId) {
        // Check current queue state
        const currentQueue = await new Promise(resolve => {
          setRpaQueue(prev => {
            resolve(prev);
            return prev;
          });
        });
        if (currentQueue.length === 0) break;
        nextId = currentQueue[0];
        setRpaQueue(prev => prev.slice(1));
      }

      if (!nextId) break;

      // Execute RPA for this patient
      setCurrentRpaId(nextId);

      try {
        // Set to IN_FLOW
        await api.updatePatient(nextId, { runStatus: 'IN_FLOW' });
        setRefreshTrigger(prev => prev + 1);

        // Simulate completion after 15 seconds (longer for testing)
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Set to COMPLETED
        await api.updatePatient(nextId, { runStatus: 'COMPLETED' });
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error(`RPA failed for ${nextId}:`, err);
      }

      setCurrentRpaId(null);
    }

    isProcessingRef.current = false;
  };

  // Watch queue and start processing
  useEffect(() => {
    if (rpaQueue.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [rpaQueue]);

  // Batch RPA execution (from list page)
  const handleStartBatchRPA = () => {
    if (selectedRpaIds.length === 0) return;

    // Add to queue
    addToQueue([...selectedRpaIds]);

    // Clear selection
    setSelectedRpaIds([]);
  };

  // Single patient RPA execution (from detail page)
  const handleStartSingleRPA = (patientId) => {
    addToQueue([patientId]);
  };

  // Reset patient status from COMPLETED to NOT_RUN
  const handleResetPatientStatus = async (patientId) => {
    try {
      await api.updatePatient(patientId, { runStatus: 'NOT_RUN' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(`Failed to reset status for ${patientId}:`, err);
    }
  };

  // Render Full Screen Detail
  if (view === 'detail' && selectedPatientId) {
    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--color-bg-primary)' }}>
        <PatientDetail
          patientId={selectedPatientId}
          onBack={handleBack}
          onSaveSuccess={handleSaveSuccess}
          onStartSingleRPA={handleStartSingleRPA}
          refreshTrigger={refreshTrigger}
          rpaQueue={rpaQueue}
          currentRpaId={currentRpaId}
        />
      </div>
    );
  }

  // Render List Layout
  return (
    <Layout
      leftPanel={
        loading ? (
          <div style={{ padding: '20px', color: '#6c757d' }}>Loading patients...</div>
        ) : (
          <PatientList
            patients={patients}
            onSelectPatient={handleSelectPatient}
            selectedIds={selectedRpaIds}
            onToggleSelect={handleToggleRpaSelect}
            rpaQueue={rpaQueue}
            currentRpaId={currentRpaId}
            onResetPatientStatus={handleResetPatientStatus}
          />
        )
      }
      rightPanel={
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Batch RPA</h2>

          {/* Selection for batch */}
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
            Selected: {selectedRpaIds.length}
          </p>

          {selectedRpaIds.length > 0 && (
            <>
              <div style={{ textAlign: 'left', display: 'inline-block', background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {selectedRpaIds.map(id => {
                    const patient = patients.find(p => p.id === id);
                    return (
                      <li key={id} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: patient?.runStatus === 'IN_FLOW' ? '#3b82f6' : patient?.runStatus === 'COMPLETED' ? '#22c55e' : '#9ca3af'
                        }}></span>
                        {patient?.fullName || id}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <button
                  onClick={handleStartBatchRPA}
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  Add {selectedRpaIds.length} to Queue
                </button>
              </div>
            </>
          )}

          {selectedRpaIds.length === 0 && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Select patients from the list to run RPA
            </p>
          )}
        </div>
      }
    />
  );
}

export default App;
