import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { companyName } = req.query;
  if (!companyName || typeof companyName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid company name' });
  }

  try {
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
        },
      }
    );

    const match = data.quotes.find((q: any) => q.quoteType === 'EQUITY' && q.exchange === 'NMS');

    if (!match) return res.status(404).json({ error: 'Ticker not found' });

    return res.status(200).json({ ticker: match.symbol });
  } catch (err) {
    console.error('Ticker lookup failed:', err);
    return res.status(500).json({ error: 'Failed to lookup ticker' });
  }
}
