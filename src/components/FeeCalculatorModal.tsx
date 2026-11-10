import React, { useState } from 'react';
import { X, Calculator, ArrowRight, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Carpark } from '../types/carpark';

interface FeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: Carpark[];
  onSelectCarpark: (cp: Carpark) => void;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  isOpen,
  onClose,
  carparks,
  onSelectCarpark,
}) => {
  const [stayDurationHours, setStayDurationHours] = useState<number>(2.5);
  const [dayOfWeek, setDayOfWeek] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [entryTime, setEntryTime] = useState<'day' | 'evening'>('day');
  const [selectedArea, setSelectedArea] = useState<string>('All');

  if (!isOpen) return null;

  // Compute estimated cost for each carpark
  const scoredCarparks = carparks
    .filter((cp) => selectedArea === 'All' || cp.area === selectedArea)
    .map((cp) => {
      let cost = 0;
      let note = '';

      if (dayOfWeek === 'sunday') {
        if (cp.agency === 'HDB' && entryTime === 'day') {
          cost = 0;
          note = 'Free (HDB Sunday Scheme)';
        } else {
          cost = cp.rates.estimatedHourlyDay * stayDurationHours * 0.9;
          note = 'Standard Sunday rate';
        }
      } else if (entryTime === 'evening') {
        cost = Math.min(cp.rates.estimatedHourlyDay * stayDurationHours, 4.5);
        note = 'Per-entry evening cap applied';
      } else {
        cost = cp.rates.estimatedHourlyDay * stayDurationHours;
        note = `Approx S$${cp.rates.estimatedHourlyDay.toFixed(2)}/hr`;
      }

      return {
        ...cp,
        estimatedCost: Math.max(0, Math.round(cost * 100) / 100),
        costNote: note,
      };
    })
    .sort((a, b) => a.estimatedCost - b.estimatedCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Singapore Parking Fee Estimator</h2>
              <p className="text-xs text-slate-400">Compare rates & find the cheapest parking for your trip</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Controls */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Duration</label>
            <select
              value={stayDurationHours}
              onChange={(e) => setStayDurationHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
              <option value={2.5}>2.5 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
              <option value={6}>6 hours</option>
              <option value={8}>8 hours (Full day)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Day Type</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="weekday">Weekday (Mon - Fri)</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday / Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Entry Window</label>
            <select
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="day">Daytime (7am - 5pm)</option>
              <option value="evening">Evening (After 6pm)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Filter Area</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="All">All Singapore</option>
              <option value="Orchard">Orchard</option>
              <option value="Central / CBD">Central / CBD</option>
              <option value="Marina Bay">Marina Bay</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="North">North</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Cheapest to Most Expensive for {stayDurationHours} Hours</span>
            <span>{scoredCarparks.length} Carparks</span>
          </div>

          {scoredCarparks.map((cp, idx) => (
            <div
              key={cp.id}
              onClick={() => {
                onSelectCarpark(cp);
                onClose();
              }}
              className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-300 font-semibold">#{idx + 1}</span>
                  <span aria-hidden="true">·</span>
                  <span>{cp.agency}</span>
                  <span aria-hidden="true">·</span>
                  <span>{cp.area}</span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {cp.name}
                </h4>
                <div className="text-[11px] text-slate-400 truncate">{cp.costNote}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base sm:text-lg font-black font-mono tabular-nums text-emerald-400">
                  {cp.estimatedCost === 0 ? 'FREE' : `S$${cp.estimatedCost.toFixed(2)}`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {cp.lots.car.available} lots free
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
