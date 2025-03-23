export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

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

export function isPDFFile(contentType: string, url: string): boolean {
  const PDF_CONTENT_TYPES = ['application/pdf', 'application/octet-stream'];

  const isTypePdf = PDF_CONTENT_TYPES.includes(contentType.toLowerCase());
  const isExtensionPdf = url.toLowerCase().endsWith('.pdf');

  return isTypePdf || isExtensionPdf;
}
