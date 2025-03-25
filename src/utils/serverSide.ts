export const SCAN_INTERVAL_FAST = 15 * 1000; // 15 seconds — aggressive polling after market close
export const SCAN_INTERVAL_SLOW = 60 * 1000; // 60 seconds — slower long-term polling if report not dropped quickly
export const FAST_SCAN_DURATION = 7 * 60 * 1000; // 7 minutes — fast polling window after market close
export const MAX_SCANING_TIME = 30 * 60 * 1000; // 30 minutes — max time to run scanning before timing out

export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export const hasCorrectQuarter = (url: string, quarter: string): boolean => {
  const qNum = Number(quarter);
  const lower = url.toLowerCase();
  const textForms = [
    `q${qNum}`,
    `quarter-${qNum}`,
    `quarter ${qNum}`,
    ['first', 'second', 'third', 'fourth'][qNum - 1],
    `${qNum}${getOrdinalSuffix(qNum)}`,
  ];
  return textForms.some((form) => lower.includes(form));
};

export const hasCorrectYear = (url: string, year: string): boolean => {
  const fullYear = `20${year}`;
  const lower = url.toLowerCase();
  return (
    lower.includes(`fy${year}`) ||
    lower.includes(`fy${fullYear}`) ||
    lower.includes(`/${year}/`) ||
    lower.includes(`/${fullYear}/`) ||
    lower.includes(year) ||
    lower.includes(fullYear)
  );
};
