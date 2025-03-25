import { getOrdinalSuffix } from '@/utils/serverSide';

function replacePattern(
  part: string,
  patterns: { regex: RegExp; replace: (substring: string, ...args: any[]) => string }[]
): string {
  return patterns.reduce((newPart, { regex, replace }) => newPart.replace(regex, replace), part);
}

export function predictNextQuarterUrl(
  currentUrl: string,
  targetQuarter: number,
  targetYear: string
): string {
  const url = new URL(currentUrl);
  const [domain, ...pathParts] = url.pathname.split('/').filter(Boolean);

  const quarterPatterns = [
    {
      regex: /q([1-4])/gi,
      replace: (match: string, quarter: string) =>
        match[0] === 'Q' ? `Q${targetQuarter}` : `q${targetQuarter}`,
    },
    {
      regex: /quarter[- ]?([1-4])/gi,
      replace: () => `quarter-${targetQuarter}`,
    },
    {
      regex: /(first|second|third|fourth)[- ]?quarter/gi,
      replace: () => ['first', 'second', 'third', 'fourth'][targetQuarter - 1] + '-quarter',
    },
    {
      regex: /([1-4])(st|nd|rd|th)[- ]?quarter/gi,
      replace: () => `${targetQuarter}${getOrdinalSuffix(targetQuarter)}-quarter`,
    },
  ];

  const yearPatterns = [
    {
      regex: /\b(FY)?(\d{2}|\d{4})\b/gi,
      replace: (match: string, fyPrefix: string, yearPart: string) => {
        const newYear = yearPart.length === 2 ? targetYear : `20${targetYear}`;
        return fyPrefix ? `FY${newYear}` : newYear;
      },
    },
    {
      regex: /\/(\d{2}|\d{4})\//g,
      replace: (match: string, yearPart: string) =>
        yearPart.length === 2 ? `/${targetYear}/` : `/20${targetYear}/`,
    },
  ];

  const newPathParts = pathParts.map((part) => {
    let updatedPart = replacePattern(part, quarterPatterns);
    updatedPart = replacePattern(updatedPart, yearPatterns);
    return updatedPart;
  });

  url.pathname = `/${domain}/${newPathParts.join('/')}`;
  return url.toString();
}
