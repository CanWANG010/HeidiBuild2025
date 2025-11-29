import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, queuePosition = null, isRunning = false, onResetStatus = null }) => {
    // Running state takes highest priority
    if (isRunning) {
        return (
            <span className="status-badge status-running">
                <span className="spinner-small"></span>
                Running
            </span>
        );
    }

    // Queue state
    if (queuePosition !== null && queuePosition > 0) {
        return (
            <span className="status-badge status-queued">
                Queue #{queuePosition}
            </span>
        );
    }

    const getStatusLabel = (s) => {
        switch (s) {
            case 'NOT_RUN': return 'Not Run';
            case 'IN_FLOW': return 'In Flow';
            case 'COMPLETED': return 'Completed';
            default: return s;
        }
    };

    // Completed status - clickable to reset
    if (status === 'COMPLETED' && onResetStatus) {
        return (
            <span
                className="status-badge status-completed status-clickable"
                onClick={(e) => {
                    e.stopPropagation();
                    onResetStatus();
                }}
                title="Click to reset to Not Run"
            >
                {getStatusLabel(status)}
            </span>
        );
    }

    return (
        <span className={`status-badge status-${status.toLowerCase().replace('_', '-')}`}>
            {getStatusLabel(status)}
        </span>
    );
};

export default StatusBadge;
