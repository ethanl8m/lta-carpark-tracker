import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Set CORS headers for serverless execution
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasLtaKey = Boolean(
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LTA DataMall Real-Time Car Park Tracker API',
    ltaKeyConfigured: hasLtaKey,
    uptimeSeconds: Math.round(process.uptime()),
    endpoints: {
      health: '/api/health',
      carparkAvailability: '/api/carparkavailability',
    },
    message: hasLtaKey
      ? 'LTA DataMall AccountKey is configured and active.'
      : 'LTA_DATAMALL_ACCOUNT_KEY environment variable is not yet configured. The API will return guidance until your key is set in .env.',
  });
}

export { handler };
