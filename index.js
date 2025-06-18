import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- Helper function to get live crypto data ---
async function getCryptoData(coinId) {
  try {
    const priceUrl = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
    const response = await axios.get(priceUrl, {
      headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }
    });
    return response.data[coinId];
  } catch (error) {
    console.error("Error fetching crypto data from CoinGecko:", error.message);
    throw new Error("Could not fetch live crypto data.");
  }
}

// --- Initialize Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest",
    // Ask Gemini to respond in a structured JSON format
    generationConfig: { response_mime_type: "application/json" }
});

// --- NEW Crypto Analysis Endpoint ---
app.post('/analyze-crypto', async (req, res) => {
  try {
    const { coin_id } = req.body; // e.g., "bitcoin", "ethereum"
    if (!coin_id) {
      return res.status(400).json({ error: 'coin_id is required' });
    }

    console.log(`Analyzing coin: ${coin_id}`);
    
    // 1. Get live data
    const liveData = await getCryptoData(coin_id);
    if (!liveData) {
        return res.status(404).json({ error: `Could not find data for coin: ${coin_id}` });
    }

    // 2. Create a detailed prompt for Gemini
    const prompt = `
      You are an expert crypto market analyst. 
      Given the following live market data for ${coin_id}, provide a detailed analysis.
      
      Current Data:
      - Current Price (USD): ${liveData.usd}
      - 24h Trading Volume (USD): ${liveData.usd_24h_vol}
      - 24h Price Change (%): ${liveData.usd_24h_change.toFixed(2)}%

      Your task is to provide a trading recommendation. Follow this structure exactly:
      1.  **Analysis Breakdown**: A short paragraph explaining the current market sentiment based on the data.
      2.  **Recommendation**: State CLEARLY one of three options: "BUY", "SELL", or "WAIT".
      3.  **Entry Price (USD)**: Suggest a good entry price. If recommendation is WAIT or SELL, this can be a future target.
      4.  **Take Profit (TP) (USD)**: Suggest a realistic take-profit level.
      5.  **Stop Loss (SL) (USD)**: Suggest a realistic stop-loss level to manage risk.

      VERY IMPORTANT: Do not include any introductory or concluding sentences. Respond only with the structured analysis.
    `;

    // 3. Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // The response text will be a JSON string, so we parse it
    const analysisResult = JSON.parse(response.text());

    res.json(analysisResult);

  } catch (error) {
    console.error("Error in /analyze-crypto endpoint:", error);
    res.status(500).json({ error: 'Failed to generate crypto analysis.' });
  }
});

// Root endpoint to check server status
app.get('/', (req, res) => {
  res.send('AI Crypto Assistant Backend is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});