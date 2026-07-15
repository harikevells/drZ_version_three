import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaSearch, FaChevronDown } from 'react-icons/fa';
import './MultiSelectDropdown.css';

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState([...selectedValues]);
  const dropdownRef = useRef(null);

  // Sync tempSelected with selectedValues when opened
  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selectedValues]);
      setSearchTerm('');
    }
  }, [isOpen, selectedValues]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckboxChange = (option) => {
    if (tempSelected.includes(option)) {
      setTempSelected(tempSelected.filter(item => item !== option));
    } else {
      setTempSelected([...tempSelected, option]);
    }
  };

  const handleOkClick = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const removePill = (e, optionToRemove) => {
    e.stopPropagation();
    const newSelected = selectedValues.filter(option => option !== optionToRemove);
    onChange(newSelected);
  };

  return (
    <div className="multi-select-container" ref={dropdownRef}>
      <div className="multi-select-input" onClick={() => setIsOpen(!isOpen)}>
        <div className="pills-container">
          {selectedValues.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            selectedValues.map(option => (
              <span key={option} className="pill" onClick={(e) => e.stopPropagation()}>
                {option}
                <FaTimes className="pill-close" onClick={(e) => removePill(e, option)} />
              </span>
            ))
          )}
        </div>
        <FaChevronDown className="dropdown-icon" />
      </div>

      {isOpen && (
        <div className="multi-select-menu">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <label key={option} className="option-label">
                  <input 
                    type="checkbox" 
                    checked={tempSelected.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                  />
                  <span>{option}</span>
                </label>
              ))
            ) : (
              <div className="no-options">No departments found</div>
            )}
          </div>
          
          <div className="menu-footer">
            <button type="button" className="ok-btn" onClick={handleOkClick}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
