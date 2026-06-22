import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { getSites } from '../../services/site.service';
import { getUsers } from '../../services/users.service';
import { sendSafetyAlert } from '../Notifications/NotificationTrigger';
import { API_BASE_URL } from '../../config/api.config.js';
import './CheckIn.css';

const CheckIn = () => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [weather, setWeather] = useState('Loading weather...');
  const videoRef = useRef(null);

  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.stop();
        streamRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Get current user from auth status
        const response = await fetch(`${API_BASE_URL}adm/auth/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const authData = await response.json();
          if (authData.authenticated && authData.user) {
            setCurrentUser({
              name: authData.user.displayName,
              email: authData.user.emailAddress,
              username: authData.user.displayName
            });
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          // GPS coordinates captured
          
          // Fetch weather data via CORS proxy
          try {
            const weatherApiKey = process.env.REACT_APP_WEATHER_API_KEY;
            if (!weatherApiKey) {
              console.warn('Weather API key not configured');
              setWeather('Weather API key not configured');
              return;
            }
            
            // Use CORS proxy to avoid CORS issues
            const weatherResponse = await fetch(
              `https://corsproxy.io/?https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${latitude},${longitude}&aqi=no`
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
          setTimeout(() => setMessage(''), 3000);
          setWeather('Weather unavailable');
        }
      );
    }
  }, []);

  const startScanning = async () => {
    try {
      setMessage('📱 Starting camera...');
      setScanning(true); // Set scanning to true first to render video element
      
      // Wait for video element to be rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!videoRef.current) {
        setMessage('Video element not ready after waiting');
        setTimeout(() => setMessage(''), 3000);
        setScanning(false);
        return;
      }

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setMessage('No camera found on this device');
        setTimeout(() => setMessage(''), 3000);
        setScanning(false);
        return;
      }

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          handleQRDetected(result.data);
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      streamRef.current = qrScanner;
      await qrScanner.start();
      setMessage('📱 Point camera at QR code to check in');
      
    } catch (error) {
      setScanning(false);
      if (error.name === 'NotAllowedError') {
        setMessage('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setMessage('No camera found on this device.');
      } else if (error.name === 'NotSupportedError') {
        setMessage('QR scanning not supported on this device.');
      } else {
        setMessage(`Camera error: ${error.message}`);
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.stop();
      streamRef.current.destroy();
      streamRef.current = null;
    }
    setScanning(false);
    setMessage('📱 Scanner stopped');
    setTimeout(() => setMessage(''), 3000);
  };



  const handleQRDetected = async (qrData) => {
    stopScanning();
    setMessage('🔍 QR Code detected, processing...');

    try {
      let siteAddress, siteLocation, qrId;
      
      // Try to parse as URL first
      try {
        const url = new URL(qrData);
        siteAddress = url.searchParams.get('site');
        siteLocation = url.searchParams.get('location');
        qrId = url.searchParams.get('id');
      } catch (urlError) {
        // If not a URL, try to parse as JSON
        try {
          const jsonData = JSON.parse(qrData);
          siteAddress = jsonData.site;
          siteLocation = jsonData.location;
          qrId = jsonData.id;
        } catch (jsonError) {
          // If neither URL nor JSON, try simple string format
          const parts = qrData.split('|');
          if (parts.length >= 3) {
            siteAddress = parts[0];
            siteLocation = parts[1];
            qrId = parts[2];
          } else {
            setMessage('Invalid QR code format');
            setTimeout(() => setMessage(''), 3000);
            return;
          }
        }
      }
      
      if (!qrId) {
        setMessage('QR code missing required ID information');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      // If no site address, use ID as site identifier
      if (!siteAddress) {
        siteAddress = qrId;
      }

      // Find matching site - prioritize exact matches
      const sites = await getSites();
      
      let site = null;
      
      // First, try exact ID match (highest priority)
      if (qrId) {
        site = sites?.find(s => s.id === qrId);
      }
      
      // If no exact ID match, try site address as ID
      if (!site && siteAddress) {
        site = sites?.find(s => s.id === siteAddress);
      }
      
      // If still no match, try name/location matching (lower priority)
      if (!site) {
        site = sites?.find(s => {
          return (
            (siteLocation && s.location?.toLowerCase() === siteLocation?.toLowerCase()) ||
            (siteAddress && s.name?.toLowerCase() === siteAddress?.toLowerCase()) ||
            (siteAddress && s.address?.toLowerCase() === siteAddress?.toLowerCase())
          );
        });
      }
      
      if (!site) {
        setMessage('Site not found in system');
        setTimeout(() => setMessage(''), 3000);
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
      setMessage('Error processing QR code');
      setTimeout(() => setMessage(''), 3000);
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
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`Check-in failed: ${data.error}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Network error during check-in');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: 'clamp(0.75rem, 3vw, 1rem)', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 'clamp(1.125rem, 4vw, 1.5rem)', marginTop: 0, marginBottom: 'clamp(0.75rem, 3vw, 1rem)' }}>QR Check-In Scanner</h2>
      
      {message && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '15px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('📱') ? '#d1ecf1' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : message.includes('📱') ? '#bee5eb' : '#f5c6cb'}`,
          borderRadius: '4px',
          whiteSpace: 'pre-line',
          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
          wordBreak: 'break-word'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <strong style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Auto-Captured Data:</strong>
        <div style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', marginTop: '8px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '4px' }}>👤 User: {currentUser?.username || currentUser?.name || 'Loading...'}</div>
          <div style={{ marginBottom: '4px' }}>📍 GPS: {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}</div>
          <div style={{ marginBottom: '4px' }}>🌤️ Weather: {weather}</div>
          <div>🕐 Ready to scan at: {new Date().toLocaleString()}</div>
        </div>
      </div>

      {!scanning ? (
        <button
          onClick={startScanning}
          style={{
            width: '100%',
            padding: 'clamp(12px, 3vw, 15px)',
            backgroundColor: '#2DBE60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'clamp(0.875rem, 4vw, 1rem)',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1E8E4A'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2DBE60'}
        >
          📱 Start QR Scanner
        </button>
      ) : (
        <div>
          <div className="qr-scanner-container" style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: 'clamp(300px, 60vh, 400px)',
                backgroundColor: '#000',
                borderRadius: '4px',
                marginBottom: '10px',
                objectFit: 'cover'
              }}
            />
            {/* Custom scanning overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '3px solid #00ff00',
              borderRadius: '8px',
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }} />
            {/* Instruction text */}
            <div style={{
              position: 'absolute',
              bottom: 'clamp(20px, 5vh, 30px)',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: 'clamp(8px, 2vw, 10px) clamp(15px, 4vw, 20px)',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '90%'
            }}>
              Point camera at QR code
            </div>
          </div>
          <button
            onClick={stopScanning}
            style={{
              width: '100%',
              padding: 'clamp(10px, 2.5vw, 12px)',
              backgroundColor: '#E31E24',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#B71C1C'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E31E24'}
          >
            ❌ Stop Scanner
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckIn;