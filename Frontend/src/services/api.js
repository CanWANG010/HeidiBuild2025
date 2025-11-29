const API_BASE = 'http://localhost:8000';

export const api = {
    getPatients: async () => {
        const response = await fetch(`${API_BASE}/api/patients`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        return response.json();
    },

    getPatient: async (id) => {
        const response = await fetch(`${API_BASE}/api/patients/${id}`);
        if (!response.ok) throw new Error('Patient not found');
        return response.json();
    },

    updatePatient: async (id, updates) => {
        const response = await fetch(`${API_BASE}/api/patients/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update patient');
        return response.json();
    },

    resetRunStatus: async () => {
        const response = await fetch(`${API_BASE}/api/patients/reset-run-status`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to reset status');
        return response.json();
    }
};
