import { isPDFFile } from '@/utils/serverSide';
import axios from 'axios';
import pdf from 'pdf-parse';

export const isEarningsReport = async (url: string): Promise<boolean> => {
  try {
    new URL(url);
    const response = await axios.get(url, {
      validateStatus: (status) => status >= 200 && status < 500,
      responseType: 'arraybuffer',
    });

    if (response.status !== 200) {
      console.log(`[${response.status}] Unexpected status for: ${url}`);
      return false;
    }

    const contentType = response.headers['content-type'];
    const isPDF = isPDFFile(contentType, url);

    let pageContent = '';
    if (isPDF) {
      try {
        const pdfData = await pdf(response.data);
        pageContent = pdfData.text.toLowerCase();
      } catch (pdfParseErr) {
        console.log('[PDF] Parsing failed:', pdfParseErr);
        return false;
      }
    } else {
      pageContent = response.data.toString().toLowerCase();
    }

    const quarterlyReportKeywords = [
      'revenue',
      'eps',
      'net income',
      'guidance',
      'quarterly',
      'gaap',
    ];
    return quarterlyReportKeywords.some((term) => pageContent.includes(term));
  } catch (fetchErr) {
    console.log('[Error] Checking report availability:', fetchErr);
    return false;
  }
};
