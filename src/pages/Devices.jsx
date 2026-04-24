import { useState, useRef } from 'react';
import { db, useLiveCollection } from '../db';
import { Monitor, Search, Trash2, Plus, Download, Upload } from 'lucide-react';
import { exportToCSV, parseCSV, readFileAsText } from '../utils/csvUtils';

export default function Devices() {
  const [device, setDevice] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'Available'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const devices = useLiveCollection('devices');

  if (!devices) return <div className="page-content container">Loading devices...</div>;

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (devices.some(d => d.serialNumber === device.serialNumber)) {
      alert('A device with this serial number is already registered.');
      return;
    }
    try {
      const newDevice = {
        ...device,
        id: device.serialNumber || `DEV-${Date.now()}`
      };
      await db.devices.add(newDevice);
      setSuccessMsg(`✅ Registered ${newDevice.name}`);
      setDevice({ name: '', model: '', serialNumber: '', status: 'Available' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await db.devices.delete(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExport = () => {
    const data = devices.map(d => ({
      name: d.name,
      model: d.model || '',
      serialNumber: d.serialNumber,
      status: d.status
    }));
    exportToCSV(data, 'devices');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      let count = 0;
      for (const row of rows) {
        if (!row.name || !row.serialNumber) continue;
        if (devices.some(d => d.serialNumber === row.serialNumber)) continue;
        await db.devices.add({
          name: row.name,
          model: row.model || '',
          serialNumber: row.serialNumber,
          status: row.status || 'Available',
          id: row.serialNumber || `DEV-${Date.now()}-${count}`
        });
        count++;
      }
      setSuccessMsg(`✅ Imported ${count} devices`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Lab Devices</h1>

      <div className="two-col-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Plus size={20} /> Register Device</h2>
          </div>
          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Device Name</label>
              <input type="text" className="form-control" required value={device.name} onChange={e => setDevice({...device, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Model (Optional)</label>
              <input type="text" className="form-control" value={device.model} onChange={e => setDevice({...device, model: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input type="text" className="form-control" required value={device.serialNumber} onChange={e => setDevice({...device, serialNumber: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Device</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Device Directory ({filteredDevices.length})</h2>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={handleExport}><Download size={14} /> Export</button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => fileInputRef.current.click()}><Upload size={14} /> Import</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleImport} />
            </div>
          </div>
          <div className="search-box">
            <Search size={18} />
            <input type="text" className="form-control" placeholder="Search devices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {/* Device list */}
          <div className="mobile-card-list">
            {filteredDevices.length > 0 ? filteredDevices.map(d => (
              <div key={d.id} className="mobile-list-item" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <Monitor size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{d.name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      {d.model && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: '#F7FAFC', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #EDF2F7' }}>{d.model}</span>}
                      <span style={{ fontSize: '0.68rem', color: '#4A5568', fontFamily: 'monospace', backgroundColor: '#F7FAFC', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #EDF2F7' }}>SN {d.serialNumber}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <span className={`badge ${d.status === 'Available' ? 'badge-available' : 'badge-in-use'}`}>{d.status}</span>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.35rem' }} onClick={() => handleDelete(d.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No devices registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
