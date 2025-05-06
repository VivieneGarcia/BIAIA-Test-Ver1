import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type Data = {
  reply: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;

      // Get the Gemini API key from the environment variable
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('GEMINI_API_KEY environment variable not set.');
        return res.status(500).json({ reply: 'API key not configured.' });
      }

      // Send the request to the Gemini API with the correct format
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Humanize this response: ${prompt}`,
                },
              ],
            },
          ],
          model: 'gemini-2.0-flash', // Ensure you’re using the correct model
          generation_config: { // Adjust these for more natural output
            temperature: 0.8, // Increase for more creative responses
            max_output_tokens: 200, // Allow the model to write more freely
          },
        }
      );

      // Log for debugging
      console.log('Gemini API Response:', response.data);

      // Extract the AI response
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return res.status(200).json({ reply });
      } else {
        console.error('No reply received from Gemini API:', response.data);
        return res.status(500).json({ reply: 'No response from the AI.' });
      }
    } catch (error: any) {
      console.error('Error contacting Gemini API:', error);
      return res.status(500).json({ reply: 'Sorry, something went wrong. Please try again later.' });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ reply: 'Method Not Allowed' });
}
