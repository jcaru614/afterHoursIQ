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
  const url = new URL(currentUrl.toLowerCase());
  const [domain, ...pathParts] = url.pathname.split('/').filter(Boolean);

  const comboPatterns = [
    {
      regex: /(fy)?(\d{2,4})[-_]?q([1-4])/gi,
      replace: () => `${targetYear}q${targetQuarter}`,
    },
    {
      regex: /q([1-4])[-_]?(fy)?(\d{2,4})/gi,
      replace: () => `q${targetQuarter}fy${targetYear}`,
    },
    {
      regex: /(\d{4})q([1-4])/gi,
      replace: () => `${targetYear}q${targetQuarter}`,
    },
    {
      regex: /q([1-4])[-_](\d{2,4})/gi,
      replace: () => `q${targetQuarter}-${targetYear}`,
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
      replace: (_: string, yearPart: string) =>
        yearPart.length === 4 && targetYear.length === 2 ? `20${targetYear}` : targetYear,
    },
  ];

  const newPathParts = pathParts.map((part) => {
    let updatedPart = replacePattern(part, comboPatterns);
    updatedPart = replacePattern(updatedPart, quarterPatterns);
    updatedPart = replacePattern(updatedPart, yearPatterns);
    return updatedPart;
  });

  url.pathname = `/${domain}/${newPathParts.join('/')}`;
  return url.toString();
}
