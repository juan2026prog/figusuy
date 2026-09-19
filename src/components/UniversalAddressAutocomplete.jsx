import React, { useState, useEffect, useRef } from 'react';
import { geocode } from '../lib/geocoding';

export default function UniversalAddressAutocomplete({
  countryCode = 'uy',
  value = '',
  mode = 'area', // 'area' (department/neighborhood for users) | 'address' (exact street for stores)
  onChange,
  onAddressSelect,
  placeholder,
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

  const defaultPlaceholder = mode === 'area' ? 'Ej. Pocitos, Montevideo o Maldonado...' : 'Buscar calle y número...';
  const effectivePlaceholder = placeholder || defaultPlaceholder;

  useEffect(() => {
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

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (query === value && !isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const data = await geocode(query, { mode, countryCode, limit: 6 });
        setResults(data || []);
        setIsOpen(true);
      } catch (err) {
        setError('No se pudieron cargar los resultados');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, mode, countryCode]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) {
      onChange(val);
    }
  };

  const handleSelect = (item) => {
    const display = item.display_name || item.name;
    setQuery(display);
    setIsOpen(false);
    if (onChange) onChange(display);
    if (onAddressSelect) {
      onAddressSelect({
        address: display,
        department: item.department,
        city: item.city,
        neighborhood: item.neighborhood,
        lat: item.lat,
        lng: item.lng
      });
    }
  };

  return (
    <div className={`universal-address-autocomplete ${className}`} ref={wrapperRef} style={{ position: 'relative' }}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          {label} {required && <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={effectivePlaceholder}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            background: 'var(--color-surface, #1e293b)',
            borderColor: 'var(--color-border, #334155)',
            color: 'var(--color-text, #f8fafc)',
            paddingRight: loading ? '36px' : '12px'
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span>
          </div>
        )}
      </div>

      {error && <p className="text-xs mt-1" style={{ color: 'var(--color-danger, #ef4444)' }}>{error}</p>}

      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{
            background: 'var(--color-surface, #1e293b)',
            borderColor: 'var(--color-border, #334155)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          {results.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 text-sm cursor-pointer border-b last:border-0 hover:bg-slate-700/50 transition-colors"
              style={{ borderColor: 'var(--color-border, #334155)', color: 'var(--color-text, #f8fafc)' }}
            >
              <div className="font-semibold text-xs text-orange-400">{item.name}</div>
              <div className="text-xs opacity-75 truncate">{item.display_name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
