import React from 'react';
import { Search, SlidersHorizontal, X, Car, Bike, Truck, Zap, ArrowUpDown } from 'lucide-react';
import { FilterState, VehicleCategory } from '../types/carpark';
import { INITIAL_FILTERS } from '../hooks/useCarparkTracker';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
}

const AREAS = [
  'All',
  'Central / CBD',
  'Orchard',
  'Marina Bay',
  'East',
  'West',
  'North',
  'North-East',
];

const AGENCIES = ['All', 'HDB', 'URA', 'LTA', 'Private/Mall'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleAreaChange = (area: string) => {
    setFilters((prev) => ({ ...prev, area }));
  };

  const handleVehicleChange = (vehicleType: VehicleCategory) => {
    setFilters((prev) => ({ ...prev, vehicleType }));
  };

  const handleStatusChange = (lotStatus: string) => {
    setFilters((prev) => ({ ...prev, lotStatus }));
  };

  const handleAgencyChange = (agency: string) => {
    setFilters((prev) => ({ ...prev, agency }));
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const resetAllFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.area !== 'All' ||
    filters.agency !== 'All' ||
    filters.vehicleType !== 'car' ||
    filters.lotStatus !== 'all' ||
    filters.hasEvChargers ||
    filters.maxHourlyRate < 20 ||
    filters.minHeightClearance > 0;

  return (
    <div className="border-b border-slate-800 bg-slate-900/70 p-4 sm:px-6 space-y-3.5">
      {/* Search & Vehicle Type Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by carpark name, address, code (e.g. ION, AMK, CBD-STC)..."
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((p) => ({ ...p, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vehicle Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start md:self-auto">
          <button
            onClick={() => handleVehicleChange('car')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filters.vehicleType === 'car'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            onClick={() => handleVehicleChange('motorcycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filters.vehicleType === 'motorcycle'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles</span>
          </button>
          <button
            onClick={() => handleVehicleChange('heavy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filters.vehicleType === 'heavy'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy</span>
          </button>
          <button
            onClick={() => handleVehicleChange('ev')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filters.vehicleType === 'ev'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>EV Charging</span>
          </button>
        </div>

        {/* Sort & Advanced Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1.5" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
              className="bg-transparent text-slate-200 text-xs py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="availability" className="bg-slate-900">Highest % Vacant</option>
              <option value="lots" className="bg-slate-900">Most Available Lots</option>
              <option value="distance" className="bg-slate-900">Nearest Distance</option>
              <option value="rate" className="bg-slate-900">Lowest Hourly Rate</option>
              <option value="name" className="bg-slate-900">Name (A-Z)</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Area Selector Tabs (Single-line horizontal scroller) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 shrink-0 font-medium mr-1 text-[11px]">Region:</span>
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => handleAreaChange(area)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              filters.area === area
                ? 'bg-slate-200 text-slate-950 font-semibold'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Advanced Filter Drawer / Expanded Bar */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Availability Status */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Lot Availability Status</label>
            <select
              value={filters.lotStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="ample">Ample Available (&gt;20% lots)</option>
              <option value="moderate">Moderate (5% - 20% lots)</option>
              <option value="limited">Limited (&lt;5% lots remaining)</option>
              <option value="full">Full / No lots</option>
            </select>
          </div>

          {/* Agency */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Managing Agency / Type</label>
            <select
              value={filters.agency}
              onChange={(e) => handleAgencyChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {AGENCIES.map((agency) => (
                <option key={agency} value={agency}>
                  {agency === 'All' ? 'All Agencies (HDB / URA / LTA / Malls)' : agency}
                </option>
              ))}
            </select>
          </div>

          {/* Max Daytime Hourly Rate */}
          <div>
            <div className="flex justify-between text-slate-400 font-medium mb-1">
              <span>Max Hourly Rate</span>
              <span className="text-slate-200 font-mono">
                {filters.maxHourlyRate >= 20 ? 'No Limit' : `$${filters.maxHourlyRate}/hr`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={filters.maxHourlyRate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, maxHourlyRate: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Height Clearance */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Min Height Clearance</label>
            <select
              value={filters.minHeightClearance}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, minHeightClearance: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="0">Any Height</option>
              <option value="1.9">At least 1.9m (Compact SUV)</option>
              <option value="2.0">At least 2.0m (Standard Van/SUV)</option>
              <option value="2.1">At least 2.1m (High Roof / MPV)</option>
              <option value="4.0">At least 4.0m (Lorry / Heavy)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count & Reset row */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div>
          Showing <span className="font-semibold text-slate-200 font-mono tabular-nums">{totalMatches}</span> carparks in Singapore
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
