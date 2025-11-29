import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const api = {
    getPatients: async () => {
        const response = await axios.get(`${API_BASE_URL}/patients`);
        return response.data;
    },
    getPatient: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/patients/${id}`);
        return response.data;
    },
    updatePatient: async (id, data) => {
        const response = await axios.patch(`${API_BASE_URL}/patients/${id}`, data);
        return response.data;
    }
};
