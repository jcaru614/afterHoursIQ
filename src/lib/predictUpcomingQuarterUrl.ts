import { getOrdinalSuffix } from '@/utils/serverSide';

function replacePattern(
  part: string,
  patterns: { regex: RegExp; replace: (substring: string, ...args: any[]) => string }[]
): string {
  return patterns.reduce((newPart, { regex, replace }) => newPart.replace(regex, replace), part);
}

export function predictUpcomingQuarterUrl(
  currentUrl: string,
  targetQuarter: number,
  targetYear: string
): string {
  console.log('predictUpcomingQuarterUrl ', targetQuarter, targetYear);
  const url = new URL(currentUrl.toLowerCase());
  const [domain, ...pathParts] = url.pathname.split('/').filter(Boolean);

  const comboPatterns = [
    {
      regex: /(fy)?(\d{2,4})[-_]?q([1-4])/gi,
      replace: (_: string, fy, year) =>
        `${fy || ''}${year.length === 4 ? `20${targetYear}` : targetYear}q${targetQuarter}`,
    },
    {
      regex: /q([1-4])[-_]?(fy)?(\d{2,4})/gi,
      replace: (_: string, q, fy, year) =>
        `q${targetQuarter}${fy || ''}${year.length === 4 ? `20${targetYear}` : targetYear}`,
    },
    {
      regex: /(\d{4})q([1-4])/gi,
      replace: (_: string, year) =>
        `${year.length === 4 ? `20${targetYear}` : targetYear}q${targetQuarter}`,
    },
    {
      regex: /q([1-4])[-_](\d{2,4})/gi,
      replace: (_: string, q, year) =>
        `q${targetQuarter}-${year.length === 4 ? `20${targetYear}` : targetYear}`,
    },
  ];

  const quarterPatterns = [
    { regex: /q([1-4])/g, replace: () => `q${targetQuarter}` },
    { regex: /([1-4])q/g, replace: () => `${targetQuarter}q` },
    { regex: /quarter[- ]?([1-4])/g, replace: () => `quarter-${targetQuarter}` },
    {
      regex: /(first|second|third|fourth)[- ]?quarter/g,
      replace: () => ['first', 'second', 'third', 'fourth'][targetQuarter - 1] + '-quarter',
    },
    {
      regex: /([1-4])(st|nd|rd|th)[- ]?quarter/g,
      replace: () => `${targetQuarter}${getOrdinalSuffix(targetQuarter)}-quarter`,
    },
  ];

  const yearPatterns = [
    {
      regex: /\b(\d{2}|\d{4})\b/g,
      replace: (_: string, yearPart: string) => {
        return yearPart.length === 4 ? `20${targetYear}` : targetYear;
      },
    },
  ];

  const newPathParts = pathParts.map((part) => {
    let updatedPart = replacePattern(part, yearPatterns);
    updatedPart = replacePattern(updatedPart, comboPatterns);
    updatedPart = replacePattern(updatedPart, quarterPatterns);
    return updatedPart;
  });

  url.pathname = `/${domain}/${newPathParts.join('/')}`;
  return url.toString();
}
