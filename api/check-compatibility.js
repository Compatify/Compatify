// api/check-compatibility.js

// This is a Vercel serverless function, which acts as a secure proxy for your API calls.
// It's the only place your Gemini API key should ever exist, keeping it safe from the public.

const fetch = require('node-fetch'); // Use node-fetch for making server-side requests

module.exports = async (req, res) => {
    // A try-catch block is essential for handling errors gracefully.
    try {
        // Only allow POST requests for this function.
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        // The API key is securely accessed from Vercel's environment variables.
        // This key is never exposed to the public.
        const apiKey = process.env.GEMINI_API_KEY;

        // Ensure the API key is present. If not, something is wrong with the Vercel setup.
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key is not configured.' });
        }

        // Extract the user's prompt from the request body.
        const { device1, device2 } = req.body;

        // A simple validation to ensure we have the necessary data from the client.
        if (!device1 || !device2) {
            return res.status(400).json({ error: 'Missing device information in request body.' });
        }

        // Construct a prompt for the Gemini API based on the user's input.
        const prompt = `Compare the compatibility of ${device1} with ${device2}. Provide a detailed analysis, including potential issues, required adapters, and a final verdict on compatibility. Format the output as a clean, easy-to-read text response.`;

        // The URL for the Gemini API. We're using the generateContent endpoint.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Prepare the payload for the API call.
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        };

        // Make the secure fetch call to the Gemini API.
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Parse the JSON response from the Gemini API.
        const result = await response.json();

        // Check for a valid response structure and extract the generated text.
        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            // Send the generated text back to the client as a successful response.
            res.status(200).json({ success: true, analysis: generatedText });
        } else {
            // Handle cases where the API response is not what we expect.
            res.status(500).json({ success: false, error: 'Failed to generate compatibility analysis from API.' });
        }
    } catch (error) {
        // Log the error on the server for debugging.
        console.error('API Error:', error);
        // Send a generic error message to the client.
        res.status(500).json({ success: false, error: 'An internal server error occurred.' });
    }
};


