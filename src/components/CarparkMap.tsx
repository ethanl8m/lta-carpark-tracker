import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleCategory } from '../types/carpark';
import { getLotStatus } from '../hooks/useCarparkTracker';
import { Locate, Maximize2 } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userLocation: { lat: number; lng: number; label: string };
  vehicleType: VehicleCategory;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  vehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Singapore
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    // Dark sleek basemap (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        ">
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 9999px;
            background: rgba(56, 189, 248, 0.25);
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 12px;
            height: 12px;
            border-radius: 9999px;
            background: #38bdf8;
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindTooltip(`📍 Reference: ${userLocation.label}`, {
        direction: 'top',
        className: 'bg-slate-900 text-sky-400 border border-slate-700 text-xs px-2 py-1 rounded shadow-lg',
      });
  }, [userLocation]);

  // Update Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      let lotCount = cp.lots.car.available;
      let totalLots = cp.lots.car.total;

      if (vehicleType === 'motorcycle' && cp.lots.motorcycle) {
        lotCount = cp.lots.motorcycle.available;
        totalLots = cp.lots.motorcycle.total;
      } else if (vehicleType === 'heavy' && cp.lots.heavy) {
        lotCount = cp.lots.heavy.available;
        totalLots = cp.lots.heavy.total;
      } else if (vehicleType === 'ev' && cp.evChargers) {
        lotCount = cp.evChargers.available;
        totalLots = cp.evChargers.total;
      }

      const status = getLotStatus(lotCount, totalLots);
      const isSelected = selectedCarpark?.id === cp.id;

      // Color scheme based on status
      let bgColor = '#10b981'; // emerald
      let borderColor = '#059669';
      let textColor = '#ffffff';

      if (status === 'moderate') {
        bgColor = '#f59e0b'; // amber
        borderColor = '#d97706';
      } else if (status === 'limited') {
        bgColor = '#f97316'; // orange
        borderColor = '#ea580c';
      } else if (status === 'full') {
        bgColor = '#ef4444'; // rose/red
        borderColor = '#dc2626';
      }

      const iconHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${bgColor};
          color: ${textColor};
          border: ${isSelected ? '3px solid #ffffff' : `1.5px solid ${borderColor}`};
          box-shadow: ${isSelected ? '0 0 16px rgba(16, 185, 129, 0.9), 0 4px 10px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)'};
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.15s ease-out;
          border-radius: 8px;
          padding: 2px 6px;
          min-width: 38px;
          height: 26px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: -0.5px;
          white-space: nowrap;
          cursor: pointer;
        ">
          ${lotCount === 0 ? 'FULL' : lotCount}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-cp-marker',
        html: iconHtml,
        iconSize: [44, 28],
        iconAnchor: [22, 14],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      const popupContent = `
        <div style="padding: 12px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-family: monospace; color: #94a3b8; font-weight: 600;">${cp.id} · ${cp.agency}</span>
            <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(51, 65, 85, 0.8); color: #e2e8f0;">${cp.area}</span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #ffffff; line-height: 1.3;">${cp.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #cbd5e1;">${cp.address}</p>
          <div style="display: flex; align-items: baseline; gap: 6px; padding: 6px 8px; background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 6px;">
            <span style="font-size: 18px; font-weight: 800; font-family: monospace; color: ${bgColor};">${lotCount}</span>
            <span style="font-size: 11px; color: #94a3b8;">/ ${totalLots} available lots</span>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #38bdf8; font-weight: 500;">
            ${cp.rates.weekdayPeak}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    });
  }, [carparks, selectedCarpark, onSelectCarpark, vehicleType]);

  // Center on selected carpark when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark) return;

    map.panTo([selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [selectedCarpark]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([1.3521, 103.8198], 12);
    }
  };

  const handleCenterUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, {
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Legend & Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        {/* Legend */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs space-y-1.5 pointer-events-auto">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Lot Availability
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
            <span className="text-slate-300">Ample (&gt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
            <span className="text-slate-300">Moderate (5-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
            <span className="text-slate-300">Limited / Full (&lt;5%)</span>
          </div>
        </div>
      </div>

      {/* Top right map utility tools */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleCenterUser}
          title="Center on Reference Landmark"
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md transition-colors"
        >
          <Locate className="w-4 h-4 text-sky-400" />
        </button>
        <button
          onClick={handleResetView}
          title="Fit All Singapore"
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
