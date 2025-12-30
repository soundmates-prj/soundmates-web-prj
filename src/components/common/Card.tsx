import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> & {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
    Footer: React.FC<CardFooterProps>;
} = ({ children, className = '', hoverable = false }) => {
    return (
        <div className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`.trim()}>
            {children}
        </div>
    );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', actions }) => {
    return (
        <div className={`card-header ${className}`.trim()}>
            <div className="card-header-title">{children}</div>
            {actions && <div className="card-header-actions">{actions}</div>}
        </div>
    );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = '', noPadding = false }) => {
    return (
        <div className={`card-body ${noPadding ? 'card-body-no-padding' : ''} ${className}`.trim()}>
            {children}
        </div>
    );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`card-footer ${className}`.trim()}>
            {children}
        </div>
    );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
