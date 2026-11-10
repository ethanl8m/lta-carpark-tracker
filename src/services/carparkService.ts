import { Carpark, BackendIntegrationConfig } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/mockCarparks';

const STORAGE_KEY_CARPARKS = 'sg_parkpulse_carparks_v1';
const STORAGE_KEY_CONFIG = 'sg_parkpulse_backend_cfg_v1';
const STORAGE_KEY_FAVORITES = 'sg_parkpulse_favorites_v1';

export const DEFAULT_BACKEND_CONFIG: BackendIntegrationConfig = {
  mode: 'simulator',
  apiUrl: '/api/carparkavailability',
  apiKey: '',
  pollingIntervalSeconds: 30,
  autoRefresh: true,
  lastSyncStatus: 'idle',
};

// Calculate Haversine distance in km between two lat/lng points
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class CarparkService {
  private static carparks: Carpark[] = [];

  static getInitialData(): Carpark[] {
    const cached = localStorage.getItem(STORAGE_KEY_CARPARKS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.carparks = parsed;
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cached carparks', e);
      }
    }
    this.carparks = [...INITIAL_CARPARKS];
    return this.carparks;
  }

  static getConfig(): BackendIntegrationConfig {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_BACKEND_CONFIG;
      }
    }
    return DEFAULT_BACKEND_CONFIG;
  }

  static saveConfig(config: BackendIntegrationConfig): void {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }

  static getFavorites(): string[] {
    const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return ['ORC-ION', 'CBD-STC', 'HDB-AM1']; // default initial bookmarks
  }

  static saveFavorites(favIds: string[]): void {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favIds));
  }

  // Realistic simulation of Singapore lot changes (cars entering and leaving)
  static simulateLotChanges(currentCarparks: Carpark[]): Carpark[] {
    const now = new Date();
    const updated = currentCarparks.map((cp) => {
      // 70% chance to fluctuate slightly by -3 to +3 lots
      if (Math.random() < 0.7) {
        const delta = Math.floor(Math.random() * 7) - 3;
        const newCarAvail = Math.max(0, Math.min(cp.lots.car.total, cp.lots.car.available + delta));

        let newBikeAvail = cp.lots.motorcycle?.available;
        if (cp.lots.motorcycle && Math.random() < 0.4) {
          const bikeDelta = Math.floor(Math.random() * 3) - 1;
          newBikeAvail = Math.max(0, Math.min(cp.lots.motorcycle.total, cp.lots.motorcycle.available + bikeDelta));
        }

        let newEvAvail = cp.evChargers?.available;
        if (cp.evChargers && Math.random() < 0.3) {
          const evDelta = Math.random() < 0.5 ? 1 : -1;
          newEvAvail = Math.max(0, Math.min(cp.evChargers.total, cp.evChargers.available + evDelta));
        }

        return {
          ...cp,
          lots: {
            ...cp.lots,
            car: {
              ...cp.lots.car,
              available: newCarAvail,
            },
            ...(cp.lots.motorcycle && newBikeAvail !== undefined
              ? { motorcycle: { ...cp.lots.motorcycle, available: newBikeAvail } }
              : {}),
          },
          ...(cp.evChargers && newEvAvail !== undefined
            ? { evChargers: { ...cp.evChargers, available: newEvAvail } }
            : {}),
          lastUpdated: now.toISOString(),
        };
      }
      return cp;
    });

    localStorage.setItem(STORAGE_KEY_CARPARKS, JSON.stringify(updated));
    return updated;
  }

  // Live Backend Fetch with support for Data.gov.sg or Custom REST payload
  static async fetchFromCustomBackend(
    config: BackendIntegrationConfig,
    baseCarparks: Carpark[]
  ): Promise<{ carparks: Carpark[]; rawResponse?: unknown }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['x-api-key'] = config.apiKey;
    }

    const response = await fetch(config.apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API responded with HTTP status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if it's the official GovTech / data.gov.sg LTA Carpark Availability format
    // schema: { items: [ { timestamp: string, carpark_data: [ { carpark_number, carpark_info: [...] } ] } ] }
    if (data?.items?.[0]?.carpark_data) {
      const dataMap = new Map<string, { total: number; available: number }>();
      const govList = data.items[0].carpark_data;

      for (const item of govList) {
        const code = item.carpark_number;
        const info = item.carpark_info?.[0];
        if (info) {
          dataMap.set(code, {
            total: parseInt(info.total_lots, 10) || 0,
            available: parseInt(info.lots_available, 10) || 0,
          });
        }
      }

      // Merge into known carparks or create new entries
      const merged = baseCarparks.map((cp) => {
        const live = dataMap.get(cp.id);
        if (live && live.total > 0) {
          return {
            ...cp,
            lots: {
              ...cp.lots,
              car: {
                total: live.total,
                available: live.available,
              },
            },
            lastUpdated: data.items[0].timestamp || new Date().toISOString(),
          };
        }
        return cp;
      });

      return { carparks: merged, rawResponse: data };
    }

    // Check if it's LTA DataMall OData format (returned by /api/carparkavailability)
    // schema: { value: [ { CarParkID, Area, Development, Location, AvailableLots, LotType, Agency } ] }
    if (Array.isArray(data?.value)) {
      const ltaItems = data.value;
      const ltaMap = new Map<string, number>();

      for (const item of ltaItems) {
        if (item.CarParkID) {
          ltaMap.set(String(item.CarParkID).toLowerCase(), Number(item.AvailableLots) || 0);
        }
        if (item.Development) {
          ltaMap.set(String(item.Development).toLowerCase(), Number(item.AvailableLots) || 0);
        }
      }

      const merged = baseCarparks.map((cp) => {
        const liveAvail =
          ltaMap.get(cp.id.toLowerCase()) ??
          ltaMap.get(cp.name.toLowerCase());

        if (liveAvail !== undefined) {
          return {
            ...cp,
            lots: {
              ...cp.lots,
              car: {
                total: Math.max(cp.lots.car.total, liveAvail),
                available: liveAvail,
              },
            },
            lastUpdated: data.timestamp || new Date().toISOString(),
          };
        }
        return cp;
      });

      return { carparks: merged, rawResponse: data };
    }

    // Check if response is a direct array of Carpark objects
    if (Array.isArray(data)) {
      return { carparks: data as Carpark[], rawResponse: data };
    }

    // Check if wrapped in data.carparks
    if (Array.isArray(data?.carparks)) {
      return { carparks: data.carparks as Carpark[], rawResponse: data };
    }

    throw new Error('Unrecognized response format. Expected LTA DataMall format (data.value) or Carpark[] array.');
  }

  // Quick test connectivity for the Backend Integration modal
  static async testEndpoint(
    url: string,
    apiKey?: string
  ): Promise<{ success: boolean; message: string; sampleData?: unknown; latencyMs: number }> {
    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch(url, { method: 'GET', headers });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          success: false,
          message: `Endpoint returned HTTP ${res.status}: ${res.statusText}`,
          latencyMs,
        };
      }

      const json = await res.json();
      return {
        success: true,
        message: `Connected successfully (${latencyMs}ms latency). Received valid JSON.`,
        sampleData: json,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Connection failed: ${errMsg}. Note: ensure CORS headers (Access-Control-Allow-Origin: *) are enabled on the backend server.`,
        latencyMs,
      };
    }
  }
}
