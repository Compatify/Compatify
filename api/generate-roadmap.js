// This file will contain the serverless function.
// It will be placed in a new directory named `api` at the root of your project.

// We need to import the `node-fetch` library to make web requests.
// Serverless platforms like Vercel or Netlify will handle this for you.
const fetch = require('node-fetch');

// This function will be the entry point for your serverless function.
// It takes a request object (req) and a response object (res) as arguments.
module.exports = async (req, res) => {
    // SECURITY STEP 1: Get the API key from a secure environment variable.
    // This key is NOT stored in your code. You will set this up later on your hosting service.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Check if the API key is missing. If so, return an error.
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Check if the request is a POST request, which we expect from our frontend.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Parse the JSON data sent from the frontend.
        const { prompt } = req.body;

        // Ensure the prompt is present.
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is missing in the request body.' });
        }

        // SECURITY STEP 2: Make the call to the Gemini API here, on the server.
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "stepName": { "type": "STRING" },
                            "explanation": { "type": "STRING" },
                            "products": { "type": "ARRAY", "items": { "type": "STRING" } }
                        },
                        "propertyOrdering": ["stepName", "explanation", "products"]
                    }
                }
            }
        };

        // This is the actual API call. The key is used here and is never sent to the browser.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await geminiResponse.json();

        // Check if the API call was successful.
        if (geminiResponse.ok && result.candidates && result.candidates.length > 0) {
            const rawJsonText = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(rawJsonText);
            // Send the response back to the frontend.
            res.status(200).json(parsedJson);
        } else {
            console.error('Gemini API response error:', result);
            res.status(500).json({ error: 'Failed to get a valid response from the API.' });
        }

    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({ error: 'An unexpected error occurred on the server.' });
    }
};
