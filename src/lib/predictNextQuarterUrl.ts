export function predictNextQuarterUrl(
  currentUrl: string,
  targetQuarter: number,
  targetYear: string
): string {
  function getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
  const url = new URL(currentUrl);
  const [domain, ...pathParts] = url.pathname.split('/').filter(Boolean);

  const quarterPatterns = [
    {
      regex: /q([1-4])/gi,
      replace: (match, quarter) => {
        const isUpperCase = match[0] === 'Q';
        return isUpperCase ? `Q${targetQuarter}` : `q${targetQuarter}`;
      },
    },
    {
      regex: /quarter[- ]?([1-4])/gi,
      replace: () => `quarter-${targetQuarter}`,
    },
    {
      regex: /(first|second|third|fourth)[- ]?quarter/gi,
      replace: () =>
        ['first', 'second', 'third', 'fourth'][targetQuarter - 1] + '-quarter',
    },
    {
      regex: /([1-4])(st|nd|rd|th)[- ]?quarter/gi,
      replace: () =>
        `${targetQuarter}${getOrdinalSuffix(targetQuarter)}-quarter`,
    },
  ];

  const yearPatterns = [
    {
      regex: /\b(FY)?(\d{2}|\d{4})\b/gi,
      replace: (match, fyPrefix, yearPart) => {
        const newYear = yearPart.length === 2 ? targetYear : `20${targetYear}`;
        return fyPrefix ? `FY${newYear}` : newYear;
      },
    },
    {
      regex: /\/(\d{2}|\d{4})\//g,
      replace: (match, yearPart) =>
        yearPart.length === 2 ? `/${targetYear}/` : `/20${targetYear}/`,
    },
  ];

  const newPathParts = pathParts.map((part) => {
    let newPart = part;
    for (const pattern of quarterPatterns) {
      newPart = newPart.replace(pattern.regex, pattern.replace);
    }
    for (const pattern of yearPatterns) {
      newPart = newPart.replace(pattern.regex, pattern.replace);
    }
    return newPart;
  });

  url.pathname = `/${domain}/${newPathParts.join('/')}`;
  return url.toString();
}
