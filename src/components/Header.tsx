import React from 'react';
import { Database, RefreshCw, Zap } from 'lucide-react';
import { BackendIntegrationConfig } from '../types/carpark';

interface HeaderProps {
  config: BackendIntegrationConfig;
  onOpenBackendModal: () => void;
  onOpenCalculatorModal: () => void;
  activeView: 'split' | 'grid' | 'table';
  setActiveView: (view: 'split' | 'grid' | 'table') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenBackendModal,
  onOpenCalculatorModal,
  activeView,
  setActiveView,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Brand wordmark (single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-sm font-black">
            P
          </span>
          <span>SG ParkPulse</span>
        </a>
        <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border-l border-slate-700 pl-3">
          Singapore Live Availability
        </span>
      </div>

      {/* Zone 2: Navigation & View Mode Links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveView('split')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'split' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Map & Details
        </button>
        <button
          onClick={() => setActiveView('grid')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'grid' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Carpark Directory
        </button>
        <button
          onClick={() => setActiveView('table')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'table' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Quick Table
        </button>
        <button
          onClick={onOpenCalculatorModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Fee Estimator</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action + Quick Refresh status */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title={`Last updated ${lastUpdated.toLocaleTimeString()}`}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Refresh live lots"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        <button
          onClick={onOpenBackendModal}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-emerald-950 font-sans"
        >
          <Database className="w-3.5 h-3.5 text-slate-950" />
          <span>
            {config.mode === 'simulator' ? 'Backend API (Mock Mode)' : 'Backend Connected'}
          </span>
        </button>
      </div>
    </header>
  );
};
