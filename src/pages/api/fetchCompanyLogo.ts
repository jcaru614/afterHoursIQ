import { NextApiRequest, NextApiResponse } from 'next';

export const extractDomain = (url: string): string => {
  if (!url) return '';

  const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/;
  if (!urlPattern.test(url)) {
    console.error('Invalid URL:', url);
    return '';
  }

  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const { hostname } = new URL(formattedUrl);

    return hostname.split('.').slice(-2).join('.');
  } catch (e) {
    console.error('Invalid URL:', e);
    return '';
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Only GET requests are allowed.' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  try {
    const domain = extractDomain(url);
    if (!domain) {
      return res.status(400).json({ error: 'Invalid domain extraction' });
    }

    res.status(200).json({ domain });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
