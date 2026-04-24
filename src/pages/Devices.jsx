import { useState } from 'react';
import { db, useLiveCollection } from '../db';
import { Monitor, Search, Trash2, Plus } from 'lucide-react';

export default function Devices() {
  const [device, setDevice] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'Available'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const devices = useLiveCollection('devices');

  if (!devices) return <div className="page-content container">Loading devices...</div>;

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newDevice = {
        ...device,
        id: device.serialNumber || `DEV-${Date.now()}`
      };
      await db.devices.add(newDevice);
      setSuccessMsg(`Registered ${newDevice.name}`);
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

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Lab Devices</h1>

      <div className="two-col-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Plus size={20} /> Register Device</h2>
          </div>
          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
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
          </div>
          <div className="search-box">
            <Search size={18} />
            <input type="text" className="form-control" placeholder="Search devices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Model</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length > 0 ? filteredDevices.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ backgroundColor: 'var(--secondary)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                          <Monitor size={16} />
                        </div>
                        <strong>{d.name}</strong>
                      </div>
                    </td>
                    <td>{d.model || '-'}</td>
                    <td>{d.serialNumber}</td>
                    <td><span className={`badge ${d.status === 'Available' ? 'badge-available' : 'badge-in-use'}`}>{d.status}</span></td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.5rem' }} onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No devices found.</td>
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
