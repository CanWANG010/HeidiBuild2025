import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';

const LeftPanel = ({ selectedRpaIds, onToggleRpaSelect, refreshTrigger }) => {
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleSelectPatient = (id) => {
        setSelectedPatientId(id);
        setView('detail');
    };

    const handleBack = () => {
        setSelectedPatientId(null);
        setView('list');
    };

    const handleSaveSuccess = () => {
        fetchPatients(); // Refresh list to show updated data/status
        handleBack();
    };

    if (loading && view === 'list') {
        return <div style={{ padding: '20px', color: '#6c757d' }}>Loading patients...</div>;
    }

    return (
        <>
            {view === 'list' ? (
                <PatientList
                    patients={patients}
                    onSelectPatient={handleSelectPatient}
                    selectedIds={selectedRpaIds}
                    onToggleSelect={onToggleRpaSelect}
                />
            ) : (
                <PatientDetail
                    patientId={selectedPatientId}
                    onBack={handleBack}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </>
    );
};

export default LeftPanel;
