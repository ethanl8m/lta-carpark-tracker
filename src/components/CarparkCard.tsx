import React from 'react';
import { Bookmark, Navigation, Zap, ShieldCheck } from 'lucide-react';
import { Carpark, VehicleCategory } from '../types/carpark';
import { getLotStatus } from '../hooks/useCarparkTracker';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  vehicleType: VehicleCategory;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  vehicleType,
}) => {
  // Determine relevant lot count based on vehicle category filter
  let available = carpark.lots.car.available;
  let total = carpark.lots.car.total;

  if (vehicleType === 'motorcycle' && carpark.lots.motorcycle) {
    available = carpark.lots.motorcycle.available;
    total = carpark.lots.motorcycle.total;
  } else if (vehicleType === 'heavy' && carpark.lots.heavy) {
    available = carpark.lots.heavy.available;
    total = carpark.lots.heavy.total;
  } else if (vehicleType === 'ev' && carpark.evChargers) {
    available = carpark.evChargers.available;
    total = carpark.evChargers.total;
  }

  const status = getLotStatus(available, total);
  const occupancyPercent = total > 0 ? Math.round(((total - available) / total) * 100) : 100;
  const vacancyPercent = 100 - occupancyPercent;

  // Status text & colors
  let statusText = 'Ample Vacancy';
  let statusTextColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';

  if (status === 'moderate') {
    statusText = 'Moderate';
    statusTextColor = 'text-amber-400';
    barColor = 'bg-amber-500';
  } else if (status === 'limited') {
    statusText = 'Limited Lots';
    statusTextColor = 'text-orange-400';
    barColor = 'bg-orange-500';
  } else if (status === 'full') {
    statusText = 'Full';
    statusTextColor = 'text-rose-400';
    barColor = 'bg-rose-500';
  }

  const openDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}&destination_place_id=${encodeURIComponent(carpark.name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Unboxed metadata + Favorite toggle */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="space-y-1 min-w-0">
          {/* Zero-Pill Metadata row with typographic separators */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>{carpark.id}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.carparkType}</span>
            {carpark.distanceKm !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-semibold">{carpark.distanceKm} km away</span>
              </>
            )}
          </div>

          {/* Primary Carpark Title */}
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
            {carpark.name}
          </h3>
          <p className="text-xs text-slate-400 truncate">{carpark.address}</p>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={isFavorite ? 'Remove from saved carparks' : 'Save carpark to favorites'}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            isFavorite
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Real-time Lot Availability Block */}
      <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono tabular-nums tracking-tight ${statusTextColor}`}>
              {available.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {total.toLocaleString()} {vehicleType === 'ev' ? 'chargers' : 'lots'}
            </span>
          </div>

          <div className="text-right">
            <span className={`text-xs font-semibold ${statusTextColor}`}>{statusText}</span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-mono tabular-nums">
              ({vacancyPercent}% free)
            </span>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300 rounded-full`}
            style={{ width: `${Math.min(100, Math.max(2, vacancyPercent))}%` }}
          />
        </div>

        {/* EV Chargers and Special promos indicator */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            {carpark.evChargers && carpark.evChargers.available > 0 ? (
              <span className="flex items-center gap-1 text-sky-400">
                <Zap className="w-3 h-3 text-sky-400" />
                <span className="font-mono font-medium">{carpark.evChargers.available} EV Lots</span>
                <span className="text-slate-400">({carpark.evChargers.powerKw}kW)</span>
              </span>
            ) : carpark.rates.freeParkingPromo ? (
              <span className="text-emerald-400 truncate">{carpark.rates.freeParkingPromo}</span>
            ) : (
              <span className="text-slate-400">{carpark.rates.weekdayPeak}</span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {carpark.heightLimitMeters}m limit
          </span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px]">{carpark.rates.gracePeriodMins} min grace period</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openDirections}
            title="Navigate via Maps"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
          >
            <Navigation className="w-3 h-3 text-sky-400" />
            <span>Navigate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
