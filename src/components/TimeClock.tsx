'use client';

import { useState, useEffect, useRef } from 'react';

interface TimeClockProps {
  techId: string;
  shopId: string;
  techName: string;
}

export default function TimeClock({ techId, shopId, techName }: TimeClockProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [breakTime, setBreakTime] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [photoEnabled, setPhotoEnabled] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [shopLocation, setShopLocation] = useState<{lat: number, lon: number} | null>(null);
  const [gpsRadius, setGpsRadius] = useState(30.48); // 100 feet in meters
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    checkClockStatus();
    fetchShopSettings();
  }, [techId]);

  useEffect(() => {
    if (isClockedIn && currentEntry) {
      const interval = setInterval(() => {
        const now = new Date();
        const clockInTime = new Date(currentEntry.clockIn);
        let diff = now.getTime() - clockInTime.getTime();

        // Support multiple breaks stored in `breaks` JSON (preferred) or legacy single breakStart/breakEnd
        const breaksArray: any[] = currentEntry.breaks || [];
        const activeBreak = breaksArray.length ? breaksArray[breaksArray.length - 1] : null;

        // Subtract completed breaks
        const completedBreakMinutes = breaksArray.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
        diff -= (completedBreakMinutes * 60 * 1000);

        // If an active break exists (no end) account for it in the live timer
        if (activeBreak && !activeBreak.end) {
          const breakSoFar = now.getTime() - new Date(activeBreak.start).getTime();
          diff -= breakSoFar;

          const breakHours = Math.floor(breakSoFar / (1000 * 60 * 60));
          const breakMinutes = Math.floor((breakSoFar % (1000 * 60 * 60)) / (1000 * 60));
          const breakSeconds = Math.floor((breakSoFar % (1000 * 60)) / 1000);
          setBreakTime(`${String(breakHours).padStart(2, '0')}:${String(breakMinutes).padStart(2, '0')}:${String(breakSeconds).padStart(2, '0')}`);
        } else if (currentEntry.breakStart && currentEntry.breakEnd) {
          // legacy single-break fallback (already accounted for in breakDuration)
          const breakDuration = new Date(currentEntry.breakEnd).getTime() - new Date(currentEntry.breakStart).getTime();
          diff -= breakDuration;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isClockedIn, currentEntry, onBreak]);

  const fetchShopSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop/settings?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const { settings } = await response.json();
        setGpsEnabled(settings.gpsVerificationEnabled || false);
        setPhotoEnabled(false); // Photo capture disabled - not needed for clock in/out
        if (settings.shopLatitude && settings.shopLongitude) {
          setShopLocation({ lat: settings.shopLatitude, lon: settings.shopLongitude });
        }
        if (settings.gpsRadiusMeters) {
          setGpsRadius(settings.gpsRadiusMeters);
        }
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  const checkClockStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/time-tracking?techId=${techId}&startDate=${new Date().toISOString().split('T')[0]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const { timeEntries } = await response.json();
        const activeEntry = timeEntries.find((e: any) => !e.clockOut);
        
        if (activeEntry) {
          setIsClockedIn(true);
          setCurrentEntry(activeEntry);
          const breaksArray: any[] = activeEntry.breaks || [];
          const lastBreak = breaksArray.length ? breaksArray[breaksArray.length - 1] : null;
          setOnBreak((lastBreak && !lastBreak.end) || (activeEntry.breakStart && !activeEntry.breakEnd));
        }
      }
    } catch (error) {
      console.error('Error checking clock status:', error);
    }
  };

  const getLocation = (): Promise<{lat: number, lon: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Photo verification disabled.');
    }
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance in meters
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      let locationData = null;

      // GPS verification is required - check location first
      if (gpsEnabled && shopLocation) {
        try {
          locationData = await getLocation();
          setLocation(locationData);
          
          // Calculate distance from shop
          const distance = calculateDistance(
            locationData.lat, 
            locationData.lon, 
            shopLocation.lat, 
            shopLocation.lon
          );
          
          console.log(`Distance from shop: ${distance.toFixed(2)} meters (${(distance * 3.28084).toFixed(2)} feet)`);
          
          // Check if within allowed radius (default 100 feet = 30.48 meters)
          if (distance > gpsRadius) {
            alert(`You must be within ${(gpsRadius * 3.28084).toFixed(0)} feet of the shop to clock in. You are currently ${(distance * 3.28084).toFixed(0)} feet away.`);
            setLoading(false);
            return;
          }
        } catch (error) {
          alert('GPS verification failed. Please enable location services and try again.');
          setLoading(false);
          return;
        }
      } else if (gpsEnabled && !shopLocation) {
        alert('Shop location not configured. Please contact your manager.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('🔑 Clock-in token:', token ? 'Token exists' : 'NO TOKEN FOUND');
      console.log('📍 Location data:', locationData);
      console.log('👤 Tech ID:', techId);
      console.log('🏪 Shop ID:', shopId);
      
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'clock-in',
          techId,
          shopId,
          location: locationData,
        }),
      });

      if (response.ok) {
        const { timeEntry } = await response.json();
        setIsClockedIn(true);
        setCurrentEntry(timeEntry);
        alert('Clocked in successfully!');
      } else {
        const { error } = await response.json();
        alert(error || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Error clocking in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      let locationData = null;

      // GPS verification for clock out - verify still near shop
      if (gpsEnabled && shopLocation) {
        try {
          locationData = await getLocation();
          
          const distance = calculateDistance(
            locationData.lat, 
            locationData.lon, 
            shopLocation.lat, 
            shopLocation.lon
          );
          
          console.log(`Distance from shop: ${distance.toFixed(2)} meters (${(distance * 3.28084).toFixed(2)} feet)`);
          
          // Check if within allowed radius for clock out
          if (distance > gpsRadius) {
            alert(`You must be within ${(gpsRadius * 3.28084).toFixed(0)} feet of the shop to clock out. You are currently ${(distance * 3.28084).toFixed(0)} feet away.`);
            setLoading(false);
            return;
          }
        } catch (error) {
          alert('GPS verification failed. Please enable location services and try again.');
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'clock-out',
          techId,
          shopId,
          location: locationData,
        }),
      });

      if (response.ok) {
        const { hoursWorked } = await response.json();
        setIsClockedIn(false);
        setOnBreak(false);
        setCurrentEntry(null);
        setElapsedTime('00:00:00');
        setBreakTime('00:00:00');
        alert(`Clocked out successfully! Hours worked: ${hoursWorked?.toFixed(2)}`);
      } else {
        const { error } = await response.json();
        alert(error || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Error clocking out');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'break-start',
          techId,
          shopId,
        }),
      });

      if (response.ok) {
        const { timeEntry } = await response.json();
        setOnBreak(true);
        setCurrentEntry(timeEntry);
        alert('Break started');
      }
    } catch (error) {
      console.error('Error starting break:', error);
      alert('Error starting break');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'break-end',
          techId,
          shopId,
        }),
      });

      if (response.ok) {
        const { timeEntry, breakDuration } = await response.json();
        setOnBreak(false);
        setCurrentEntry(timeEntry);
        setBreakTime('00:00:00');
        alert(`Break ended. Duration: ${breakDuration?.toFixed(0)} minutes`);
      }
    } catch (error) {
      console.error('Error ending break:', error);
      alert('Error ending break');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }}>
      {/* Hidden camera elements */}
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
            {onBreak ? '☕ On Break' : isClockedIn ? '⏰ Clocked In' : '⏱️ Time Clock'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600' }}>{techName || 'You'}</div>
        </div>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: onBreak ? '#f59e0b' : isClockedIn ? '#4ade80' : '#94a3b8',
          boxShadow: isClockedIn ? '0 0 12px #4ade80' : onBreak ? '0 0 12px #f59e0b' : 'none',
        }} />
      </div>

      {isClockedIn && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            textAlign: 'center',
            margin: '16px 0',
            fontFamily: 'monospace',
            letterSpacing: '2px',
          }}>
            {elapsedTime}
          </div>
          {onBreak && (
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              textAlign: 'center',
              color: '#fbbf24',
              fontFamily: 'monospace',
            }}>
              Break: {breakTime}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '8px' }}>
        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: 'none',
            background: isClockedIn ? '#ef4444' : '#22c55e',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Processing...' : isClockedIn ? '🚪 Clock Out' : '🔓 Clock In'}
        </button>

        {isClockedIn && (
          <button
            onClick={onBreak ? handleBreakEnd : handleBreakStart}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: onBreak ? '#22c55e' : '#f59e0b',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Processing...' : onBreak ? '▶️ End Break' : '☕ Start Break'}
          </button>
        )}
      </div>

      {isClockedIn && currentEntry && (
        <div style={{ marginTop: '16px', fontSize: '13px', opacity: 0.9, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <div>Clocked in: {new Date(currentEntry.clockIn).toLocaleTimeString()}</div>
          {gpsEnabled && location && (
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              📍 Location verified ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
            </div>
          )}
          {photoEnabled && (
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              📸 Photo verification enabled
            </div>
          )}
        </div>
      )}
    </div>
  );
}
