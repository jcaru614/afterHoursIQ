import { useState, useRef, useEffect } from 'react';
import { RatingMeter, ReportSummary, Alert, Navbar, BrandLogo } from '@/components';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCompanyDomain, setReportData, setStatusCode } from '@/redux/slice';
import { RootState } from '@/redux/store';
import { getFgiColor, getVixColor } from '@/utils/clientSide';

export default function Home() {
  const dispatch = useDispatch();

  const [reportsPageUrl, setReportsPageUrl] = useState<string>('');
  const [previousReportUrl, setPreviousReportUrl] = useState<string>('');
  const [quarter, setQuarter] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();
  const validYears = [currentYear - 1, currentYear, currentYear + 1].map((year) =>
    year.toString().slice(-2)
  );

  const [fgiData, setFgiData] = useState<any>(null);
  const [vixData, setVixData] = useState<any>(null);

  const { rating, positives, negatives, reportUrl, statusCode, companyDomain } = useSelector(
    (state: RootState) => state.slice
  );

  const fetchMarketData = async () => {
    try {
      const response = await axios.get('/api/fetchMarketData');
      console.log('Response received:', response.data);
      setVixData(response.data.vix);
      setFgiData(response.data.fearAndGreed);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handlePreviousReportUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPreviousReportUrl(newUrl);
    if (!newUrl) {
      dispatch(setCompanyDomain(null));
      return;
    }
    fetchCompanyOverview(newUrl);
  };

  const fetchCompanyOverview = async (url: string) => {
    if (!url.trim()) return;
    try {
      const { data } = await axios.get(`/api/fetchCompanyLogo?url=${url}`);
      console.log('Data fetched:', data);

      if (data) {
        dispatch(setCompanyDomain(data.domain));
      }
    } catch (error) {
      console.error('Error fetching company overview:', error.response?.data || error.message);
    }
  };

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setQuarter(value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setYear(value);
  };

  const handleStartScanning = async () => {
    setIsScanning(true);
    try {
      const { data } = await axios.post('/api/fetchReport', {
        reportsPageUrl,
        previousReportUrl,
        quarter,
        year,
      });

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

                  <div className="flex items-center justify-center w-16 h-16">
                    <BrandLogo domain={companyDomain} />
                  </div>
                </>
              )}
            </div>

            {fgiData && vixData && (
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg text-white">F&G</span>
                  <div
                    className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getFgiColor(fgiData.value)}`}
                  >
                    {fgiData.value}
                  </div>
                </div>
                <span className="text-sm">{fgiData.sentiment}</span>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg text-white">VIX</span>
                  <div
                    className={`px-2 py-1 text-sm font-bold rounded-md shadow-md ${getVixColor(vixData.value)}}`}
                  >
                    {vixData.value}
                  </div>
                </div>
                <span className="text-sm">{vixData.sentiment}</span>
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
            <input
              type="url"
              placeholder="Enter the investor relations page url"
              className="p-3 rounded-lg border border-gray-300 bg-[#150C34] w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={reportsPageUrl}
              onChange={(e) => setReportsPageUrl(e.target.value)}
            />
            <input
              type="url"
              placeholder="Enter the previous quarterly report url"
              className="p-3 rounded-lg border border-gray-300 bg-[#150C34] w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={previousReportUrl}
              onChange={handlePreviousReportUrlChange}
            />
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
                className={`px-6 py-3 rounded-md text-white font-semibold flex-1 ${isScanning || !previousReportUrl || !reportsPageUrl || !quarter || !year ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:ring-4 focus:ring-purple-300'}`}
                onClick={handleStartScanning}
                disabled={isScanning || !previousReportUrl || !reportsPageUrl || !quarter || !year}
              >
                {isScanning ? 'Scanning...' : 'Start Scanning'}
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center">
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
