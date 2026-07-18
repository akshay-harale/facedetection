import { useState } from 'react';

function RegistrationForm({ onRegister, onCancel, loading }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRegister(name, details);
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
          <label>Additional Details</label>
          <textarea 
            value={details} 
            onChange={(e) => setDetails(e.target.value)} 
            placeholder="Preferences, contact info..."
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
