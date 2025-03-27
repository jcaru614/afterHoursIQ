import axios from 'axios';

export async function getChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log('[OpenAIRequest] Analyzing Prompts...', userPrompt);
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');
  return content;
}
