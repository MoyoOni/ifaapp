/**
 * CacheDebugger.tsx - Development tool for cache monitoring
 * Shows cache stats, memory usage, and provides invalidation controls
 * Only visible when dev_mode_role is set
 */

import React, { useState } from 'react';
import { useCacheStats, useCacheManager } from '../hooks/useCache';
import { cacheService } from '../services/cacheService';
import './CacheDebugger.css';

interface CacheDebuggerProps {
  className?: string;
}

export const CacheDebugger: React.FC<CacheDebuggerProps> = ({ className = '' }) => {
  const stats = useCacheStats();
  const { clear: clearCache, getStats } = useCacheManager();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in dev mode
  const isDev = localStorage.getItem('dev_mode_role') !== null;
  if (!isDev) return null;

  const memoryMB = (stats.memorySize / 1024 / 1024).toFixed(2);
  const storageMB = (stats.storageSize / 1024 / 1024).toFixed(2);

  const handleClear = () => {
    clearCache();
    alert('Cache cleared');
  };

  const handleRefresh = () => {
    const freshStats = getStats();
    console.log('[CacheDebugger] Current stats:', freshStats);
  };

  return (
    <div className={`cache-debugger ${isOpen ? 'open' : 'closed'} ${className}`}>
      <button
        className="cache-debugger-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle cache debugger"
      >
        💾
      </button>

      {isOpen && (
        <div className="cache-debugger-panel">
          <div className="cache-debugger-header">
            <h4>Cache Monitor</h4>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="cache-debugger-stats">
            <div className="stat-row">
              <span className="stat-label">Memory Items:</span>
              <span className="stat-value">{stats.memoryItems}/{stats.maxMemoryItems}</span>
            </div>

            <div className="stat-row">
              <span className="stat-label">Memory Used:</span>
              <span className="stat-value">{memoryMB} MB</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((stats.memorySize / (1024 * 1024)) * 10, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Storage Used:</span>
              <span className="stat-value">{storageMB} MB</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((stats.storageSize / stats.maxStorageSize) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Max Storage:</span>
              <span className="stat-value">{(stats.maxStorageSize / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>

          <div className="cache-debugger-actions">
            <button className="action-btn refresh" onClick={handleRefresh} title="Refresh stats">
              🔄 Refresh
            </button>
            <button className="action-btn clear" onClick={handleClear} title="Clear all cache">
              🗑️ Clear All
            </button>
          </div>

          <div className="cache-debugger-info">
            <p className="info-text">
              Tip: Use <code>cacheService.get('key')</code> in console to check specific keys
            </p>
            <p className="info-text">
              Tip: Use <code>cacheService.getStats()</code> to get full stats
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheDebugger;
