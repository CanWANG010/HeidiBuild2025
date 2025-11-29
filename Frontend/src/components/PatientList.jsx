import React, { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge';
import './PatientList.css';

const PatientList = ({ patients, onSelectPatient, selectedIds, onToggleSelect, rpaQueue = [], currentRpaId = null, onResetPatientStatus = null }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    // Sort: Running > Queue > Selected > Others
    const sortedPatients = useMemo(() => {
        return [...filteredPatients].sort((a, b) => {
            const aSelected = selectedIds.includes(a.id);
            const bSelected = selectedIds.includes(b.id);
            const aIsRunning = currentRpaId === a.id;
            const bIsRunning = currentRpaId === b.id;
            const aQueuePos = rpaQueue.indexOf(a.id);
            const bQueuePos = rpaQueue.indexOf(b.id);

            // 1. Currently running on top
            if (aIsRunning && !bIsRunning) return -1;
            if (!aIsRunning && bIsRunning) return 1;

            // 2. In queue (by position)
            if (aQueuePos >= 0 && bQueuePos < 0) return -1;
            if (aQueuePos < 0 && bQueuePos >= 0) return 1;
            if (aQueuePos >= 0 && bQueuePos >= 0) return aQueuePos - bQueuePos;

            // 3. Selected items
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;

            return 0;
        });
    }, [filteredPatients, selectedIds, rpaQueue, currentRpaId]);

    return (
        <div className="patient-list-container">
            <div className="patient-list-header">
                <h2>Patients</h2>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="patient-list-content">
                {sortedPatients.length === 0 ? (
                    <div className="empty-state">No patients found.</div>
                ) : (
                    sortedPatients.map(patient => {
                        const isRunning = currentRpaId === patient.id;
                        const queuePosition = rpaQueue.indexOf(patient.id) + 1;
                        const isInQueue = queuePosition > 0;

                        return (
                            <div
                                key={patient.id}
                                className={`patient-item ${isRunning ? 'running' : ''} ${isInQueue ? 'queued' : ''}`}
                                onClick={() => onSelectPatient(patient.id)}
                            >
                                <div className="patient-item-checkbox" onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSelect(patient.id);
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(patient.id)}
                                        onChange={() => { }}
                                    />
                                </div>
                                <div className="patient-info">
                                    <div className="patient-name-row">
                                        <span className="patient-name">{patient.fullName}</span>
                                        <StatusBadge
                                            status={patient.runStatus}
                                            queuePosition={queuePosition}
                                            isRunning={isRunning}
                                            onResetStatus={onResetPatientStatus ? () => onResetPatientStatus(patient.id) : null}
                                        />
                                    </div>
                                    <div className="patient-details-row">
                                        <span>{patient.gender}, {patient.birthDate}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PatientList;
