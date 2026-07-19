import React, { useState, useEffect } from 'react';

function CaptureHistory() {
  const [history, setHistory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  
  // Popup state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const res = await fetch(`/api/visits?skip=${skip}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch visits');
      const data = await res.json();
      setHistory(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, limit]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(totalCount / limit)) {
      setCurrentPage(newPage);
    }
  };

  const handleSavePurchase = async () => {
    if (!selectedVisit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${selectedVisit.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_details: purchaseDetails })
      });
      if (res.ok) {
        // Update local state to show the new purchase detail
        setHistory(prev => prev.map(v => 
          v.id === selectedVisit.id ? { ...v, purchase_details: purchaseDetails } : v
        ));
        closePopup();
      } else {
        console.error('Failed to save purchase details');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openPopup = (visit) => {
    setSelectedVisit(visit);
    setPurchaseDetails(visit.purchase_details || '');
  };

  const closePopup = () => {
    setSelectedVisit(null);
    setPurchaseDetails('');
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="history-container slide-up">
      <div className="history-controls">
        <h2>All Captures ({totalCount})</h2>
        <div className="limit-selector">
          <label>Show: </label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <p>No captures recorded yet.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-card recognized" onClick={() => openPopup(item)}>
              <div className="history-image-container">
                <img src={item.image_path} alt="Captured face" />
              </div>
              <div className="history-details">
                <div className="history-header">
                  <h4>{item.customer ? item.customer.name : 'Unknown'}</h4>
                  <span className="status-badge recognized">
                    {item.customer ? 'VIP' : 'Unknown'}
                  </span>
                </div>
                <p className="timestamp">{new Date(item.timestamp).toLocaleString()}</p>
                {item.customer && (
                  <p className="visit-info">Visits: {item.customer.visit_count}</p>
                )}
                {item.purchase_details && (
                  <p className="purchase-preview">🛒 {item.purchase_details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pagination-controls">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span className="page-indicator">Page {currentPage} of {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {selectedVisit && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Purchase Details</h3>
            <p><strong>Customer:</strong> {selectedVisit.customer ? selectedVisit.customer.name : 'Unknown'}</p>
            <p><strong>Visit Time:</strong> {new Date(selectedVisit.timestamp).toLocaleString()}</p>
            
            <textarea
              className="purchase-textarea"
              placeholder="E.g., Bought 10g Gold Chain..."
              value={purchaseDetails}
              onChange={(e) => setPurchaseDetails(e.target.value)}
              rows="4"
            />
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closePopup} disabled={saving}>Cancel</button>
              <button className="save-btn" onClick={handleSavePurchase} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaptureHistory;
