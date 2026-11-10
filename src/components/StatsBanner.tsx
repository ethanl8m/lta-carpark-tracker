import React from 'react';
import { MapPin, Navigation, BatteryCharging } from 'lucide-react';
import { SINGAPORE_LOCATIONS } from '../hooks/useCarparkTracker';

interface StatsBannerProps {
  stats: {
    totalCarparks: number;
    totalLots: number;
    availableLots: number;
    overallOccupancy: number;
    fullCount: number;
    evChargersAvail: number;
  };
  userLocation: { lat: number; lng: number; label: string };
  onSelectLocation: (loc: (typeof SINGAPORE_LOCATIONS)[number]) => void;
  lastUpdated: Date;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats,
  userLocation,
  onSelectLocation,
  lastUpdated,
}) => {
  const availablePercent = stats.totalLots > 0
    ? Math.round((stats.availableLots / stats.totalLots) * 100)
    : 0;

  return (
    <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 divide-x divide-slate-800/80">
          <div className="pr-2">
            <span className="block text-xs text-slate-400 font-medium">Available Lots</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                {stats.availableLots.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {stats.totalLots.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pl-4 sm:pl-6 pr-2">
            <span className="block text-xs text-slate-400 font-medium">Network Availability</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
                {availablePercent}%
              </span>
              <span className="text-xs text-slate-400">lot vacancy</span>
            </div>
          </div>

          <div className="pl-4 sm:pl-6 pr-2">
            <span className="block text-xs text-slate-400 font-medium">Occupied / Critical</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
                {stats.fullCount}
              </span>
              <span className="text-xs text-slate-400">carparks full</span>
            </div>
          </div>

          <div className="pl-4 sm:pl-6">
            <span className="block text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-sky-400" />
              <span>EV Fast Charging</span>
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-sky-400 font-mono tabular-nums">
                {stats.evChargersAvail}
              </span>
              <span className="text-xs text-slate-400">chargers ready</span>
            </div>
          </div>
        </div>

        {/* Location reference selector */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-900 border border-slate-800 rounded-lg p-1.5">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Reference Landmark:</span>
          </div>
          <select
            value={userLocation.label}
            onChange={(e) => {
              const found = SINGAPORE_LOCATIONS.find((l) => l.label === e.target.value);
              if (found) onSelectLocation(found);
            }}
            className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {SINGAPORE_LOCATIONS.map((loc) => (
              <option key={loc.label} value={loc.label}>
                {loc.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSelectLocation({ label: 'Current / Browser Location', lat: 1.3040, lng: 103.8318, isGps: true })}
            title="Locate via GPS"
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
