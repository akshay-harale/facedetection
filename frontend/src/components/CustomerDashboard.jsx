import { useState, useEffect } from 'react';

function CustomerDashboard({ customerInfo, capturedImageUrl }) {
  const [history, setHistory] = useState([]);
  const [purchaseText, setPurchaseText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerInfo && customerInfo.id) {
      fetchHistory(customerInfo.id);
    } else {
      setHistory([]);
    }
  }, [customerInfo]);

  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleAddPurchase = async () => {
    if (!purchaseText.trim() || !customerInfo) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerInfo.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_details: purchaseText })
      });
      if (res.ok) {
        setPurchaseText('');
        fetchHistory(customerInfo.id);
      }
    } catch (err) {
      console.error("Failed to add purchase:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-section">
      <h2>Dashboard</h2>
      {customerInfo ? (
        <div className="customer-card slide-up" style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto' }}>
          {capturedImageUrl && (
            <div className="captured-image-container">
              <img src={capturedImageUrl} alt="Captured" className="captured-image" />
            </div>
          )}
          
          <div className="card-header">
            <h3>{customerInfo.name}</h3>
            <span className="badge">VIP</span>
          </div>

          <div className="card-body">
            {customerInfo.phone && (
              <div className="stat">
                <span className="label">Phone</span>
                <span className="value">{customerInfo.phone}</span>
              </div>
            )}
            {customerInfo.address && (
              <div className="stat">
                <span className="label">Address</span>
                <span className="value">{customerInfo.address}</span>
              </div>
            )}
            <div className="stat">
              <span className="label">Total Visits</span>
              <span className="value">{customerInfo.visit_count}</span>
            </div>
            <div className="stat">
              <span className="label">Last Visit</span>
              <span className="value">
                {new Date(customerInfo.last_visit).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="purchase-section" style={{ marginTop: '2rem' }}>
            <h4>Add Purchase Details</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input 
                type="text" 
                value={purchaseText} 
                onChange={e => setPurchaseText(e.target.value)} 
                placeholder="e.g. 2 Gold Rings" 
                className="form-input" 
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button 
                onClick={handleAddPurchase} 
                className="btn primary-btn" 
                style={{ padding: '0.5rem 1rem' }}
                disabled={loading || !purchaseText.trim()}
              >
                {loading ? '...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="visit-history" style={{ marginTop: '2rem' }}>
            <h4>Visit History</h4>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>No history found.</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map(visit => (
                  <li key={visit.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)', display: 'flex', gap: '1rem' }}>
                    {visit.image_path && (
                      <div className="history-image-container" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                        <img src={visit.image_path} alt="Visit capture" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        {new Date(visit.timestamp).toLocaleString()}
                      </div>
                      {visit.purchase_details ? (
                        <div><strong>Purchases:</strong> {visit.purchase_details}</div>
                      ) : (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No purchases recorded</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Waiting for customer identification...</p>
        </div>
      )}
    </section>
  );
}

export default CustomerDashboard;
