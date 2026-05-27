import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * /settings route — redirects to /home and opens the SettingsPanelStack drawer.
 */
export function SettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/home', { replace: true, state: { openSettings: true } });
  }, [navigate]);

  return null;
}
