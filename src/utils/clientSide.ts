export const getFgiColor = (value: number) => {
  if (value <= 20) return 'bg-red-900 text-white';
  if (value <= 40) return 'bg-red-600 text-white';
  if (value <= 60) return 'bg-yellow-500 text-black';
  if (value <= 80) return 'bg-green-500 text-black';
  return 'bg-green-800 text-white';
};

export const getVixColor = (value: number) => {
  if (value > 35) return 'bg-red-900 text-white';
  if (value > 25) return 'bg-red-600 text-white';
  if (value >= 16) return 'bg-yellow-500 text-black';
  if (value >= 11) return 'bg-green-500 text-black';
  return 'bg-green-800 text-white';
};

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
