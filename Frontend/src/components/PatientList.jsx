import React from 'react';
import { cn } from '../lib/utils';
import { Check, Clock, PlayCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        NOT_RUN: "bg-gray-100 text-gray-600 border-gray-200",
        IN_FLOW: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
        COMPLETED: "bg-green-100 text-green-700 border-green-200",
    };

    const icons = {
        NOT_RUN: <Clock className="w-3 h-3 mr-1" />,
        IN_FLOW: <PlayCircle className="w-3 h-3 mr-1" />,
        COMPLETED: <Check className="w-3 h-3 mr-1" />,
    };

    return (
        <span className={cn(
            "flex items-center px-2 py-1 rounded-full text-xs font-medium border",
            styles[status] || styles.NOT_RUN
        )}>
            {icons[status]}
            {status.replace('_', ' ')}
        </span>
    );
};

export function PatientList({
    patients,
    selectedId,
    onSelect,
    multiSelectedIds,
    onMultiSelect,
    compact
}) {
    const handleCheckboxChange = (e, id) => {
        e.stopPropagation();
        onMultiSelect(id, e.target.checked);
    };

    // Sort: IN_FLOW first, then Selected, then by name
    const sortedPatients = [...patients].sort((a, b) => {
        // 1. IN_FLOW check
        if (a.runStatus === 'IN_FLOW' && b.runStatus !== 'IN_FLOW') return -1;
        if (a.runStatus !== 'IN_FLOW' && b.runStatus === 'IN_FLOW') return 1;

        // 2. Selected check (multiSelectedIds)
        const aSelected = multiSelectedIds.has(a.id);
        const bSelected = multiSelectedIds.has(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        // 3. Name check
        return a.fullName.localeCompare(b.fullName);
    });

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Patients</h2>
                    <p className="text-xs text-gray-500">{patients.length} records</p>
                </div>
                {/* Legend for statuses */}
                {!compact && (
                    <div className="flex space-x-2 text-xs">
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-200 mr-1"></span>Not Run</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>In Flow</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>Done</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-4">
                                <input type="checkbox" className="rounded border-gray-300" disabled />
                            </th>
                            <th className="px-3 py-2">Name</th>
                            {!compact && <th className="px-3 py-2">Details</th>}
                            <th className="px-3 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedPatients.map((patient) => (
                            <tr
                                key={patient.id}
                                onClick={() => onSelect(patient.id)}
                                className={cn(
                                    "cursor-pointer hover:bg-gray-50 transition-colors group",
                                    selectedId === patient.id && "bg-blue-50 hover:bg-blue-50 border-l-4 border-blue-500",
                                    patient.runStatus === 'IN_FLOW' && "bg-blue-50/30"
                                )}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={multiSelectedIds.has(patient.id)}
                                        onChange={(e) => handleCheckboxChange(e, patient.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="font-medium text-gray-900">{patient.fullName}</div>
                                    {compact && <div className="text-xs text-gray-400 truncate">{patient.gender}, {patient.birthDate}</div>}
                                </td>
                                {!compact && (
                                    <td className="px-3 py-3 text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{patient.gender}, {patient.birthDate}</span>
                                            <span className="text-xs text-gray-400">{patient.phone}</span>
                                        </div>
                                    </td>
                                )}
                                <td className="px-3 py-3">
                                    <StatusBadge status={patient.runStatus} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
