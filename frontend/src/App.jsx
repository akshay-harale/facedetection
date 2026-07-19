import { useState, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import CustomerDashboard from './components/CustomerDashboard';
import RegistrationForm from './components/RegistrationForm';
import CaptureHistory from './components/CaptureHistory';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('capture');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [unrecognizedImage, setUnrecognizedImage] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates from Camera Worker
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws'
      : `${protocol}//${window.location.host}/ws`;
      
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'recognized') {
        setCustomerInfo(data.customer);
        const imageUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${data.image_url}` : data.image_url;
        setCapturedImageUrl(imageUrl);
        setUnrecognizedImage(null);
      } else if (data.status === 'unrecognized') {
        // Unknown visit broadcasted from camera worker
        if (data.image_url) {
          const imageUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${data.image_url}` : data.image_url;
          setCapturedImageUrl(imageUrl);
          
          // Fetch the image and convert to Blob for the registration form
          fetch(imageUrl)
            .then(res => res.blob())
            .then(blob => {
              // Create a File object from the Blob
              const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
              setUnrecognizedImage(file);
            })
            .catch(err => console.error("Error fetching unrecognized image:", err));
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

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
        const newUrl = URL.createObjectURL(fileOrBlob);
        setCapturedImageUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      } else {
        // status is "unrecognized"
        setUnrecognizedImage(fileOrBlob);
        const newUrl = URL.createObjectURL(fileOrBlob);
        setCapturedImageUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCustomer = async (name, details, phone, address) => {
    if (!unrecognizedImage) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', unrecognizedImage, 'capture.jpg');
    formData.append('name', name);
    if (details) formData.append('details', details);
    if (phone) formData.append('phone', phone);
    if (address) formData.append('address', address);

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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Aura Gold</h1>
          <span className="subtitle">ID System</span>
        </div>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
            onClick={() => setActiveTab('capture')}
          >
            Live Capture
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            All Captures
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-grid">
          {activeTab === 'capture' ? (
            <>
              <div className="left-panel">
                <CameraCapture 
                  onCapture={handleRecognizeCustomer} 
                  loading={loading} 
                  error={error} 
                />
              </div>
              <div className="right-panel">
                {unrecognizedImage ? (
                  <RegistrationForm 
                    onRegister={handleRegisterCustomer} 
                    onCancel={cancelRegistration}
                    loading={loading} 
                  />
                ) : (
                  <CustomerDashboard 
                    customerInfo={customerInfo} 
                    capturedImageUrl={capturedImageUrl}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="history-panel">
              <CaptureHistory />
            </div>
          )}
        </div>
      </main>
      
      {/* Background decoration kept subtle */}
      <div className="bg-bubbles">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
      </div>
    </div>
  );
}

export default App;
