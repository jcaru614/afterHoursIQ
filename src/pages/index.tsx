import { useState, useEffect, useMemo } from 'react';
import {
  RatingMeter,
  ReportSummary,
  Alert,
  Navbar,
  CompanyLogo,
  ValidatedUrlInput,
  DropdownSelect,
} from '@/components';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { useDispatch, useSelector } from 'react-redux';
import { FiLoader, FiExternalLink } from 'react-icons/fi';
import { setReportData, setStatusCode } from '@/redux/slice';
import { RootState } from '@/redux/store';
import { getFgiColor, getVixColor, extractDomain } from '@/utils/clientSide';

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

  const [macroSentiment, setMacroSentiment] = useState<{ fgi: any; vix: any } | null>(null);
  const [analystEstimates, setAnalystEstimates] = useState<any>(null);

  const [companyDomain, setCompanyDomain] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);

  const [tickerInput, setTickerInput] = useState('');
  const [isFetchingEstimates, setIsFetchingEstimates] = useState(false);

  const currentYear = new Date().getFullYear();
  const validYears = [currentYear - 1, currentYear, currentYear + 1].map((year) =>
    year.toString().slice(-2)
  );

  const { rating, positives, negatives, reportUrl, statusCode } = useSelector(
    (state: RootState) => state.slice
  );

  const validateUrl = async (
    url: string,
    setValid: (val: boolean | null) => void,
    setLoading: (val: boolean) => void
  ) => {
    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\//.test(trimmed)) {
      setValid(false);
      return;
    }

    setLoading(true);
    setValid(null);

    try {
      const res = await axios.get(`/api/validateReportUrl?url=${encodeURIComponent(trimmed)}`);
      setValid(res.status === 200 && res.data.valid === true);
    } catch (error: any) {
      setValid(false);
      dispatch(setStatusCode(error?.response?.status || 500));
    } finally {
      setLoading(false);
    }
  };

  const handleReportsPageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setReportsPageUrl(newUrl);

    if (!newUrl) {
      setIsReportsPageUrlValid(null);
      setCompanyDomain(null);
      return;
    }

    try {
      const domain = extractDomain(newUrl);
      setCompanyDomain(domain);
    } catch {
      setCompanyDomain(null);
    }

    validateUrl(newUrl, setIsReportsPageUrlValid, setIsValidatingReportsPageUrl);
  };

  const handlePreviousReportUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviousReportUrl(url);
    validateUrl(url, setIsPreviousUrlValid, setIsValidatingPreviousUrl);
  };

  const debouncedFetchEstimates = useMemo(
    () =>
      debounce(async (input: string) => {
        setIsFetchingEstimates(true);

        if (!input) {
          setTicker(null);
          setAnalystEstimates(null);
          setIsFetchingEstimates(false);
          return;
        }

        try {
          const res = await axios.get(`/api/fetchAnalystEstimates?ticker=${input}`);
          if (res.data?.analystEstimates?.upcomingQuarter) {
            setAnalystEstimates(res.data.analystEstimates);
            setTicker(input);
          } else {
            setAnalystEstimates(null);
            setTicker(null);
          }
        } catch (error: any) {
          setAnalystEstimates(null);
          setTicker(null);
          dispatch(setStatusCode(error?.response?.status || 500));
          console.error(
            'Error fetching analyst estimates:',
            error?.response?.data || error.message
          );
        } finally {
          setIsFetchingEstimates(false);
        }
      }, 800),
    []
  );

  const handleTickerChange = (input: string) => {
    const cleaned = input.trim().toUpperCase();
    setTickerInput(cleaned);
    debouncedFetchEstimates(cleaned);
  };

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuarter(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
  };

  const handleStartScanning = async () => {
    setIsScanning(true);

    const requestBody = {
      reportsPageUrl,
      previousReportUrl,
      quarter,
      year,
      ...(macroSentiment?.fgi &&
        macroSentiment?.vix && {
          fearAndGreedIndex: macroSentiment.fgi,
        }),
      ...(analystEstimates?.upcomingQuarter && {
        analystEstimates: analystEstimates.upcomingQuarter,
      }),
    };

    await axios
      .post('/api/fetchReportInsights', requestBody)
      .then(({ data }) => {
        dispatch(setReportData(data));
      })
      .catch((error: any) => {
        dispatch(setStatusCode(error?.response?.status || 500));
        console.error('Error fetching the report:', error);
      })
      .finally(() => {
        setIsScanning(false);
      });
  };

  useEffect(() => {
    const fetchMarketSentiment = async () => {
      try {
        const response = await axios.get('/api/fetchMarketSentiment');
        setMacroSentiment({
          fgi: response.data.fearAndGreed,
          vix: response.data.vix,
        });
      } catch (error) {
        dispatch(setStatusCode(error?.response?.status || 500));
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketSentiment();
  }, []);

  const isTickerValid =
    analystEstimates?.upcomingQuarter &&
    analystEstimates.upcomingQuarter.eps !== 'N/A' &&
    analystEstimates.upcomingQuarter.revenue !== 'N/A';

  const isStartScanningDisabled =
    !(
      isReportsPageUrlValid === true &&
      isPreviousUrlValid === true &&
      !isValidatingReportsPageUrl &&
      !isValidatingPreviousUrl &&
      isTickerValid &&
      reportsPageUrl &&
      previousReportUrl &&
      quarter &&
      year &&
      analystEstimates?.upcomingQuarter &&
      macroSentiment?.fgi &&
      macroSentiment?.vix
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

          <div className="relative flex items-center justify-between bg-gradient-to-r from-[#0A0922] to-[#1D0F41] rounded-xl shadow-lg h-[160px] w-full overflow-hidden p-6">
            <div className="flex flex-col items-center justify-center space-y-2 w-[200px]">
              <h2 className="text-2xl font-bold text-white uppercase text-center">
                {analystEstimates?.upcomingQuarter ? ticker : 'Ticker'}
              </h2>
              <CompanyLogo domain={companyDomain} />
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 text-white text-sm">
              <div className="flex flex-col items-center justify-between h-[50px]">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">EPS</span>
                  <div className="px-2.5 py-[6px] text-sm font-bold rounded-md shadow-md bg-[#31245C]">
                    {analystEstimates?.upcomingQuarter?.eps ?? '—'}
                  </div>
                </div>
                <span className="text-center uppercase text-gray-300 text-xs whitespace-nowrap">
                  Est. EPS
                </span>
              </div>

              <div className="flex flex-col items-center justify-between h-[50px]">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">Rev.</span>
                  <div className="px-2.5 py-[6px] text-sm font-bold rounded-md shadow-md bg-[#31245C]">
                    {analystEstimates?.upcomingQuarter?.revenue ?? '—'}
                  </div>
                </div>
                <span className="text-center uppercase text-gray-300 text-xs whitespace-nowrap">
                  Est. Revenue
                </span>
              </div>
            </div>

            {macroSentiment && (
              <div className="flex flex-col items-center justify-center text-white text-sm space-y-3 w-[200px]">
                <div className="flex flex-col items-center justify-between h-[50px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">FGI</span>
                    <div
                      className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getFgiColor(
                        macroSentiment.fgi.value
                      )}`}
                    >
                      {macroSentiment.fgi.value}
                    </div>
                  </div>
                  <span className="text-center uppercase text-gray-300 text-xs whitespace-nowrap">
                    {macroSentiment.fgi.sentiment}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-between h-[50px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">VIX</span>
                    <div
                      className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getVixColor(
                        macroSentiment.vix.value
                      )}`}
                    >
                      {macroSentiment.vix.value}
                    </div>
                  </div>
                  <span className="text-center uppercase text-gray-300 text-xs whitespace-nowrap">
                    {macroSentiment.vix.sentiment}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full mt-6">
          <div className="flex flex-col w-full col-span-1">
            <ValidatedUrlInput
              placeholder="Enter Ticker Symbol (e.g. AAPL)"
              value={tickerInput}
              onChange={(e) => handleTickerChange(e.target.value)}
              isValid={ticker ? isTickerValid : null}
              isLoading={isFetchingEstimates}
            />

            <ValidatedUrlInput
              placeholder="Enter the investor relations page url"
              value={reportsPageUrl}
              onChange={handleReportsPageUrlChange}
              isValid={isReportsPageUrlValid}
              isLoading={isValidatingReportsPageUrl}
            />

            <ValidatedUrlInput
              placeholder="Enter the previous quarterly report url"
              value={previousReportUrl}
              onChange={handlePreviousReportUrlChange}
              isValid={isPreviousUrlValid}
              isLoading={isValidatingPreviousUrl}
            />

            <div className="flex w-full justify-between mb-4 gap-x-4">
              <DropdownSelect
                value={quarter}
                onChange={handleQuarterChange}
                placeholder="Select Upcoming Quarter"
                options={[
                  { value: '1', label: 'Q1' },
                  { value: '2', label: 'Q2' },
                  { value: '3', label: 'Q3' },
                  { value: '4', label: 'Q4' },
                ]}
                className="w-[48%]"
              />

              <DropdownSelect
                value={year}
                onChange={handleYearChange}
                placeholder="Select Appropriate Year"
                options={validYears.map((y) => ({
                  value: y,
                  label: `20${y}`,
                }))}
                className="w-[48%]"
              />
            </div>

            <div className="flex w-full items-start gap-6">
              <button
                className={`px-6 py-3 rounded-md text-white font-semibold flex-1 transition-all duration-200 ${
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
                    <FiLoader className="animate-spin text-white w-5 h-5" />
                  </div>
                ) : (
                  'Start Scanning'
                )}
              </button>
            </div>
          </div>

          <div className="relative rounded-xl flex justify-center items-center bg-gradient-to-r from-[#0A0922] to-[#1D0F41] overflow-hidden p-4">
            {reportUrl && (
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-md shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
              >
                View Report
                <FiExternalLink className="w-4 h-4" />
              </a>
            )}
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
