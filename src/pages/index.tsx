import { useState, useEffect } from 'react';
import { RatingMeter, ReportSummary, Alert, Navbar, CompanyLogo } from '@/components';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { setCompanyDomain, setReportData, setStatusCode } from '@/redux/slice';
import { RootState } from '@/redux/store';
import { getFgiColor, getVixColor } from '@/utils/clientSide';

export default function Home() {
  const dispatch = useDispatch();

  const [reportsPageUrl, setReportsPageUrl] = useState('');
  const [isReportsPageUrlValid, setIsReportsPageUrlValid] = useState<boolean | null>(null);
  const [isValidatingReportsPageUrl, setIsValidatingReportsPageUrl] = useState(false);

  const [previousReportUrl, setPreviousReportUrl] = useState('');
  const [isPreviousUrlValid, setIsPreviousUrlValid] = useState<boolean | null>(null);
  const [isValidatingPreviousUrl, setIsValidatingPreviousUrl] = useState(false);

  const [quarter, setQuarter] = useState('');
  const [year, setYear] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [fearAndGreedIndex, setFearAndGreedIndex] = useState<any>(null);
  const [vixIndex, setVixIndex] = useState<any>(null);
  const [includeMacro, setIncludeMacro] = useState(true);

  const currentYear = new Date().getFullYear();
  const validYears = [currentYear - 1, currentYear, currentYear + 1].map((year) =>
    year.toString().slice(-2)
  );

  const { rating, positives, negatives, reportUrl, statusCode, companyDomain } = useSelector(
    (state: RootState) => state.slice
  );

  const validateUrl = async (
    url: string,
    setValid: (val: boolean | null) => void,
    setLoading: (val: boolean) => void
  ) => {
    if (!url.trim()) {
      setValid(null);
      return;
    }

    try {
      new URL(url);
    } catch {
      setValid(false);
      return;
    }

    setLoading(true);
    setValid(null);

    try {
      const res = await axios.get(`/api/validateReportUrl?url=${encodeURIComponent(url)}`);
      setValid(res.status === 200 && res.data.valid === true);
    } catch {
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReportsPageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setReportsPageUrl(newUrl);

    if (!newUrl) {
      dispatch(setCompanyDomain(null));
      setIsReportsPageUrlValid(null);
      return;
    }

    fetchCompanyLogo(newUrl);
    validateUrl(newUrl, setIsReportsPageUrlValid, setIsValidatingReportsPageUrl);
  };

  const handlePreviousReportUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviousReportUrl(url);
    validateUrl(url, setIsPreviousUrlValid, setIsValidatingPreviousUrl);
  };

  const fetchCompanyLogo = async (url: string) => {
    if (!url.trim()) return;
    try {
      const { data } = await axios.get(`/api/fetchCompanyLogo?url=${url}`);
      if (data) {
        dispatch(setCompanyDomain(data.domain));
      }
    } catch (error) {
      console.error('Error fetching company overview:', error.response?.data || error.message);
    }
  };

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuarter(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
  };

  const handleStartScanning = async () => {
    setIsScanning(true);
    try {
      const requestBody = {
        reportsPageUrl,
        previousReportUrl,
        quarter,
        year,
        ...(includeMacro && fearAndGreedIndex && vixIndex
          ? {
              fearAndGreedIndex: fearAndGreedIndex,
              vixIndex: vixIndex,
            }
          : {}),
      };
      const { data } = await axios.post('/api/fetchReportInsights', requestBody);
      dispatch(setReportData(data));
    } catch (error) {
      if (error.response?.status === 408) {
        dispatch(setStatusCode(error.response.status));
      } else {
        console.error('Error fetching the report:', error);
      }
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const fetchMarketSentiment = async () => {
      try {
        const response = await axios.get('/api/fetchMarketSentiment');
        setVixIndex(response.data.vix);
        setFearAndGreedIndex(response.data.fearAndGreed);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    fetchMarketSentiment();
  }, []);

  const isStartScanningDisabled =
    !(
      isReportsPageUrlValid === true &&
      isPreviousUrlValid === true &&
      !isValidatingReportsPageUrl &&
      !isValidatingPreviousUrl &&
      reportsPageUrl &&
      previousReportUrl &&
      quarter &&
      year
    ) || isScanning;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center p-8 w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-semibold mb-4">Quarterly Performance Rating</h1>
            <p className="text-lg text-white-600 mb-6">
              An AI-powered analysis that evaluates a company&apos;s quarterly earnings, helping you
              make informed after-hours trading decisions.
            </p>
          </div>

          <div className="relative flex items-center bg-gradient-to-r from-[#0A0922] to-[#1D0F41] rounded-xl shadow-lg h-[160px] max-w-6xl overflow-hidden p-6">
            <div className="flex flex-col items-center space-y-2 w-auto max-w-[200px]">
              {companyDomain && (
                <>
                  <h2
                    className={`text-2xl font-bold text-white uppercase text-center ${companyDomain.replace('.com', '').length > 10 ? 'truncate max-w-[120px]' : ''}`}
                  >
                    {companyDomain.replace('.com', '')}
                  </h2>

                  <div className="flex items-center justify-center">
                    <CompanyLogo domain={companyDomain} />
                  </div>
                </>
              )}
            </div>

            {fearAndGreedIndex && vixIndex && (
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center space-y-3 text-white text-sm">
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">FGI</span>
                    <div
                      className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getFgiColor(fearAndGreedIndex.value)}`}
                    >
                      {fearAndGreedIndex.value}
                    </div>
                  </div>
                  <span className="mt-1 uppercase text-gray-300">
                    {fearAndGreedIndex.sentiment}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">VIX</span>
                    <div
                      className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getVixColor(vixIndex.value)}`}
                    >
                      {vixIndex.value}
                    </div>
                  </div>
                  <span className="mt-1 uppercase text-gray-300">{vixIndex.sentiment}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end justify-center w-40 ml-auto">
              {reportUrl && (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 truncate max-w-[200px]"
                >
                  View Report
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 w-full mt-6">
          <div className="flex flex-col w-full col-span-1">
            <div className="relative w-full mb-4">
              <input
                type="url"
                placeholder="Enter the investor relations page url"
                className={`p-3 pr-10 rounded-lg border ${
                  isReportsPageUrlValid === false ? 'border-red-500' : 'border-gray-300'
                } bg-[#150C34] w-full text-lg focus:outline-none focus:ring-2 ${
                  isReportsPageUrlValid === false
                    ? 'focus:ring-red-500 focus:border-red-500'
                    : 'focus:ring-purple-500 focus:border-purple-500'
                } transition-all`}
                value={reportsPageUrl}
                onChange={handleReportsPageUrlChange}
              />
              {isValidatingReportsPageUrl ? (
                <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
              ) : isReportsPageUrlValid === true ? (
                <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
              ) : isReportsPageUrlValid === false ? (
                <FaTimesCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              ) : null}
            </div>

            <div className="relative w-full mb-4">
              <input
                type="url"
                placeholder="Enter the previous quarterly report url"
                className={`p-3 pr-10 rounded-lg border ${
                  isPreviousUrlValid === false ? 'border-red-500' : 'border-gray-300'
                } bg-[#150C34] w-full text-lg focus:outline-none focus:ring-2 ${
                  isPreviousUrlValid === false
                    ? 'focus:ring-red-500 focus:border-red-500'
                    : 'focus:ring-purple-500 focus:border-purple-500'
                } transition-all`}
                value={previousReportUrl}
                onChange={handlePreviousReportUrlChange}
              />
              {isValidatingPreviousUrl ? (
                <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
              ) : isPreviousUrlValid === true ? (
                <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
              ) : isPreviousUrlValid === false ? (
                <FaTimesCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
              ) : null}
            </div>

            <div className="flex w-full justify-between mb-4">
              <select
                className="p-3 rounded-lg border border-gray-300 bg-[#150C34] text-white w-[48%] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                value={quarter}
                onChange={handleQuarterChange}
              >
                <option value="">Select Upcoming Quarter</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
              <select
                className="p-3 rounded-lg border border-gray-300 bg-[#150C34] text-white w-[48%] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                value={year}
                onChange={handleYearChange}
              >
                <option value="">Select Appropriate Year</option>
                {validYears.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {`20${yearOption}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full gap-4">
              <button
                className={`px-6 py-3 rounded-md text-white font-semibold flex-1 ${
                  isStartScanningDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:ring-4 focus:ring-purple-300'
                }`}
                onClick={handleStartScanning}
                disabled={isStartScanningDisabled}
              >
                {isScanning ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Scanning</span>
                    <FaSpinner className="animate-spin text-white w-5 h-5" />
                  </div>
                ) : (
                  'Start Scanning'
                )}
              </button>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="includeMacro"
                  checked={includeMacro}
                  onChange={(e) => setIncludeMacro(e.target.checked)}
                  className="mr-2 w-5 h-5 accent-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="includeMacro" className="text-gray-300 text-sm">
                  Include Market Sentiment (FGI & VIX)
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl flex justify-center items-center bg-gradient-to-r from-[#0A0922] to-[#1D0F41] overflow-hidden p-4">
            <RatingMeter score={rating} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full mt-8">
          <ReportSummary items={negatives} type="negative" />
          <ReportSummary items={positives} type="positive" />
        </div>

        <Alert rating={rating} statusCode={statusCode} />
      </div>
    </div>
  );
}
