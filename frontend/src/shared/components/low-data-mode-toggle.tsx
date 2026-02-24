import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const LOW_DATA_MODE_KEY = 'ile-ase-low-data-mode';

/**
 * Low Data Mode Toggle Component
 * Reduces data usage by disabling images, limiting API calls, etc.
 */
const LowDataModeToggle: React.FC = () => {
  const [lowDataMode, setLowDataMode] = useState(() => {
    const saved = localStorage.getItem(LOW_DATA_MODE_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(LOW_DATA_MODE_KEY, lowDataMode.toString());
    
    // Add class to body for CSS-based optimizations
    if (lowDataMode) {
      document.body.classList.add('low-data-mode');
    } else {
      document.body.classList.remove('low-data-mode');
    }
  }, [lowDataMode]);

  return (
    <button
      onClick={() => setLowDataMode(!lowDataMode)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        lowDataMode
          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          : 'bg-white/5 text-muted border border-white/10 hover:border-white/20'
      }`}
      title={lowDataMode ? 'Disable Low Data Mode' : 'Enable Low Data Mode'}
    >
      {lowDataMode ? <WifiOff size={16} /> : <Wifi size={16} />}
      <span className="text-sm font-medium">
        {lowDataMode ? 'Low Data' : 'Normal'}
      </span>
    </button>
  );
};

/**
 * Check if low data mode is enabled
 */
export function isLowDataMode(): boolean {
  return localStorage.getItem(LOW_DATA_MODE_KEY) === 'true';
}

export default LowDataModeToggle;
