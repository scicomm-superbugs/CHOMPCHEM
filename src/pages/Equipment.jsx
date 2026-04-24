import { useState, useRef } from 'react';
import { db, useLiveCollection } from '../db';
import { Package, Search, Trash2, Plus, Download, Upload } from 'lucide-react';
import { exportToCSV, parseCSV, readFileAsText } from '../utils/csvUtils';

export default function Equipment() {
  const [item, setItem] = useState({
    name: '',
    type: '',
    identifier: '',
    status: 'Available',
    department: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const items = useLiveCollection('equipment');

  if (!items) return <div className="page-content container">Loading equipment...</div>;

  const filteredItems = items.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(d => d.identifier === item.identifier)) {
      alert('An item with this identifier is already registered.');
      return;
    }
    try {
      const newItem = {
        ...item,
        id: item.identifier || `EQ-${Date.now()}`
      };
      await db.equipment.add(newItem);
      setSuccessMsg(`✅ Registered ${newItem.name}`);
      setItem({ name: '', type: '', identifier: '', status: 'Available', department: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await db.equipment.delete(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExport = () => {
    const data = items.map(d => ({
      name: d.name,
      type: d.type || '',
      identifier: d.identifier,
      status: d.status,
      department: d.department || ''
    }));
    exportToCSV(data, 'equipment');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      let count = 0;
      for (const row of rows) {
        if (!row.name || !row.identifier) continue;
        if (items.some(d => d.identifier === row.identifier)) continue;
        await db.equipment.add({
          name: row.name,
          type: row.type || '',
          identifier: row.identifier,
          status: row.status || 'Available',
          id: row.identifier || `EQ-${Date.now()}-${count}`,
          department: row.department || ''
        });
        count++;
      }
      setSuccessMsg(`✅ Imported ${count} items`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Lab Equipment & Glassware</h1>

      <div className="two-col-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Plus size={20} /> Register Item</h2>
          </div>
          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input type="text" className="form-control" required value={item.name} onChange={e => setItem({...item, name: e.target.value})} placeholder="e.g. Beaker 500ml" />
            </div>
            <div className="form-group">
              <label className="form-label">Type / Category</label>
              <input type="text" className="form-control" value={item.type} onChange={e => setItem({...item, type: e.target.value})} placeholder="e.g. Glassware" />
            </div>
            <div className="form-group">
              <label className="form-label">Department \ Lab (Optional)</label>
              <input type="text" className="form-control" value={item.department} onChange={e => setItem({...item, department: e.target.value})} placeholder="e.g. Physics Lab" />
            </div>
            <div className="form-group">
              <label className="form-label">Identifier / Code</label>
              <input type="text" className="form-control" required value={item.identifier} onChange={e => setItem({...item, identifier: e.target.value})} placeholder="e.g. GL-001" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Item</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Inventory</h2>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={handleExport}><Download size={14} /> Export</button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => fileInputRef.current.click()}><Upload size={14} /> Import</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleImport} />
            </div>
          </div>
          <div className="search-box">
            <Search size={18} />
            <input type="text" className="form-control" placeholder="Search equipment..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Type & ID</th>
                  <th>Department \ Lab</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? filteredItems.map(d => (
                  <tr key={d.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Package size={18} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {d.type && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.type}</span>}
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4A5568' }}>ID: {d.identifier}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>{d.department || '-'}</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge ${d.status === 'Available' ? 'badge-available' : 'badge-in-use'}`}>{d.status}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <button className="btn btn-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleDelete(d.id)} title="Delete Item"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No equipment registered.</td>
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
