import { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import CustomerDashboard from './components/CustomerDashboard';
import RegistrationForm from './components/RegistrationForm';
import './App.css';

function App() {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [unrecognizedImage, setUnrecognizedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRecognizeCustomer = async (fileOrBlob) => {
    setLoading(true);
    setError(null);
    setCustomerInfo(null);
    setUnrecognizedImage(null);

    const formData = new FormData();
    formData.append('file', fileOrBlob, 'capture.jpg');

    try {
      const response = await fetch('/api/recognize', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to reach recognition server');
      }
      const data = await response.json();
      
      if (data.status === 'recognized') {
        setCustomerInfo(data.customer);
      } else {
        // status is "unrecognized"
        setUnrecognizedImage(fileOrBlob);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCustomer = async (name, details) => {
    if (!unrecognizedImage) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', unrecognizedImage, 'capture.jpg');
    formData.append('name', name);
    formData.append('details', details);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      const data = await response.json();
      if (data.status === 'success') {
        setCustomerInfo(data.customer);
        setUnrecognizedImage(null);
      } else {
        throw new Error('Failed to register customer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelRegistration = () => {
    setUnrecognizedImage(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <div className="glass-panel main-panel">
        <header>
          <h1>Aura Gold Shop</h1>
          <p>Premium Customer Identification System</p>
        </header>

        <div className="content">
          <CameraCapture 
            onCapture={handleRecognizeCustomer} 
            loading={loading} 
            error={error} 
          />
          {unrecognizedImage ? (
            <RegistrationForm 
              onRegister={handleRegisterCustomer} 
              onCancel={cancelRegistration}
              loading={loading} 
            />
          ) : (
            <CustomerDashboard 
              customerInfo={customerInfo} 
            />
          )}
        </div>
      </div>
      <div className="bg-bubbles">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
        <div className="bubble b3"></div>
      </div>
    </div>
  );
}

export default App;
