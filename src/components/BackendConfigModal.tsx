import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Play, Code, Radio } from 'lucide-react';
import { BackendIntegrationConfig } from '../types/carpark';
import { CarparkService } from '../services/carparkService';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendIntegrationConfig;
  onSaveConfig: (config: BackendIntegrationConfig) => void;
  onRefreshNow: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshNow,
}) => {
  const [formData, setFormData] = useState<BackendIntegrationConfig>(config);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    latencyMs?: number;
    sample?: unknown;
  }>({ status: 'idle', message: '' });

  const [activeTab, setActiveTab] = useState<'settings' | 'schema' | 'sampleCode'>('settings');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection to endpoint...' });
    const res = await CarparkService.testEndpoint(formData.apiUrl, formData.apiKey);
    if (res.success) {
      setTestResult({
        status: 'success',
        message: res.message,
        latencyMs: res.latencyMs,
        sample: res.sampleData,
      });
    } else {
      setTestResult({
        status: 'error',
        message: res.message,
        latencyMs: res.latencyMs,
      });
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onRefreshNow();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Backend Integration Hub</h2>
              <p className="text-xs text-slate-400">Configure or test your real-time car park backend connection</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Payload Contracts
          </button>
          <button
            onClick={() => setActiveTab('sampleCode')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'sampleCode'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sample Backend Code
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Mode Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Operating Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData((p) => ({ ...p, mode: 'simulator' }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.mode === 'simulator'
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Interactive Simulator (Frontend Only)</span>
                      </span>
                      {formData.mode === 'simulator' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Uses built-in authentic Singapore dataset with dynamic lot occupancy drift. No backend server required.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData((p) => ({ ...p, mode: 'custom_api' }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.mode === 'custom_api'
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-sky-400" />
                        <span>Live Backend Endpoint</span>
                      </span>
                      {formData.mode === 'custom_api' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Polls your custom API or the official GovTech Singapore DataMall endpoint over HTTP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoint URL */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">API Endpoint URL</label>
                <input
                  type="text"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, apiUrl: e.target.value }))}
                  placeholder="https://api.data.gov.sg/v1/transport/carpark-availability or http://localhost:5000/api/carparks"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Supports GovTech DataMall format or standard Carpark JSON format.
                </span>
              </div>

              {/* Auth API Key */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  API Key / Bearer Token <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="Leave empty if your backend has no auth, or enter token"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Polling Interval & Auto-refresh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Polling Interval</label>
                  <select
                    value={formData.pollingIntervalSeconds}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, pollingIntervalSeconds: Number(e.target.value) }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={10}>Every 10 seconds (High frequency)</option>
                    <option value={30}>Every 30 seconds (Recommended)</option>
                    <option value={60}>Every 60 seconds (Standard)</option>
                    <option value={300}>Every 5 minutes</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={formData.autoRefresh}
                    onChange={(e) => setFormData((p) => ({ ...p, autoRefresh: e.target.checked }))}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="autoRefresh" className="text-slate-200 font-medium cursor-pointer">
                    Enable automatic live background polling
                  </label>
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors border border-slate-700"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{testResult.status === 'testing' ? 'Testing endpoint...' : 'Test Connection'}</span>
                </button>

                {testResult.status !== 'idle' && (
                  <div
                    className={`mt-2.5 p-3 rounded-lg border text-xs ${
                      testResult.status === 'success'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : testResult.status === 'error'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {testResult.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div>{testResult.message}</div>
                        {testResult.latencyMs !== undefined && (
                          <div className="font-mono text-[11px] opacity-80">
                            Round-trip latency: {testResult.latencyMs}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                When you integrate your backend later, your API can return either of the following two JSON structures:
              </p>

              <div>
                <span className="block text-slate-300 font-semibold mb-1">
                  1. GovTech Singapore data.gov.sg standard format:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`{
  "items": [
    {
      "timestamp": "2026-11-09T19:30:00+08:00",
      "carpark_data": [
        {
          "carpark_number": "ACB",
          "carpark_info": [
            {
              "total_lots": "650",
              "lot_type": "C",
              "lots_available": "142"
            }
          ],
          "update_datetime": "2026-11-09T19:28:45"
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <div>
                <span className="block text-slate-300 font-semibold mb-1">
                  2. Direct Carpark[] REST Array format:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-mono text-[11px] overflow-x-auto">
{`[
  {
    "id": "ORC-ION",
    "name": "ION Orchard Car Park",
    "address": "2 Orchard Turn, Singapore 238801",
    "area": "Orchard",
    "agency": "Private/Mall",
    "carparkType": "Basement",
    "coordinates": { "lat": 1.3040, "lng": 103.8318 },
    "lots": {
      "car": { "total": 650, "available": 142 },
      "motorcycle": { "total": 40, "available": 14 }
    },
    "rates": {
      "weekdayPeak": "$2.67 1st hr",
      "estimatedHourlyDay": 5.34
    }
  }
]`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'sampleCode' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Here is a starter Node.js / Express backend route you can drop into your server when you are ready to integrate:
              </p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`// server.ts (Express backend)
import express from 'express';
import axios from 'axios';

const app = express();

// Proxy to Singapore data.gov.sg carpark API
app.get('/api/carparks', async (req, res) => {
  try {
    const govResponse = await axios.get(
      'https://api.data.gov.sg/v1/transport/carpark-availability'
    );
    res.json(govResponse.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Singapore carparks' });
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md shadow-emerald-950/40"
          >
            Apply & Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
