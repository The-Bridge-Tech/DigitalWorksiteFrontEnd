import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { getSites } from '../../services/site.service';
import { getUsers } from '../../services/users.service';
import { sendSafetyAlert } from '../Notifications/NotificationTrigger';
import { API_BASE_URL } from '../../config/api.config.js';

const CheckIn = () => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [weather, setWeather] = useState('Loading weather...');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadUserAndLocation = async () => {
      try {
        const users = await getUsers();
        const userEmail = localStorage.getItem('user_email');
        const user = users?.find(u => u.email === userEmail);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserAndLocation();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          // GPS coordinates captured
          
          // Fetch weather data
          try {
            const weatherApiKey = process.env.REACT_APP_WEATHER_API_KEY;
            if (!weatherApiKey) {
              console.warn('Weather API key not configured');
              setWeather('Weather API key not configured');
              return;
            }
            
            const weatherResponse = await fetch(
              `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${latitude},${longitude}&aqi=no`
            );
            const weatherData = await weatherResponse.json();
            setWeather(`${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C`);
          } catch (error) {
            console.error('Weather error:', error);
            setWeather('Weather unavailable');
          }
        },
        (error) => {
          console.error('GPS error:', error);
          setMessage('Could not get GPS location');
          setWeather('Weather unavailable');
        }
      );
    }
  }, []);

  const startScanning = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('Camera access granted');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded, starting scan');
          setScanning(true);
          setMessage('📱 Point camera at QR code to check in');
          setTimeout(() => scanForQR(), 1000);
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        setMessage('❌ Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setMessage('❌ No camera found on this device.');
      } else {
        setMessage(`❌ Camera error: ${error.message}`);
      }
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const scanForQR = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      if (scanning) setTimeout(() => scanForQR(), 100);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log('Scanning frame:', canvas.width, 'x', canvas.height);
      
      // Real QR detection using jsQR
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'dontInvert'
      });
      if (code) {
        console.log('QR Code detected:', code.data);
        setMessage('✅ QR Code found: ' + code.data);
        handleQRDetected(code.data);
        return;
      }
    } else {
      console.log('Video not ready:', video.readyState);
    }
    
    if (scanning) {
      setTimeout(() => scanForQR(), 200);
    }
  };

  const handleQRDetected = async (qrData) => {
    stopScanning();
    setMessage('🔍 QR Code detected, processing...');

    try {
      // Parse existing QR format
      const url = new URL(qrData);
      const siteAddress = url.searchParams.get('site');
      const siteLocation = url.searchParams.get('location');
      const qrId = url.searchParams.get('id');
      
      if (!siteAddress || !qrId) {
        setMessage('❌ Invalid QR code format');
        return;
      }

      // Find matching site
      const sites = await getSites();
      const site = sites?.find(s => 
        s.location?.toLowerCase().includes(siteLocation?.toLowerCase()) ||
        s.name?.toLowerCase().includes(siteAddress?.toLowerCase())
      );
      
      if (!site) {
        setMessage('❌ Site not found in system');
        return;
      }

      await submitCheckIn({
        qr_scan_id: qrId,
        site_id: site.id,
        user_name: currentUser?.name || 'Unknown User',
        user_role: 'Inspector',
        gps_latitude: location?.latitude,
        gps_longitude: location?.longitude
      }, site);
    } catch (error) {
      setMessage('❌ Error processing QR code');
    }
  };

  const submitCheckIn = async (checkInData, site) => {
    try {
      const response = await fetch(`${API_BASE_URL}/checkins/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(checkInData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Check-in successful at ${site.name}\n📍 ${site.location}\n🕐 ${new Date().toLocaleString()}`);
        
        // Check for severe weather and trigger safety alert
        if (weather && (weather.toLowerCase().includes('storm') || 
            weather.toLowerCase().includes('severe') || 
            weather.toLowerCase().includes('heavy rain') ||
            weather.toLowerCase().includes('snow'))) {
          sendSafetyAlert({
            site_id: site.id,
            weather_conditions: weather
          });
        }
      } else {
        setMessage(`❌ Check-in failed: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error during check-in');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>QR Check-In Scanner</h2>
      
      {message && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#d1ecf1',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : message.includes('❌') ? '#f5c6cb' : '#bee5eb'}`,
          borderRadius: '4px',
          whiteSpace: 'pre-line',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <strong>Auto-Captured Data:</strong>
        <div>👤 User: {currentUser?.name || 'Loading...'}</div>
        <div>📍 GPS: {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}</div>
        <div>🌤️ Weather: {weather}</div>
        <div>🕐 Ready to scan at: {new Date().toLocaleString()}</div>
      </div>

      {!scanning ? (
        <button
          onClick={startScanning}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          📱 Start QR Scanner
        </button>
      ) : (
        <div>
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#000',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #00ff00',
              width: '200px',
              height: '200px',
              borderRadius: '8px',
              pointerEvents: 'none'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleQRDetected('http://example.com?site=TestSite&location=TestLocation&id=12345')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🧪 Test QR
            </button>
            <button
              onClick={stopScanning}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ❌ Stop Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn;