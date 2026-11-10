import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Carpark,
  FilterState,
  BackendIntegrationConfig,
  LotStatus,
} from '../types/carpark';
import {
  CarparkService,
  calculateDistanceKm,
} from '../services/carparkService';

export const SINGAPORE_LOCATIONS = [
  { label: 'Current / Browser Location', lat: 1.3040, lng: 103.8318, isGps: true },
  { label: 'Orchard Road (ION Orchard)', lat: 1.3040, lng: 103.8318 },
  { label: 'Raffles Place (CBD)', lat: 1.2830, lng: 103.8519 },
  { label: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607 },
  { label: 'Jewel Changi Airport', lat: 1.3602, lng: 103.9898 },
  { label: 'Jurong Gateway / JEM', lat: 1.3332, lng: 103.7431 },
  { label: 'Ang Mo Kio Hub', lat: 1.3692, lng: 103.8485 },
  { label: 'Punggol Waterway Point', lat: 1.4067, lng: 103.9022 },
];

export const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  area: 'All',
  agency: 'All',
  vehicleType: 'car',
  lotStatus: 'all',
  minAvailableLots: 0,
  maxHourlyRate: 20,
  hasEvChargers: false,
  minHeightClearance: 0,
  sortBy: 'availability',
  sortOrder: 'desc',
};

export function getLotStatus(available: number, total: number): LotStatus {
  if (total <= 0) return 'full';
  const ratio = available / total;
  if (available === 0) return 'full';
  if (ratio < 0.05) return 'limited';
  if (ratio < 0.20) return 'moderate';
  return 'ample';
}

