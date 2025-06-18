import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- The data fetching function is now REMOVED. ---
// The client will provide the data.

// --- Initialize Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: { response_mime_type: "application/json" }
});

// --- NEW SIMPLER Crypto Analysis Endpoint ---
app.post('/analyze-crypto', async (req, res) => {
  try {
    // We now expect the client to send the coin name AND the live data
    const { coin_name, live_data } = req.body; 
    
    if (!coin_name || !live_data) {
      return res.status(400).json({ error: 'coin_name and live_data are required' });
    }
    if (!live_data.usd || !live_data.usd_24h_vol || !live_data.usd_24h_change) {
        return res.status(400).json({ error: 'live_data must include usd, usd_24h_vol, and usd_24h_change' });
    }

    console.log(`Received data for analysis: ${coin_name}`);
    
    // Create the detailed prompt for Gemini using the data we received
    const prompt = `
      You are an expert crypto market analyst. 
      Given the following live market data for ${coin_name}, provide a detailed analysis.
      
      Current Data:
      - Current Price (USD): ${live_data.usd}
      - 24h Trading Volume (USD): ${live_data.usd_24h_vol}
      - 24h Price Change (%): ${live_data.usd_24h_change}%

      Your task is to provide a trading recommendation. Follow this structure exactly:
      1.  **Analysis Breakdown**: A short paragraph explaining the current market sentiment based on the data.
      2.  **Recommendation**: State CLEARLY one of three options: "BUY", "SELL", or "WAIT".
      3.  **Entry Price (USD)**: Suggest a good entry price. If recommendation is WAIT or SELL, this can be a future target.
      4.  **Take Profit (TP) (USD)**: Suggest a realistic take-profit level.
      5.  **Stop Loss (SL) (USD)**: Suggest a realistic stop-loss level to manage risk.

      VERY IMPORTANT: Do not include any introductory or concluding sentences. Respond only with the structured analysis.
    `;

    // Call Gemini API
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