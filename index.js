import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- FINAL ATTEMPT Helper function for COINCAP with User-Agent ---
async function getCryptoData(coinId) {
  try {
    const url = `https://api.coincap.io/v2/assets/${coinId.toLowerCase()}`;
    console.log(`Final Attempt: Fetching from CoinCap URL: ${url}`);
    
    // Add a standard User-Agent header to the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinCap API Error: Status ${response.status}, Body: ${errorBody}`);
      throw new Error(`Failed to fetch data from CoinCap. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.data) {
      throw new Error(`Invalid data structure received from CoinCap for coinId: ${coinId}`);
    }

    // Reformat the data
    return {
      usd: parseFloat(data.data.priceUsd).toFixed(2),
      usd_24h_vol: parseFloat(data.data.volumeUsd24Hr).toFixed(2),
      usd_24h_change: parseFloat(data.data.changePercent24Hr).toFixed(2)
    };
  } catch (error) {
    console.error("Error in getCryptoData function:", error.message);
    throw new Error("Could not fetch live crypto data from CoinCap.");
  }
}

// --- Initialize Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: { response_mime_type: "application/json" }
});

// --- Crypto Analysis Endpoint ---
app.post('/analyze-crypto', async (req, res) => {
  try {
    const { coin_id } = req.body;
    if (!coin_id) {
      return res.status(400).json({ error: 'coin_id is required' });
    }

    console.log(`Analyzing coin with CoinCap: ${coin_id}`);
    
    const liveData = await getCryptoData(coin_id);

    const prompt = `
      You are an expert crypto market analyst. 
      Given the following live market data for ${coin_id}, provide a detailed analysis.
      
      Current Data:
      - Current Price (USD): ${liveData.usd}
      - 24h Trading Volume (USD): ${liveData.usd_24h_vol}
      - 24h Price Change (%): ${liveData.usd_24h_change}%

      Your task is to provide a trading recommendation. Follow this structure exactly:
      1.  **Analysis Breakdown**: A short paragraph explaining the current market sentiment based on the data.
      2.  **Recommendation**: State CLEARLY one of three options: "BUY", "SELL", or "WAIT".
      3.  **Entry Price (USD)**: Suggest a good entry price. If recommendation is WAIT or SELL, this can be a future target.
      4.  **Take Profit (TP) (USD)**: Suggest a realistic take-profit level.
      5.  **Stop Loss (SL) (USD)**: Suggest a realistic stop-loss level to manage risk.

      VERY IMPORTANT: Do not include any introductory or concluding sentences. Respond only with the structured analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const analysisResult = JSON.parse(response.text());

    res.json(analysisResult);

  } catch (error) {
    console.error("Error in /analyze-crypto endpoint:", error);
    res.status(500).json({ error: 'Failed to generate crypto analysis.' });
  }
});

app.get('/', (req, res) => {
  res.send('AI Crypto Assistant Backend is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});