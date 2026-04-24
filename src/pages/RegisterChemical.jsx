import { useState, useRef } from 'react';
import { db, useLiveCollection } from '../db';
import { chemicalDictionary } from '../utils/chemicalDictionary';
import { calculateMolecularWeight } from '../utils/formulaParser';
import SmilesViewer from '../components/SmilesViewer';
import { Plus, Search, AlertCircle, CheckCircle, Trash2, Download, Upload } from 'lucide-react';
import { exportToCSV, parseCSV, readFileAsText } from '../utils/csvUtils';

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
    properties: '',
    department: ''
  });

  // Load all registered chemicals
  const chemicals = useLiveCollection('chemicals') || [];
  const [searchTerm, setSearchTerm] = useState('');
  const csvInputRef = useRef(null);

  const filteredChemicals = chemicals.filter(c => 
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
          properties: exactMatch.properties || '',
          department: ''
        });
      } else {
        // Try to calculate MW for unknown formula
        const calculatedMw = calculateMolecularWeight(val);
        setChemData({
          name: '',
          mw: calculatedMw || '',
          smiles: '',
          hazards: '',
          properties: '',
          department: ''
        });
      }
    } else {
      setSuggestions([]);
      setChemData({ name: '', mw: '', smiles: '', hazards: '', properties: '', department: '' });
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormula(suggestion.formula);
    setChemData({
      name: suggestion.name,
      mw: suggestion.mw,
      smiles: suggestion.smiles || '',
      hazards: suggestion.hazards || '',
      properties: suggestion.properties || '',
      department: ''
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
        properties: chemData.properties,
        department: chemData.department || ''
      });
      setSuccessMsg(`Successfully registered ${formula}`);
      setFormula('');
      setChemData({ name: '', mw: '', smiles: '', hazards: '', properties: '', department: '' });
    } catch (err) {
      setError('Failed to register chemical. ' + err.message);
    }
  };

  const handleDelete = async (formula) => {
    if (window.confirm(`Are you sure you want to delete ${formula}?`)) {
      try {
        await db.chemicals.delete(formula);
        setSuccessMsg(`Deleted ${formula}`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setError('Failed to delete chemical. ' + err.message);
      }
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
              <label className="form-label">Department \ Lab (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                value={chemData.department}
                onChange={e => setChemData({...chemData, department: e.target.value})}
                placeholder="e.g. Analytical Chemistry"
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
            <h2 className="card-title">Registered Compounds</h2>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => {
                const data = chemicals.map(c => ({ formula: c.formula, name: c.name, mw: c.mw, hazards: c.hazards || '', smiles: c.smiles || '', properties: c.properties || '', department: c.department || '' }));
                exportToCSV(data, 'chemicals');
              }}><Download size={14} /> Export</button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => csvInputRef.current.click()}><Upload size={14} /> Import</button>
              <input type="file" ref={csvInputRef} style={{ display: 'none' }} accept=".csv" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const text = await readFileAsText(file);
                  const rows = parseCSV(text);
                  let count = 0;
                  for (const row of rows) {
                    if (!row.formula || !row.name) continue;
                    if (chemicals.some(c => c.formula === row.formula)) continue;
                    await db.chemicals.add({ formula: row.formula, name: row.name, mw: row.mw || '', hazards: row.hazards || '', smiles: row.smiles || '', properties: row.properties || '', department: row.department || '' });
                    count++;
                  }
                  alert(`✅ Imported ${count} chemicals`);
                } catch (err) { alert('Import failed: ' + err.message); }
                e.target.value = '';
              }} />
            </div>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input type="text" className="form-control" placeholder="Search by formula or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Formula</th>
                  <th>Name</th>
                  <th>Properties (MW & Hazards)</th>
                  <th>Department \ Lab</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChemicals.length > 0 ? filteredChemicals.map(c => (
                  <tr key={c.formula}>
                    <td style={{ width: '80px', verticalAlign: 'middle' }}>
                      <SmilesViewer smiles={c.smiles} width={64} height={56} />
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', verticalAlign: 'middle' }}>
                      {c.formula}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>{c.name}</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-color)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>MW {c.mw}</span>
                        {c.hazards && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', backgroundColor: 'rgba(229, 62, 62, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(229, 62, 62, 0.2)' }}>{c.hazards}</span>}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>{c.department || '-'}</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <button className="btn btn-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleDelete(c.formula)} title="Delete Compound"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No compounds registered.</td>
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
