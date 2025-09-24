import React, { useState, useEffect, useRef } from 'react';
import { getSites } from '../../services/site.service';
import { getUsers } from '../../services/users.service';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadUserAndLocation = async () => {
      try {
        const users = await getUsers();
        const userEmail = localStorage.getItem('user_email');
        const user = users?.find(u => u.email === userEmail);
        setCurrentUser(user);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => console.error('GPS error:', error)
          );
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserAndLocation();
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setScanning(true);
      setMessage('📱 Point camera at site QR code');
      
      setTimeout(() => scanForQR(), 1000);
    } catch (error) {
      setMessage('❌ Camera access denied');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const scanForQR = () => {
    if (!scanning || !videoRef.current) return;

    // Simulate QR detection with your existing format
    if (Math.random() < 0.1) {
      const mockQRData = 'http://localhost:3000/inspection?site=Construction%20Site%20A&location=Downtown%20Plaza&id=12345-abcd-6789';
      handleQRDetected(mockQRData);
    } else {
      setTimeout(() => scanForQR(), 100);
    }
  };

  const handleQRDetected = async (qrData) => {
    stopScanning();
    setMessage('🔍 QR Code detected, processing...');

    try {
      // Parse your existing QR format
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

      // Get weather data
      let weather = 'Weather unavailable';
      if (location) {
        try {
          const weatherResponse = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=5adfd2a4772e480fa65123538252209&q=${location.latitude},${location.longitude}&aqi=no`
          );
          const weatherData = await weatherResponse.json();
          weather = `${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C`;
        } catch (error) {
          console.error('Weather error:', error);
        }
      }

      // Submit check-in
      await submitCheckIn({
        qr_scan_id: qrId,
        site_id: site.id,
        user_name: currentUser?.name || 'Unknown User',
        user_role: 'Inspector',
        gps_latitude: location?.latitude,
        gps_longitude: location?.longitude,
        weather: weather
      }, site);

    } catch (error) {
      setMessage('❌ Error processing QR code');
    }
  };

  const submitCheckIn = async (checkInData, site) => {
    try {
      const response = await fetch('http://localhost:5004/checkins/scan', {
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
      } else {
        setMessage(`❌ Check-in failed: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error during check-in');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>QR Code Scanner</h2>
      
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
        <strong>Ready to Scan:</strong>
        <div>👤 User: {currentUser?.name || 'Loading...'}</div>
        <div>📍 GPS: {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}</div>
        <div>🕐 Time: {new Date().toLocaleString()}</div>
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '300px',
              backgroundColor: '#000',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          />
          <button
            onClick={stopScanning}
            style={{
              width: '100%',
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
      )}
    </div>
  );
};

export default QRScanner;