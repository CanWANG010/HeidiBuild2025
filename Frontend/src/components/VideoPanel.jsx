import React, { useRef, useEffect } from 'react';
import './VideoPanel.css';

const VideoPanel = ({ onVideoEnd }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        // Auto-play video when component mounts
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.error('Auto-play failed:', err);
            });
        }
    }, []);

    const handleVideoEnd = () => {
        if (onVideoEnd) {
            onVideoEnd();
        }
    };

    return (
        <div className="video-panel">
            <div className="video-container">
                <video
                    ref={videoRef}
                    className="rpa-video"
                    onEnded={handleVideoEnd}
                    controls={false}
                    playsInline
                >
                    {/* TODO: Replace with actual video source when ready */}
                    <source src="/rpa-demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Overlay with status */}
                <div className="video-overlay">
                    <div className="video-status">
                        <span className="status-indicator"></span>
                        <span>RPA Processing...</span>
                    </div>
                </div>
            </div>

            {/* For testing: Skip button (remove in production) */}
            <button
                className="skip-button"
                onClick={handleVideoEnd}
            >
                Skip Video (Dev Only)
            </button>
        </div>
    );
};

export default VideoPanel;
