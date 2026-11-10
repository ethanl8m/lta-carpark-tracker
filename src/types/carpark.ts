export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'Private/Mall';

export type CarparkType = 'Multi-Storey' | 'Basement' | 'Surface' | 'Mechanized';

export type VehicleCategory = 'car' | 'motorcycle' | 'heavy' | 'ev';

export type LotStatus = 'ample' | 'moderate' | 'limited' | 'full';

export interface LotCapacity {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  total: number;
  available: number;
  provider: string; // 'SP Mobility' | 'Shell Recharge' | 'CDG ENGIE' | 'Charge+' | 'Tesla Supercharger'
  powerKw: number;
  plugType: 'Type 2' | 'CCS2' | 'Type 2 & CCS2';
}

export interface ParkingRates {
  weekdayPeak: string; // e.g. "$1.20 / 30 mins"
  weekdayOffPeak: string; // e.g. "$0.60 / 30 mins"
  saturday: string;
  sundayHoliday: string;
  gracePeriodMins: number; // e.g. 10 or 15 mins
  freeParkingPromo?: string;
  estimatedHourlyDay: number; // for sorting/filtering
}

export interface HourlyOccupancy {
  hour: number; // 0 to 23
  occupancyPercent: number; // 0 to 100
}

export interface Carpark {
  id: string; // Carpark code, e.g., "ACB", "ORC-ION", "MBS-CP1"
  name: string;
  address: string;
  area: 'Central / CBD' | 'Orchard' | 'Marina Bay' | 'East' | 'West' | 'North' | 'North-East';
  agency: CarparkAgency;
  carparkType: CarparkType;
  coordinates: {
    lat: number;
    lng: number;
  };
  lots: {
    car: LotCapacity;
    motorcycle?: LotCapacity;
    heavy?: LotCapacity;
  };
  evChargers?: EVChargerInfo;
  rates: ParkingRates;
  heightLimitMeters: number;
  systemType: 'Electronic Parking (EPS)' | 'Coupon / Electronic';
  lastUpdated: string;
  distanceKm?: number;
  hourlyTrends?: HourlyOccupancy[];
}

export interface FilterState {
  searchQuery: string;
  area: string;
  agency: string;
  vehicleType: VehicleCategory;
  lotStatus: string; // 'all' | 'ample' | 'moderate' | 'limited' | 'full'
  minAvailableLots: number;
  maxHourlyRate: number;
  hasEvChargers: boolean;
  minHeightClearance: number;
  sortBy: 'availability' | 'lots' | 'distance' | 'name' | 'rate';
  sortOrder: 'asc' | 'desc';
}

export interface BackendIntegrationConfig {
  mode: 'simulator' | 'custom_api';
  apiUrl: string;
  apiKey: string;
  pollingIntervalSeconds: number;
  autoRefresh: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  errorMessage?: string;
}
