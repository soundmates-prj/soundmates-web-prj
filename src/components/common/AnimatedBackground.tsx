import React from 'react';
import './AnimatedBackground.css';

export const AnimatedBackground: React.FC = () => {
    return (
        <div className="animated-background">
            <div className="background-shapes">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
                <div className="circle circle-4"></div>
                <div className="circle circle-5"></div>
            </div>
            <div className="background-overlay"></div>
        </div>
    );
};
