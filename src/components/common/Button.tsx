import React from 'react';
import Icon, { type IconName } from './Icon';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: IconName;
    rightIcon?: IconName;
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

    return (
        <button
            className={`
        btn
        btn-${variant}
        btn-${size}
        ${fullWidth ? 'btn-full-width' : ''}
        ${isLoading ? 'btn-loading' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="btn-spinner">
                    <Icon name="refresh" size={iconSize} className="animate-spin" />
                </span>
            )}
            {!isLoading && leftIcon && <Icon name={leftIcon} size={iconSize} />}
            {children && <span className="btn-text">{children}</span>}
            {!isLoading && rightIcon && <Icon name={rightIcon} size={iconSize} />}
        </button>
    );
};

export default Button;
