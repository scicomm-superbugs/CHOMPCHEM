import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { chemicalDictionary } from '../utils/chemicalDictionary';
import { calculateMolecularWeight } from '../utils/formulaParser';
import SmilesViewer from '../components/SmilesViewer';
import { Plus, Search, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterChemical() {
  const [formula, setFormula] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Chemical data fields
  const [chemData, setChemData] = useState({
    name: '',
    mw: '',
    smiles: '',
    hazards: '',
    properties: ''
  });

  // Load all registered chemicals
  const registeredChemicals = useLiveQuery(() => db.chemicals.toArray()) || [];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChemicals = registeredChemicals.filter(c => 
    c.formula.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle formula input change
  const handleFormulaChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); // letters and numbers only
    setFormula(val);
    setError('');
    setSuccessMsg('');

    if (val.length > 0) {
      const matches = chemicalDictionary.filter(c => 
        c.formula.toLowerCase().startsWith(val.toLowerCase())
      );
      setSuggestions(matches);
      
      // Auto-fill logic if exact match in dictionary
      const exactMatch = chemicalDictionary.find(c => c.formula.toLowerCase() === val.toLowerCase());
      if (exactMatch) {
        setChemData({
          name: exactMatch.name,
          mw: exactMatch.mw,
          smiles: exactMatch.smiles || '',
          hazards: exactMatch.hazards || '',
          properties: exactMatch.properties || ''
        });
      } else {
        // Try to calculate MW for unknown formula
        const calculatedMw = calculateMolecularWeight(val);
        setChemData({
          name: '',
          mw: calculatedMw || '',
          smiles: '',
          hazards: '',
          properties: ''
        });
      }
    } else {
      setSuggestions([]);
      setChemData({ name: '', mw: '', smiles: '', hazards: '', properties: '' });
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormula(suggestion.formula);
    setChemData({
      name: suggestion.name,
      mw: suggestion.mw,
      smiles: suggestion.smiles || '',
      hazards: suggestion.hazards || '',
      properties: suggestion.properties || ''
    });
    setSuggestions([]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formula) {
      setError('Formula is required');
      return;
    }
    
    // Check for duplicates
    const existing = await db.chemicals.get(formula);
    if (existing) {
      setError('This chemical is already registered.');
      return;
    }

    try {
      await db.chemicals.add({
        formula,
        name: chemData.name || 'Unknown',
        mw: chemData.mw || 0,
        smiles: chemData.smiles,
        hazards: chemData.hazards,
        properties: chemData.properties
      });
      setSuccessMsg(`Successfully registered ${formula}`);
      setFormula('');
      setChemData({ name: '', mw: '', smiles: '', hazards: '', properties: '' });
    } catch (err) {
      setError('Failed to register chemical. ' + err.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Chemical Inventory</h1>

      <div className="two-col-grid">
        {/* Registration Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Plus size={20} /> Register Chemical</h2>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FED7D7', color: '#822727', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Chemical Formula</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. H2O" 
                value={formula}
                onChange={handleFormulaChange}
                required
              />
              {suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map(s => (
                    <div key={s.formula} className="suggestion-item" onClick={() => selectSuggestion(s)}>
                      <strong>{s.formula}</strong> - {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Chemical Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={chemData.name}
                onChange={e => setChemData({...chemData, name: e.target.value})}
                placeholder="Enter name (auto-filled if known)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Molecular Weight (g/mol)</label>
              <input 
                type="number" 
                step="0.001"
                className="form-control" 
                value={chemData.mw}
                onChange={e => setChemData({...chemData, mw: e.target.value})}
                placeholder="Calculated automatically"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hazards</label>
              <input 
                type="text" 
                className="form-control" 
                value={chemData.hazards}
                onChange={e => setChemData({...chemData, hazards: e.target.value})}
                placeholder="e.g. Corrosive, Flammable"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Structure (SMILES)</label>
              <input 
                type="text" 
                className="form-control" 
                value={chemData.smiles}
                onChange={e => setChemData({...chemData, smiles: e.target.value})}
                placeholder="e.g. CCO"
              />
            </div>

            {chemData.smiles && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Structure Preview</label>
                <div style={{ display: 'inline-block' }}>
                  <SmilesViewer smiles={chemData.smiles} width={250} height={200} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Register Compound
            </button>
          </form>
        </div>

        {/* Inventory List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Registered Compounds ({filteredChemicals.length})</h2>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by formula or name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Formula</th>
                  <th>Name</th>
                  <th>MW (g/mol)</th>
                  <th>Structure</th>
                </tr>
              </thead>
              <tbody>
                {filteredChemicals.length > 0 ? (
                  filteredChemicals.map(c => (
                    <tr key={c.formula}>
                      <td><strong style={{ color: 'var(--primary)' }}>{c.formula}</strong></td>
                      <td>
                        <div>{c.name}</div>
                        {c.hazards && <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{c.hazards}</div>}
                      </td>
                      <td>{c.mw}</td>
                      <td>
                        {c.smiles ? (
                          <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                            <SmilesViewer smiles={c.smiles} width={100} height={80} />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No chemicals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
