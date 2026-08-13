import { useState } from 'react';
export function useLocation(onLocated: (value: { latitude: number; longitude: number }) => void) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const locate = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onLocated({ latitude: coords.latitude, longitude: coords.longitude });
        setStatus('success');
      },
      () => setStatus('error'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };
  return { status, locate };
}
