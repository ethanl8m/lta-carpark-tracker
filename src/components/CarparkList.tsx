import React from 'react';
import { Carpark, VehicleCategory } from '../types/carpark';
import { CarparkCard } from './CarparkCard';
import { getLotStatus } from '../hooks/useCarparkTracker';
import { Search, Navigation, Zap } from 'lucide-react';

interface CarparkListProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  favorites: string[];
  onSelectCarpark: (carpark: Carpark) => void;
  onToggleFavorite: (id: string) => void;
  vehicleType: VehicleCategory;
  viewMode: 'split' | 'grid' | 'table';
  onResetFilters: () => void;
}

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  selectedCarpark,
  favorites,
  onSelectCarpark,
  onToggleFavorite,
  vehicleType,
  viewMode,
  onResetFilters,
}) => {
  if (carparks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 m-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">No Car Parks Found</h4>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          No carparks match your current filter parameters or search terms in Singapore.
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  // Quick Table View (High-density spreadsheet mode)
  if (viewMode === 'table') {
    return (
      <div className="p-4 sm:px-6 overflow-x-auto">
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Carpark & Code</th>
                <th className="py-3 px-3 font-semibold">Area</th>
                <th className="py-3 px-3 font-semibold">Agency</th>
                <th className="py-3 px-4 font-semibold text-right">Available Lots</th>
                <th className="py-3 px-3 font-semibold text-right">Capacity</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Day Rates</th>
                <th className="py-3 px-3 font-semibold">EV Charging</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {carparks.map((cp) => {
                let avail = cp.lots.car.available;
                let tot = cp.lots.car.total;
                if (vehicleType === 'motorcycle' && cp.lots.motorcycle) {
                  avail = cp.lots.motorcycle.available;
                  tot = cp.lots.motorcycle.total;
                } else if (vehicleType === 'heavy' && cp.lots.heavy) {
                  avail = cp.lots.heavy.available;
                  tot = cp.lots.heavy.total;
                } else if (vehicleType === 'ev' && cp.evChargers) {
                  avail = cp.evChargers.available;
                  tot = cp.evChargers.total;
                }

                const status = getLotStatus(avail, tot);
                const isSelected = selectedCarpark?.id === cp.id;

                let statusColor = 'text-emerald-400';
                let statusLabel = 'Ample';
                if (status === 'moderate') {
                  statusColor = 'text-amber-400';
                  statusLabel = 'Moderate';
                } else if (status === 'limited') {
                  statusColor = 'text-orange-400';
                  statusLabel = 'Limited';
                } else if (status === 'full') {
                  statusColor = 'text-rose-400';
                  statusLabel = 'Full';
                }

                return (
                  <tr
                    key={cp.id}
                    onClick={() => onSelectCarpark(cp)}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/80 ring-1 ring-inset ring-emerald-500/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{cp.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cp.id} · {cp.carparkType}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{cp.area}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-300">{cp.agency}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono font-bold text-sm tabular-nums ${statusColor}`}>
                        {avail.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono tabular-nums">
                      {tot.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                      {cp.rates.weekdayPeak}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {cp.evChargers && cp.evChargers.available > 0 ? (
                        <span className="flex items-center gap-1 text-sky-400 font-mono text-[11px]">
                          <Zap className="w-3 h-3" />
                          <span>{cp.evChargers.available} lots</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${cp.coordinates.lat},${cp.coordinates.lng}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="p-1.5 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors text-slate-400"
                        title="Directions"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grid view (Full directory grid)
  if (viewMode === 'grid') {
    return (
      <div className="p-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {carparks.map((cp) => (
            <CarparkCard
              key={cp.id}
              carpark={cp}
              isSelected={selectedCarpark?.id === cp.id}
              isFavorite={favorites.includes(cp.id)}
              onSelect={() => onSelectCarpark(cp)}
              onToggleFavorite={() => onToggleFavorite(cp.id)}
              vehicleType={vehicleType}
            />
          ))}
        </div>
      </div>
    );
  }

  // Split View (Sidebar scrollable list beside interactive map)
  return (
    <div className="h-full overflow-y-auto p-4 space-y-3.5 pr-2">
      {carparks.map((cp) => (
        <CarparkCard
          key={cp.id}
          carpark={cp}
          isSelected={selectedCarpark?.id === cp.id}
          isFavorite={favorites.includes(cp.id)}
          onSelect={() => onSelectCarpark(cp)}
          onToggleFavorite={() => onToggleFavorite(cp.id)}
          vehicleType={vehicleType}
        />
      ))}
    </div>
  );
};
