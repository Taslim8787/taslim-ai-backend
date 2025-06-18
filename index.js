import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

const app = express();
// Render provides the PORT environment variable
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Check for API Key at startup
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1); // Exit the process with an error code
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Define the API endpoint
app.post('/generate', async (req, res) => {
  try {
    // We expect the key to be "message" based on your screenshot
    const { message } = req.body;

    // Check if the 'message' key exists and is not empty
    if (!message) {
      console.log("Request failed: 'message' key is missing from the request body.");
      return res.status(400).json({ error: 'The "message" key is required in the JSON body.' });
    }

    console.log("Received message:", message);

    // Call the Gemini API
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    // Send the response back to the client
    res.json({ response: text });

  } catch (error) {
    console.error("Error in /generate endpoint:", error);
    res.status(500).json({ error: 'Something went wrong with AI generation.' });
  }
});

// A simple root endpoint to check if the server is running
app.get('/', (req, res) => {
  res.send('AI Backend is running!');
});

// Start the server, listening on all available network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});