export function useCarparkTracker() {
  const [carparks, setCarparks] = useState<Carpark[]>(() => CarparkService.getInitialData());
  const [config, setConfig] = useState<BackendIntegrationConfig>(() => CarparkService.getConfig());
  const [favorites, setFavorites] = useState<string[]>(() => CarparkService.getFavorites());
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string }>({
    label: 'Orchard Road (ION Orchard)',
    lat: 1.3040,
    lng: 103.8318,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      CarparkService.saveFavorites(next);
      return next;
    });
  }, []);

  // Update backend config
  const updateConfig = useCallback((newConfig: BackendIntegrationConfig) => {
    setConfig(newConfig);
    CarparkService.saveConfig(newConfig);
  }, []);

  // Set user location
  const selectLocation = useCallback((loc: { label: string; lat: number; lng: number; isGps?: boolean }) => {
    if (loc.isGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            label: 'My Exact GPS Location',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation failed or denied, using Orchard fallback', err);
          setUserLocation({
            label: 'Orchard Road (Fallback)',
            lat: 1.3040,
            lng: 103.8318,
          });
        }
      );
    } else {
      setUserLocation({
        label: loc.label,
        lat: loc.lat,
        lng: loc.lng,
      });
    }
  }, []);

  // Refresh data execution
  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    setSyncError(null);

    try {
      if (config.mode === 'simulator') {
        // Small delay to provide nice responsive tactile feel
        await new Promise((r) => setTimeout(r, 200));
        setCarparks((prev) => CarparkService.simulateLotChanges(prev));
        setLastUpdated(new Date());
      } else {
        // Fetch from custom backend
        const result = await CarparkService.fetchFromCustomBackend(config, carparks);
        setCarparks(result.carparks);
        setLastUpdated(new Date());
        updateConfig({
          ...config,
          lastSyncTime: new Date().toLocaleTimeString(),
          lastSyncStatus: 'success',
          errorMessage: undefined,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
      updateConfig({
        ...config,
        lastSyncStatus: 'error',
        errorMessage: msg,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [config, carparks, updateConfig]);

  // Polling interval
  useEffect(() => {
    if (!config.autoRefresh || config.pollingIntervalSeconds <= 0) return;

    const intervalMs = Math.max(5000, config.pollingIntervalSeconds * 1000);
    const interval = setInterval(() => {
      refreshNow();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [config.autoRefresh, config.pollingIntervalSeconds, refreshNow]);

  // Keep selectedCarpark in sync when lots update
  useEffect(() => {
    if (selectedCarpark) {
      const found = carparks.find((c) => c.id === selectedCarpark.id);
      if (found) setSelectedCarpark(found);
    }
  }, [carparks, selectedCarpark]);

  // Filter and sort carparks
  const processedCarparks = useMemo(() => {
    return carparks.map((cp) => {
      const distanceKm = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        cp.coordinates.lat,
        cp.coordinates.lng
      );
      return { ...cp, distanceKm };
    });
  }, [carparks, userLocation]);

  const filteredCarparks = useMemo(() => {
    return processedCarparks.filter((cp) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = cp.name.toLowerCase().includes(query);
        const matchesAddress = cp.address.toLowerCase().includes(query);
        const matchesId = cp.id.toLowerCase().includes(query);
        const matchesArea = cp.area.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesId && !matchesArea) {
          return false;
        }
      }

      // Area filter
      if (filters.area !== 'All' && cp.area !== filters.area) {
        return false;
      }

      // Agency filter
      if (filters.agency !== 'All' && cp.agency !== filters.agency) {
        return false;
      }

      // Vehicle Type capacity check
      let relevantLot = cp.lots.car;
      if (filters.vehicleType === 'motorcycle') {
        if (!cp.lots.motorcycle) return false;
        relevantLot = cp.lots.motorcycle;
      } else if (filters.vehicleType === 'heavy') {
        if (!cp.lots.heavy) return false;
        relevantLot = cp.lots.heavy;
      } else if (filters.vehicleType === 'ev') {
        if (!cp.evChargers || cp.evChargers.available <= 0) return false;
      }

      // Status filter
      if (filters.lotStatus !== 'all') {
        const status = getLotStatus(relevantLot.available, relevantLot.total);
        if (status !== filters.lotStatus) {
          return false;
        }
      }

      // Minimum available lots
      if (filters.minAvailableLots > 0 && relevantLot.available < filters.minAvailableLots) {
        return false;
      }

      // Max hourly rate
      if (cp.rates.estimatedHourlyDay > filters.maxHourlyRate) {
        return false;
      }

      // Has EV chargers
      if (filters.hasEvChargers && (!cp.evChargers || cp.evChargers.available <= 0)) {
        return false;
      }

      // Height clearance
      if (filters.minHeightClearance > 0 && cp.heightLimitMeters < filters.minHeightClearance) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;

      // Primary check: favorites to top if relevant, or straight by sort criteria
      if (filters.sortBy === 'availability') {
        const ratioA = a.lots.car.total > 0 ? a.lots.car.available / a.lots.car.total : 0;
        const ratioB = b.lots.car.total > 0 ? b.lots.car.available / b.lots.car.total : 0;
        comparison = ratioB - ratioA;
      } else if (filters.sortBy === 'lots') {
        comparison = b.lots.car.available - a.lots.car.available;
      } else if (filters.sortBy === 'distance') {
        comparison = (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      } else if (filters.sortBy === 'rate') {
        comparison = a.rates.estimatedHourlyDay - b.rates.estimatedHourlyDay;
      } else if (filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }

      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [processedCarparks, filters]);

  // Overview KPIs
  const summaryStats = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let fullCount = 0;
    let evChargersAvail = 0;

    for (const cp of processedCarparks) {
      totalLots += cp.lots.car.total;
      availableLots += cp.lots.car.available;
      if (cp.lots.car.available === 0) fullCount++;
      if (cp.evChargers) {
        evChargersAvail += cp.evChargers.available;
      }
    }

    const overallOccupancy = totalLots > 0 ? Math.round(((totalLots - availableLots) / totalLots) * 100) : 0;

    return {
      totalCarparks: processedCarparks.length,
      totalLots,
      availableLots,
      overallOccupancy,
      fullCount,
      evChargersAvail,
    };
  }, [processedCarparks]);

  return {
    carparks: processedCarparks,
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
  };
}
