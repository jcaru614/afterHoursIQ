import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const cleanCompanyName = (raw: string) => {
  const suffixesToRemove = [
    'inc',
    'corp',
    'co',
    'ltd',
    'llc',
    'plc',
    'group',
    'company',
    'corporation',
    'holdings',
  ];

  let name = raw.toLowerCase();

  suffixesToRemove.forEach((suffix) => {
    const regex = new RegExp(suffix + '$', 'i');
    name = name.replace(regex, '');
  });

  name = name.replace(/[^a-z]/g, '');

  return name.trim();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { companyName } = req.query;
  console.log('lookUpTicker ', companyName);
  if (!companyName || typeof companyName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid company name' });
  }
  const cleanedCompanyName = cleanCompanyName(companyName);
  try {
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanedCompanyName)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
        },
      }
    );
    console.log('data ', data);
    const preferredExchanges = ['NMS', 'NASDAQ', 'NYQ', 'NYSE', 'ASE', 'ARCA'];
    const quotes = data.quotes.filter((q: any) => q.quoteType === 'EQUITY');
    const match = quotes.find((q) => preferredExchanges.includes(q.exchange)) || quotes[0];

    if (!match) return res.status(404).json({ error: 'Ticker not found' });

    return res.status(200).json({ ticker: match.symbol });
  } catch (err) {
    console.error('Ticker lookup failed:', err);
    return res.status(500).json({ error: 'Failed to lookup ticker' });
  }
}
