import React, { useState } from 'react';

// Function to help validate IMO number. IMO should be a unique 7 digit number
const isValidImo = (imo: string): boolean => {
    if (!/^\d{7}$/.test(imo)) {
        return false;
    }

    // convert into a an array of numbers, and check the validity
    const digitsArray: Array<number> = imo.split('').map(Number);
    
    let multiplier: number = 7
    let sum: number = 0
    for (let i = 0; i < 6; i++) {
        sum += digitsArray[i] * multiplier;
        multiplier -= 1;
    }
    const lastDigit: number = sum % 10;
    return lastDigit === digitsArray[6];
}

interface SearchBarProps {
    onSearch: (imo: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [imo, setImo] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleSearch = () => {
        if (!isValidImo(imo)) {
            setError('Invalid IMO number');
            return;
        }
        // At this point, IMO is valid
        setError(null);
        onSearch(imo);
    }

    return (
        <div className="search-bar">
            <input 
                type="text"
                placeholder="Enter Vessel IMO"
                value={imo}
                onChange={(input) => setImo(input.target.value)}
            />
            <button onClick={handleSearch} disabled={!imo.trim()}>
                Enter
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default SearchBar;