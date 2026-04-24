import { useState, useRef } from 'react';
import { db, useLiveCollection } from '../db';
import { Monitor, Search, Trash2, Plus, Download, Upload } from 'lucide-react';
import { exportToCSV, parseCSV, readFileAsText } from '../utils/csvUtils';

export default function Devices() {
  const [device, setDevice] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'Available',
    department: ''
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
      setDevice({ name: '', model: '', serialNumber: '', status: 'Available', department: '' });
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
      status: d.status,
      department: d.department || ''
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
          id: row.serialNumber || `DEV-${Date.now()}-${count}`,
          department: row.department || ''
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
              <label className="form-label">Department \ Lab (Optional)</label>
              <input type="text" className="form-control" value={device.department} onChange={e => setDevice({...device, department: e.target.value})} placeholder="e.g. Physics Lab" />
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
            <h2 className="card-title">Device Directory</h2>
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Model & SN</th>
                  <th>Department \ Lab</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length > 0 ? filteredDevices.map(d => (
                  <tr key={d.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Monitor size={18} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {d.model && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Model: {d.model}</span>}
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4A5568' }}>SN: {d.serialNumber}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>{d.department || '-'}</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge ${d.status === 'Available' ? 'badge-available' : 'badge-in-use'}`}>{d.status}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <button className="btn btn-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleDelete(d.id)} title="Delete Device"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No devices registered.</td>
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
