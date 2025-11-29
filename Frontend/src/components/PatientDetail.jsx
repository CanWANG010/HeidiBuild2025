import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api';

const Field = ({ label, value, readOnly = false, onChange, multiline = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {readOnly ? (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm">
                {value || <span className="text-gray-400 italic">N/A</span>}
            </div>
        ) : (
            multiline ? (
                <textarea
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            )
        )}
    </div>
);

export function PatientDetail({ patientId, onClose, onUpdate }) {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (patientId) {
            loadPatient();
        }
    }, [patientId]);

    const loadPatient = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getPatient(patientId);
            setPatient(data);
            // Initialize form data with editable fields from rawHeidi
            setFormData({
                first_name: data.rawHeidi.first_name,
                last_name: data.rawHeidi.last_name,
                phone: data.rawHeidi.phone,
                email: data.rawHeidi.email,
                additional_context: data.rawHeidi.additional_context,
                current_medications: data.rawHeidi.current_medications,
                allergies: data.rawHeidi.allergies,
                past_medical_history: data.rawHeidi.past_medical_history,
                runStatus: data.runStatus
            });
        } catch (err) {
            setError('Failed to load patient details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await api.updatePatient(patientId, formData);
            setPatient(updated);
            onUpdate(updated); // Notify parent to update list
            // Optional: Show success message
        } catch (err) {
            setError('Failed to save changes.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>;
    if (!patient) return null;

    return (
        <div className="flex flex-col h-full bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{formData.first_name} {formData.last_name}</h2>
                    <p className="text-sm text-gray-500">ID: {patient.id} • {patient.gender} • {patient.birthDate}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">RPA Status</h3>
                    <div className="flex items-center space-x-4">
                        <select
                            value={formData.runStatus}
                            onChange={(e) => handleChange('runStatus', e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="NOT_RUN">Not Run</option>
                            <option value="IN_FLOW">In Flow</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Personal Information */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="First Name" value={formData.first_name} onChange={(v) => handleChange('first_name', v)} />
                        <Field label="Last Name" value={formData.last_name} onChange={(v) => handleChange('last_name', v)} />
                        <Field label="Phone" value={formData.phone} onChange={(v) => handleChange('phone', v)} />
                        <Field label="Email" value={formData.email} onChange={(v) => handleChange('email', v)} />
                    </div>
                </section>

                {/* Clinical Information */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Clinical Context</h3>
                    <div className="space-y-4">
                        <Field label="Additional Context" value={formData.additional_context} onChange={(v) => handleChange('additional_context', v)} multiline />
                        <Field label="Current Medications" value={formData.current_medications} onChange={(v) => handleChange('current_medications', v)} multiline />
                        <Field label="Allergies" value={formData.allergies} onChange={(v) => handleChange('allergies', v)} multiline />
                        <Field label="Past Medical History" value={formData.past_medical_history} onChange={(v) => handleChange('past_medical_history', v)} multiline />
                    </div>
                </section>

                {/* Read-only Metadata */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">System Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Source" value={patient.rawHeidi.source} readOnly />
                        <Field label="EHR ID" value={patient.rawHeidi.ehr_patient_id} readOnly />
                        <Field label="Managed By" value={patient.rawHeidi.managed_by} readOnly />
                        <Field label="Consent" value={patient.rawHeidi.remember_consent ? 'Yes' : 'No'} readOnly />
                    </div>
                </section>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 sticky bottom-0 z-10">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
