// =================================================================
//              AI CRYPTO SCOUT - BACKEND SERVER
// =================================================================

// --- 1. Import necessary packages ---
const express = require('express');
const cors = require('cors'); // IMPORTANT: This package allows our frontend to connect

// --- 2. Initialize the Express app ---
const app = express();

// --- 3. Set up Middleware ---

// *** THE FIX IS HERE ***
// This line enables Cross-Origin Resource Sharing (CORS).
// It tells our server to accept requests from other websites (like codepen.io or our future app).
app.use(cors());

// This line allows our server to understand incoming JSON data from the request body.
app.use(express.json());


// --- 4. Define the API Endpoint ---
// We are creating a POST endpoint at the path /analyze-crypto
app.post('/analyze-crypto', (req, res) => {
    
    // Log the received data to the console on Render.com (for debugging)
    const coinName = req.body.coin_name;
    console.log(`Received request to analyze: ${coinName}`);
    
    // --- !!! YOUR AI LOGIC GOES HERE !!! ---
    // For now, we will send back the example data.
    // In the future, you will replace this with your actual AI analysis code.
    const analysisResult = {
        "Take Profit (TP) (USD)": "70000",
        "Stop Loss (SL) (USD)": "65000"
    };
    
    // Send the analysis result back to the frontend as JSON
    res.json(analysisResult);
});


// --- 5. Start the Server ---
// Render.com provides the PORT number in an environment variable.
// We use 10000 as a default if we are testing locally.
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Server is running successfully on port ${PORT}`);
});