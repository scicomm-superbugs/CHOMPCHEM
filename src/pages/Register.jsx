import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, redirect
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Check if username exists
    const existing = await db.scientists.where('username').equals(formData.username).first();
    if (existing) {
      setError('Username already exists');
      return;
    }

    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(formData.password, salt);

      await db.scientists.add({
        username: formData.username,
        passwordHash: hash,
        name: formData.name,
        department: formData.department,
        role: 'scientist', // New registrations are standard scientists
        employeeId: ''
      });

      // Redirect to login
      navigate('/login');
    } catch (err) {
      setError('Registration failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 150px)', padding: '2rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="COMPCHEM" style={{ height: '50px', marginBottom: '1rem' }} onError={e => e.target.style.display='none'}/>
          <h2>Scientist Registration</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create a new account</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FED7D7', color: '#822727', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" name="name" required value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" name="username" required value={formData.username} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Department (Optional)</label>
            <input type="text" className="form-control" name="department" value={formData.department} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" name="password" required value={formData.password} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-control" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            Create Account
          </button>
        </form>
        
        <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
