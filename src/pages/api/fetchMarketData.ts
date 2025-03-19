import axios from 'axios';

function getVixSentiment(vixValue) {
  if (vixValue < 12) return 'extreme Low volatility';
  if (vixValue < 20) return 'low volatility';
  if (vixValue < 30) return 'normal volatility';
  if (vixValue < 40) return 'high volatility';
  return 'extreme volatility';
}

export default async function handler(req, res) {
  try {
    const axiosInstance = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
      },
    });

    const [fgiResponse, vixResponse] = await Promise.all([
      axiosInstance.get('https://production.dataviz.cnn.io/index/fearandgreed/graphdata'),
      axiosInstance.get('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX'),
    ]);

    const fearAndGreed = {
      value: fgiResponse.data.fear_and_greed.score.toFixed(1),
      sentiment: fgiResponse.data.fear_and_greed.rating,
    };

    const vixValue = parseFloat(vixResponse.data.chart.result[0].meta.regularMarketPrice).toFixed(
      1
    );
    const vix = {
      value: vixValue,
      sentiment: getVixSentiment(parseFloat(vixValue)),
    };

    res.status(200).json({
      fearAndGreed,
      vix,
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
    });
  }
}
