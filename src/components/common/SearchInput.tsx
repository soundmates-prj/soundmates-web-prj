import React, { useState } from 'react';
import Icon from './Icon';
import './SearchInput.css';

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Search...',
    value: externalValue,
    onChange,
    onSearch,
    disabled = false,
    className = '',
}) => {
    const [internalValue, setInternalValue] = useState('');
    const value = externalValue !== undefined ? externalValue : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (externalValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch?.(value);
        }
    };

    const handleClear = () => {
        if (externalValue === undefined) {
            setInternalValue('');
        }
        onChange?.('');
        onSearch?.('');
    };

    return (
        <div className={`search-input-container ${className}`.trim()}>
            <Icon name="search" size={18} className="search-input-icon" />
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />
            {value && (
                <button
                    className="search-input-clear"
                    onClick={handleClear}
                    type="button"
                    aria-label="Clear search"
                >
                    <Icon name="close" size={14} />
                </button>
            )}
        </div>
    );
};

export default SearchInput;
