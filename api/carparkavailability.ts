import type { Request, Response } from 'express';

const LTA_DATAMALL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export default async function handler(req: Request, res: Response) {
  // CORS Headers for serverless & cross-origin frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  // Retrieve AccountKey without hardcoding (from env vars or optional client test header)
  const accountKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string);

  if (!accountKey) {
    return res.status(401).json({
      error: 'LTA_DATAMALL_ACCOUNT_KEY is not configured',
      message:
        'Missing LTA DataMall AccountKey. Please configure LTA_DATAMALL_ACCOUNT_KEY in your server environment (.env) or pass it via the AccountKey header.',
      endpoint: LTA_DATAMALL_ENDPOINT,
      setupHelp: {
        envVarName: 'LTA_DATAMALL_ACCOUNT_KEY',
        portalUrl: 'https://datamall.lta.gov.sg/content/datamall/en/request-for-api-access.html',
        headerRequired: 'AccountKey',
      },
    });
  }

  try {
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const fetchAll = req.query.all === 'true';

    // Helper to fetch a single page from LTA DataMall (up to 500 records per call)
    const fetchLtaPage = async (pageSkip: number) => {
      const url = new URL(LTA_DATAMALL_ENDPOINT);
      if (pageSkip > 0) {
        url.searchParams.set('$skip', String(pageSkip));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `LTA DataMall responded with HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    };

    let allLots: Array<{
      CarParkID: string;
      Area: string;
      Development: string;
      Location: string;
      AvailableLots: number;
      LotType: string;
      Agency: string;
    }> = [];

    const firstPage = await fetchLtaPage(skip);
    allLots = firstPage.value || [];

    // If fetchAll is requested and first page reached max batch size (500), fetch next batches
    if (fetchAll && allLots.length === 500) {
      let currentSkip = 500;
      let hasMore = true;

      while (hasMore && currentSkip < 3000) { // Safety ceiling of 3000 carparks
        try {
          const nextPage = await fetchLtaPage(currentSkip);
          const nextItems = nextPage.value || [];
          allLots = allLots.concat(nextItems);
          if (nextItems.length < 500) {
            hasMore = false;
          } else {
            currentSkip += 500;
          }
        } catch {
          hasMore = false;
        }
      }
    }

    // Optional agency filter (e.g. ?agency=HDB or ?agency=LTA or ?agency=URA)
    const agencyFilter = typeof req.query.agency === 'string' ? req.query.agency.toUpperCase() : null;
    if (agencyFilter) {
      allLots = allLots.filter((item) => item.Agency?.toUpperCase() === agencyFilter);
    }

    // Optional vehicle lot type filter (C = Car, M = Motorcycle, H = Heavy)
    const lotTypeFilter = typeof req.query.lotType === 'string' ? req.query.lotType.toUpperCase() : null;
    if (lotTypeFilter) {
      allLots = allLots.filter((item) => item.LotType?.toUpperCase() === lotTypeFilter);
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LTA DataMall CarParkAvailabilityv2',
      count: allLots.length,
      value: allLots,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      error: 'Failed to communicate with LTA DataMall',
      details: message,
      endpoint: LTA_DATAMALL_ENDPOINT,
    });
  }
}

export { handler };
