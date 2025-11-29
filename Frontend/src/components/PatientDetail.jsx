import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from './StatusBadge';
import './PatientDetail.css';

const PatientDetail = ({ patientId, onBack, onSaveSuccess, onStartSingleRPA, refreshTrigger, rpaQueue = [], currentRpaId = null }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});

    // Check if this patient is in queue or running
    const isInQueue = rpaQueue.includes(patientId);
    const isCurrentlyRunning = currentRpaId === patientId;
    const queuePosition = rpaQueue.indexOf(patientId) + 1;

    const fetchPatient = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const data = await api.getPatient(patientId);
            setPatient(data);
            // Only update form data on initial load, not on status refresh
            if (isInitialLoad) setFormData(data);
        } catch (err) {
            setError('Failed to load patient details.');
            console.error(err);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (patientId) {
            fetchPatient(true);
        }
    }, [patientId]);

    // Refresh on trigger change (for status updates)
    useEffect(() => {
        if (patientId && !loading) {
            fetchPatient(false);
        }
    }, [refreshTrigger]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.updatePatient(patientId, formData);
            if (onSaveSuccess) onSaveSuccess();
        } catch (err) {
            setError('Failed to save changes.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="detail-loading">Loading details...</div>;
    if (error) return <div className="detail-error">{error} <button onClick={onBack}>Back</button></div>;
    if (!patient) return null;

    return (
        <div className="patient-detail-container">
            <div className="detail-header">
                <button className="back-button" onClick={onBack}>← Back</button>
                <div className="detail-title">
                    <h2>{patient.fullName}</h2>
                    <StatusBadge status={patient.runStatus} />
                </div>
            </div>

            <form className="detail-form" onSubmit={handleSubmit}>
                <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input name="first_name" value={formData.first_name || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input name="last_name" value={formData.last_name || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input name="email" value={formData.email || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Medical Context</h3>
                    <div className="form-group">
                        <label>Current Medications</label>
                        <textarea name="current_medications" value={formData.current_medications || ''} onChange={handleChange} rows={3} />
                    </div>
                    <div className="form-group">
                        <label>Allergies</label>
                        <textarea name="allergies" value={formData.allergies || ''} onChange={handleChange} rows={2} />
                    </div>
                    <div className="form-group">
                        <label>Past Medical History</label>
                        <textarea name="past_medical_history" value={formData.past_medical_history || ''} onChange={handleChange} rows={3} />
                    </div>
                    <div className="form-group">
                        <label>Additional Context</label>
                        <textarea name="additional_context" value={formData.additional_context || ''} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>System Status (Manual Override)</h3>
                    <div className="form-group">
                        <label>Run Status</label>
                        <select name="runStatus" value={formData.runStatus || 'NOT_RUN'} onChange={handleChange}>
                            <option value="NOT_RUN">Not Run</option>
                            <option value="IN_FLOW">In Flow</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <div className="action-left">
                        {/* Placeholder for left-aligned actions if any */}
                    </div>
                    <div className="action-right">
                        <button type="button" className="btn-cancel" onClick={onBack}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Single Patient RPA Button */}
            <div className="detail-footer">
                {/* In Queue */}
                {isInQueue && !isCurrentlyRunning && (
                    <div className="rpa-status-info">
                        <span style={{ color: '#92400e', fontWeight: '600' }}>
                            In queue (position #{queuePosition})
                        </span>
                    </div>
                )}

                {/* Currently Running */}
                {isCurrentlyRunning && (
                    <div className="rpa-status-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #3b82f6',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            display: 'inline-block'
                        }}></span>
                        <span style={{ color: '#3b82f6', fontWeight: '600' }}>RPA is currently running...</span>
                    </div>
                )}

                {/* Completed */}
                {patient.runStatus === 'COMPLETED' && !isInQueue && !isCurrentlyRunning && (
                    <>
                        <div className="rpa-status-info">
                            <span>This patient has already been processed</span>
                        </div>
                        <button className="btn-start-rpa" disabled>
                            Already Completed
                        </button>
                    </>
                )}

                {/* Not Run - can add to queue */}
                {patient.runStatus === 'NOT_RUN' && !isInQueue && !isCurrentlyRunning && (
                    <>
                        <div className="rpa-status-info">
                            <span>Add this patient to RPA queue</span>
                        </div>
                        <button
                            className="btn-start-rpa"
                            onClick={() => onStartSingleRPA(patientId)}
                        >
                            Add to Queue
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientDetail;
