import { useState } from 'react';

function RegistrationForm({ onRegister, onCancel, loading }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRegister(name, details, phone, address);
  };

  return (
    <section className="dashboard-section slide-up">
      <h2>Register New Customer</h2>
      <form onSubmit={handleSubmit} className="registration-form customer-card">
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="e.g. John Doe"
            disabled={loading}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="+1 234 567 8900"
            disabled={loading}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            placeholder="123 Main St, City"
            disabled={loading}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Additional Details</label>
          <textarea 
            value={details} 
            onChange={(e) => setDetails(e.target.value)} 
            placeholder="Preferences, notes..."
            disabled={loading}
            className="form-input"
            rows="3"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn primary-btn" disabled={loading || !name.trim()}>
            {loading ? 'Registering...' : 'Register Customer'}
          </button>
          <button type="button" className="btn secondary-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default RegistrationForm;
