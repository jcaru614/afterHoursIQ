import { format } from 'date-fns';

export const getFgiColor = (value: number) => {
  if (value <= 25) return 'bg-[#b91c1c] text-white';
  if (value <= 44) return 'bg-[#ea580c] text-white';
  if (value <= 55) return 'bg-[#f59e0b] text-black';
  if (value <= 74) return 'bg-[#65a30d] text-black';
  return 'bg-[#15803d] text-white';
};

export const getVixColor = (value: number) => {
  if (value > 35) return 'bg-[#b91c1c] text-white';
  if (value > 25) return 'bg-[#ea580c] text-white';
  if (value >= 16) return 'bg-[#f59e0b] text-black';
  if (value >= 11) return 'bg-[#65a30d] text-black';
  return 'bg-[#15803d] text-white';
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

export const formatTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return format(date, "eee dd MMM ''yy hh:mm a");
};
