import axios from 'axios';

export const extractContentWithDiffbot = async (
  url: string,
  retries = 2,
  delay = 3000
): Promise<string | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get('https://api.diffbot.com/v3/article', {
        params: {
          token: process.env.DIFFBOT_API_KEY,
          url,
        },
        timeout: 30000,
      });

      return response.data.objects[0]?.text || null;
    } catch (error: any) {
      console.warn(`[Diffbot Retry ${attempt + 1}]`, error.message);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  return null;
};
