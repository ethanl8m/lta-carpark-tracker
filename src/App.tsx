/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCarparkTracker } from './hooks/useCarparkTracker';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { CarparkMap } from './components/CarparkMap';
import { CarparkList } from './components/CarparkList';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import { INITIAL_FILTERS } from './hooks/useCarparkTracker';
import { AlertCircle, Map as MapIcon, List as ListIcon } from 'lucide-react';

export default function App() {
  const {
    carparks,
    filteredCarparks,
    summaryStats,
    favorites,
    toggleFavorite,
    config,
    updateConfig,
    filters,
    setFilters,
    selectedCarpark,
    setSelectedCarpark,
    userLocation,
    selectLocation,
    isRefreshing,
    lastUpdated,
    refreshNow,
    syncError,
  } = useCarparkTracker();

  const [activeView, setActiveView] = useState<'split' | 'grid' | 'table'>('split');
  const [mobileSplitTab, setMobileSplitTab] = useState<'map' | 'list'>('map');
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header (Adheres to Top Bar Contract) */}
      <Header
        config={config}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onOpenCalculatorModal={() => setIsCalculatorModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        onRefresh={refreshNow}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* Sync Error Alert Banner if backend connection failed */}
      {syncError && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-6 py-2.5 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Backend Sync Warning: {syncError}. Falling back to cached data.
            </span>
          </div>
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="text-xs underline hover:text-white font-medium ml-4 shrink-0"
          >
            Configure Endpoint
          </button>
        </div>
      )}

      {/* 2. Singapore Network Stats Banner */}
      <StatsBanner
        stats={summaryStats}
        userLocation={userLocation}
        onSelectLocation={selectLocation}
        lastUpdated={lastUpdated}
      />

      {/* 3. Search, Area, Agency, and Vehicle Filter Controls */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        totalMatches={filteredCarparks.length}
      />

      {/* 4. Main Viewport Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeView === 'split' ? (
          <div className="flex-1 flex flex-col lg:flex-row h-full min-h-[500px]">
            {/* Mobile Tab Toggle for Split View */}
            <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 text-xs">
              <button
                onClick={() => setMobileSplitTab('map')}
                className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-2 ${
                  mobileSplitTab === 'map'
                    ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Interactive Map</span>
              </button>
              <button
                onClick={() => setMobileSplitTab('list')}
                className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-2 ${
                  mobileSplitTab === 'list'
                    ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span>Carpark List ({filteredCarparks.length})</span>
              </button>
            </div>

            {/* Sidebar Carpark Cards */}
            <div
              className={`w-full lg:w-[480px] xl:w-[520px] lg:border-r border-slate-800 bg-slate-950/70 overflow-hidden flex flex-col ${
                mobileSplitTab === 'map' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <CarparkList
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                favorites={favorites}
                onSelectCarpark={setSelectedCarpark}
                onToggleFavorite={toggleFavorite}
                vehicleType={filters.vehicleType}
                viewMode="split"
                onResetFilters={() => setFilters(INITIAL_FILTERS)}
              />
            </div>

            {/* Interactive Leaflet Singapore Map */}
            <div
              className={`flex-1 h-[420px] lg:h-auto relative ${
                mobileSplitTab === 'list' ? 'hidden lg:block' : 'block'
              }`}
            >
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={setSelectedCarpark}
                userLocation={userLocation}
                vehicleType={filters.vehicleType}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <CarparkList
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              favorites={favorites}
              onSelectCarpark={setSelectedCarpark}
              onToggleFavorite={toggleFavorite}
              vehicleType={filters.vehicleType}
              viewMode={activeView}
              onResetFilters={() => setFilters(INITIAL_FILTERS)}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>SG ParkPulse</span>
          <span aria-hidden="true">·</span>
          <span>HDB · URA · LTA · Shopping Malls</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">Live Sync</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Backend Connection Guide
          </button>
          <span>Data.gov.sg Compatible</span>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        isFavorite={selectedCarpark ? favorites.includes(selectedCarpark.id) : false}
        onToggleFavorite={() => selectedCarpark && toggleFavorite(selectedCarpark.id)}
      />

      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={config}
        onSaveConfig={updateConfig}
        onRefreshNow={refreshNow}
      />

      <FeeCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        carparks={carparks}
        onSelectCarpark={setSelectedCarpark}
      />
    </div>
  );
}
