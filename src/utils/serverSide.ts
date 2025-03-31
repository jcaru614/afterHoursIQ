export const SCAN_INTERVAL_FAST = 12 * 1000; // 12 seconds — aggressive polling after market close
export const SCAN_INTERVAL_SLOW = 45 * 1000; // 45 seconds — slower long-term polling if report not dropped quickly
export const FAST_SCAN_DURATION = 8 * 60 * 1000; // 8 minutes — fast polling window after market close
export const MAX_SCANING_TIME = 30 * 60 * 1000; // 30 minutes — max time to run scanning before timing out

export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export const formatRevenue = (raw: number): string => {
  if (raw >= 1_000_000_000_000) {
    return `${(raw / 1_000_000_000_000).toFixed(2)}T`;
  } else if (raw >= 1_000_000_000) {
    return `${(raw / 1_000_000_000).toFixed(2)}B`;
  } else {
    return `${(raw / 1_000_000).toFixed(2)}M`;
  }
};

export const getVixSentiment = (vixValue) => {
  if (vixValue < 12) return 'extreme Low volatility';
  if (vixValue < 20) return 'low volatility';
  if (vixValue < 30) return 'normal volatility';
  if (vixValue < 40) return 'high volatility';
  return 'extreme volatility';
};

export const hasCorrectQuarter = (url: string, quarter: string): boolean => {
  const qNum = Number(quarter);
  const lower = url.toLowerCase();
  const textForms = [
    `q${qNum}`,
    `quarter-${qNum}`,
    `quarter ${qNum}`,
    `quarter${qNum}`,
    `qtr${qNum}`,
    `qtr-${qNum}`,
    `qtr_${qNum}`,
    ['first', 'second', 'third', 'fourth'][qNum - 1],
    `${qNum}${getOrdinalSuffix(qNum)}`,
  ];
  return textForms.some((form) => lower.includes(form));
};

export const hasCorrectYear = (url: string, year: string): boolean => {
  const fullYear = `20${year}`;
  const lower = url.toLowerCase();
  const textForms = [
    `fy${year}`,
    `fy${fullYear}`,
    `-${year}`,
    `-${fullYear}`,
    `_${year}`,
    `_${fullYear}`,
    year,
    fullYear,
  ];

  return textForms.some((form) => lower.includes(form));
};

export const hasQuarterYearCombo = (url: string, quarter: string, year: string): boolean => {
  const fullYear = `20${year}`;
  const lower = url.toLowerCase();
  const qNum = Number(quarter);
  const combos = [
    `q${qNum}fy${year}`,
    `q${qNum}fy${fullYear}`,
    `q${qNum}-fy${year}`,
    `q${qNum}-fy${fullYear}`,
    `fy${year}q${qNum}`,
    `fy${fullYear}q${qNum}`,
    `fy${year}-q${qNum}`,
    `fy${fullYear}-q${qNum}`,
  ];

  return combos.some((combo) => lower.includes(combo));
};
