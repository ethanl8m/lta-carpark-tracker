import React, { useState } from 'react';
import { X, Navigation, Bookmark, Car, Bike, Truck, Zap, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { Carpark } from '../types/carpark';
import { getLotStatus } from '../hooks/useCarparkTracker';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  // Parking fee estimate state
  const [estimateDurationHours, setEstimateDurationHours] = useState(2);
  const [estimateDayType, setEstimateDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [estimateHour, setEstimateHour] = useState(14); // 2pm

  if (!carpark) return null;

  // Calculate quick fee estimate based on carpark rate structure
  const calculateFee = () => {
    let cost = 0;
    const durHours = estimateDurationHours;

    if (estimateDayType === 'sunday') {
      if (carpark.agency === 'HDB' && estimateHour >= 7 && estimateHour < 22) {
        return { total: 0, note: 'Free Parking under HDB Sunday Scheme (7am - 10:30pm)' };
      }
      cost = carpark.rates.estimatedHourlyDay * durHours * 0.9;
    } else if (estimateDayType === 'saturday') {
      cost = carpark.rates.estimatedHourlyDay * durHours * 0.95;
    } else {
      // Weekday
      if (estimateHour >= 18) {
        // Evening per entry or offpeak
        cost = Math.min(carpark.rates.estimatedHourlyDay * durHours, 4.5);
      } else {
        cost = carpark.rates.estimatedHourlyDay * durHours;
      }
    }

    return {
      total: Math.max(0.6, Math.round(cost * 100) / 100),
      note: `Based on standard ${estimateDayType} rates and ${carpark.rates.gracePeriodMins} min grace period`,
    };
  };

  const feeResult = calculateFee();

  const carStatus = getLotStatus(carpark.lots.car.available, carpark.lots.car.total);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}&destination_place_id=${encodeURIComponent(carpark.name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-emerald-400 font-bold">{carpark.id}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.carparkType}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.area}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {carpark.name}
            </h2>
            <p className="text-xs text-slate-400">{carpark.address}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Live Lots Availability Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Real-Time Lot Availability
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Updated {new Date(carpark.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Car Lots */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Car Lots</span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-emerald-400">
                  {carpark.lots.car.available}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  of {carpark.lots.car.total} total
                </div>
              </div>

              {/* Motorcycles */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Bike className="w-3.5 h-3.5 text-amber-400" />
                  <span>Motorcycles</span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-white">
                  {carpark.lots.motorcycle ? carpark.lots.motorcycle.available : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {carpark.lots.motorcycle ? `of ${carpark.lots.motorcycle.total} total` : 'None'}
                </div>
              </div>

              {/* Heavy Lots */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Heavy / Lorry</span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-white">
                  {carpark.lots.heavy ? carpark.lots.heavy.available : '0'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {carpark.lots.heavy ? `of ${carpark.lots.heavy.total} total` : 'Not designated'}
                </div>
              </div>

              {/* EV Chargers */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>EV Charging</span>
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-sky-400">
                  {carpark.evChargers ? carpark.evChargers.available : '0'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {carpark.evChargers ? `${carpark.evChargers.powerKw}kW ${carpark.evChargers.provider}` : 'No chargers'}
                </div>
              </div>
            </div>
          </div>

          {/* Parking Rates Schedule */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Singapore Parking Rates Card
            </h3>
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-950/60 overflow-hidden text-xs">
              <div className="p-3 flex justify-between items-center gap-4">
                <span className="text-slate-400">Monday - Friday (Day / Peak)</span>
                <span className="font-medium text-slate-100 text-right">{carpark.rates.weekdayPeak}</span>
              </div>
              <div className="p-3 flex justify-between items-center gap-4">
                <span className="text-slate-400">Monday - Friday (Evening / Night)</span>
                <span className="font-medium text-slate-100 text-right">{carpark.rates.weekdayOffPeak}</span>
              </div>
              <div className="p-3 flex justify-between items-center gap-4">
                <span className="text-slate-400">Saturday</span>
                <span className="font-medium text-slate-100 text-right">{carpark.rates.saturday}</span>
              </div>
              <div className="p-3 flex justify-between items-center gap-4">
                <span className="text-slate-400">Sunday & Public Holidays</span>
                <span className="font-medium text-emerald-400 text-right">{carpark.rates.sundayHoliday}</span>
              </div>
              {carpark.rates.freeParkingPromo && (
                <div className="p-3 bg-emerald-950/30 text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{carpark.rates.freeParkingPromo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Fee Estimator */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Instant Parking Fee Estimator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Day of Week</label>
                <select
                  value={estimateDayType}
                  onChange={(e) => setEstimateDayType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="weekday">Weekday (Mon - Fri)</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday / Public Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Entry Time</label>
                <select
                  value={estimateHour}
                  onChange={(e) => setEstimateHour(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={9}>Morning (9:00 AM)</option>
                  <option value={12}>Lunch Peak (12:30 PM)</option>
                  <option value={15}>Afternoon (3:00 PM)</option>
                  <option value={19}>Dinner / Evening (7:00 PM)</option>
                  <option value={23}>Night (11:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estimated Duration</label>
                <select
                  value={estimateDurationHours}
                  onChange={(e) => setEstimateDurationHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={8}>Full day (8 hours)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">{feeResult.note}</span>
              <div className="text-right">
                <span className="text-xs text-slate-400 mr-2">Estimated Fee:</span>
                <span className="text-lg font-black font-mono text-emerald-400 tabular-nums">
                  {typeof feeResult.total === 'number' && feeResult.total === 0
                    ? 'FREE'
                    : `S$${feeResult.total.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* 24-Hour Occupancy Forecast Chart */}
          {carpark.hourlyTrends && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  24-Hour Occupancy Profile
                </h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Peak vs Off-peak traffic pattern</span>
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="h-24 flex items-end gap-1 pt-4 pb-2">
                  {carpark.hourlyTrends.map((trend) => {
                    const isNow = new Date().getHours() === trend.hour;
                    let barBg = 'bg-emerald-500/70';
                    if (trend.occupancyPercent > 80) barBg = 'bg-rose-500/80';
                    else if (trend.occupancyPercent > 50) barBg = 'bg-amber-500/80';

                    return (
                      <div
                        key={trend.hour}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div
                          className={`w-full ${barBg} rounded-t transition-all ${
                            isNow ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ height: `${trend.occupancyPercent}%` }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 hidden group-hover:block bg-slate-900 border border-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                          {trend.hour}:00 - {trend.occupancyPercent}% full
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            </div>
          )}

          {/* Carpark Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg">
              <span className="block text-slate-400">Height Limit</span>
              <span className="font-mono font-bold text-slate-200">{carpark.heightLimitMeters} meters</span>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg">
              <span className="block text-slate-400">Grace Period</span>
              <span className="font-mono font-bold text-slate-200">{carpark.rates.gracePeriodMins} minutes</span>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg">
              <span className="block text-slate-400">Gantry System</span>
              <span className="font-mono font-bold text-slate-200">{carpark.systemType}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Coordinates: <span className="font-mono text-slate-300">{carpark.coordinates.lat.toFixed(4)}, {carpark.coordinates.lng.toFixed(4)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openWaze}
              className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Waze
            </button>
            <button
              onClick={openGoogleMaps}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md shadow-emerald-950/50"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps Directions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
