function CustomerDashboard({ customerInfo }) {
  return (
    <section className="dashboard-section">
      <h2>Dashboard</h2>
      {customerInfo ? (
        <div className="customer-card slide-up">
          <div className="card-header">
            <h3>{customerInfo.name}</h3>
            <span className="badge">VIP</span>
          </div>
          <div className="card-body">
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
