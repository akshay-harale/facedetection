import { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture, loading, error }) {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      console.error("Unable to access camera", err);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      console.error("Video not ready or has 0 dimensions.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
      } else {
        console.error("Failed to generate image blob from canvas.");
      }
    }, 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <section className="capture-section">
      <h2>Identify Customer</h2>
      
      <div className="video-container">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline className="video-preview" />
        ) : (
          <div className="video-placeholder">Camera Offline</div>
        )}
      </div>

      <div className="controls">
        {!stream ? (
          <button className="btn primary-btn" onClick={startCamera}>Start Camera</button>
        ) : (
          <>
            <button className="btn primary-btn pulse" onClick={handleCapture} disabled={loading}>
              Capture & Identify
            </button>
            <button className="btn secondary-btn" onClick={stopCamera}>Stop Camera</button>
          </>
        )}
      </div>

      <div className="upload-section">
        <span className="divider">OR</span>
        <label className="btn outline-btn upload-btn">
          Upload Photo
          <input type="file" accept="image/*" onChange={handleFileUpload} hidden disabled={loading} />
        </label>
      </div>

      {loading && <div className="loader">Identifying...</div>}
      {error && <div className="error-message">{error}</div>}
    </section>
  );
}

export default CameraCapture;
