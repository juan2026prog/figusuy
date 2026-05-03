import React, { useState, useEffect, useRef } from 'react';

export default function UniversalAddressAutocomplete({
  countryCode = 'uy',
  value = '',
  onChange,
  onAddressSelect,
  placeholder = 'Buscar dirección...',
  disabled = false,
  label,
  required = false,
  className = ''
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Only update query from value if we are not actively typing or if it's the initial load
    if (value && value !== query && !loading && !isOpen) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeDepartment = (dept) => {
    if (!dept) return '';
    const normalized = dept.replace(/Department of /i, '')
                           .replace(/Departamento de /i, '')
                           .replace(/ Department/i, '')
                           .trim();
    return normalized;
  };

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (query === value) {
      // If query is exactly the same as the bound value (e.g. user just selected it),
      // we might not want to search again immediately unless they type.
      // But we will let debounce handle it, and maybe we can just skip if it matches a result exactly.
    }

    // Debounce
    const timer = setTimeout(async () => {
      if (query === value && !isOpen) return; // avoid re-fetching right after selection
      
      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=${countryCode}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { signal: abortControllerRef.current.signal });
        
        if (!response.ok) throw new Error('Error al buscar dirección');
        
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('No se pudieron cargar los resultados');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, countryCode]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) {
      onChange(val);
    }
    if (!isOpen && val.length >= 3) {
      setIsOpen(true);
    }
  };

  const handleSelect = (item) => {
    const addr = item.address || {};
    
    const street = addr.road || addr.pedestrian || '';
    const streetNumber = addr.house_number || '';
    const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const locality = addr.locality || '';
    const state = normalizeDepartment(addr.state || addr.region || '');
    const department = state;
    const postalCode = addr.postcode || '';
    const country = addr.country || '';
    
    // Construct a clean full address
    let mainText = item.name || `${street} ${streetNumber}`.trim();
    if (!mainText && street) mainText = street;
    
    let fullAddress = mainText;
    if (city && !fullAddress.includes(city)) fullAddress += `, ${city}`;
    if (department && !fullAddress.includes(department)) fullAddress += `, ${department}`;
    
    setQuery(fullAddress);
    setIsOpen(false);
    
    if (onChange) {
      onChange(fullAddress);
    }

    if (onAddressSelect) {
      onAddressSelect({
        fullAddress,
        street,
        streetNumber,
        neighborhood,
        city,
        locality,
        state,
        department,
        postalCode,
        country,
        lat: item.lat,
        lng: item.lon,
        raw: item
      });
    }
  };

  const formatResultPrimary = (item) => {
    const addr = item.address || {};
    if (addr.road) {
      return `${addr.road} ${addr.house_number || ''}`.trim();
    }
    return item.name || item.display_name.split(',')[0];
  };

  const formatResultSecondary = (item) => {
    const addr = item.address || {};
    const parts = [];
    if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.state) parts.push(normalizeDepartment(addr.state));
    if (addr.country) parts.push(addr.country);
    
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <style>{`
        .ua-container {
          position: relative;
          width: 100%;
        }
        .ua-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--color-text-muted, #94a3b8);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .ua-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ua-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.5rem;
          background: #0d0d0d;
          border: 1px solid var(--line2, #334155);
          border-radius: var(--radius-lg, 0.5rem);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .ua-input:focus {
          border-color: var(--orange, #ea580c);
          box-shadow: 0 0 0 1px var(--orange, #ea580c);
        }
        .ua-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ua-icon-left {
          position: absolute;
          left: 0.75rem;
          color: var(--color-text-muted, #94a3b8);
          pointer-events: none;
        }
        .ua-icon-right {
          position: absolute;
          right: 0.75rem;
          color: var(--color-brand-600, #ea580c);
        }
        .ua-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--panel, #121212);
          border: 1px solid var(--line, #334155);
          border-radius: var(--radius-lg, 0.5rem);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8);
          z-index: 5000;
          max-height: 250px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .ua-item {
          padding: 0.85rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid var(--line, #334155);
          transition: background 0.15s ease;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .ua-item:last-child {
          border-bottom: none;
        }
        .ua-item:hover {
          background: rgba(255, 90, 0, 0.08);
        }
        .ua-item-icon {
          color: var(--color-text-muted, #94a3b8);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .ua-item-primary {
          font-weight: 700;
          color: var(--color-text, #f8fafc);
          font-size: 0.875rem;
          margin-bottom: 0.125rem;
        }
        .ua-item-secondary {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #cbd5e1);
        }
        .ua-message {
          padding: 1rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #cbd5e1);
        }
      `}</style>
      
      <div className="ua-container">
        {label && <label className="ua-label">{label} {required && '*'}</label>}
        
        <div className="ua-input-wrapper">
          <span className="material-symbols-outlined ua-icon-left" style={{ fontSize: '1.125rem' }}>search</span>
          <input
            type="text"
            className="ua-input"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onFocus={() => query.length >= 3 && setIsOpen(true)}
          />
          {loading && <span className="material-symbols-outlined ua-icon-right animate-spin" style={{ fontSize: '1.125rem' }}>progress_activity</span>}
        </div>

        {isOpen && (
          <div className="ua-dropdown">
            {error && (
              <div className="ua-message text-red-400">{error}</div>
            )}
            {!error && !loading && results.length === 0 && query.length >= 3 && (
              <div className="ua-message">No se encontraron resultados para "{query}"</div>
            )}
            {!error && results.map((item, index) => (
              <div 
                key={`${item.place_id}-${index}`} 
                className="ua-item"
                onClick={() => handleSelect(item)}
              >
                <span className="material-symbols-outlined ua-item-icon" style={{ fontSize: '1rem' }}>location_on</span>
                <div>
                  <div className="ua-item-primary">{formatResultPrimary(item)}</div>
                  <div className="ua-item-secondary">{formatResultSecondary(item)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
