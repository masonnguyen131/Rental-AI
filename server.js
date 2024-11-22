const express = require('express');
const axios = require('axios');
const path = require('path');
const { OpenAI } = require("openai");
const { queryProperties } = require('./public/query');

//const houseFunc = require('./public/script')

//houseFunc.getHouses()

require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
})



// Serve static files (like the HTML file)
app.use(express.static(path.join('public')));

// Chatbot Endpoint
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {

        //TODO: Dynamic k extraction from the user query
        const results = await queryProperties(userMessage, 5); // Top k results


        if (results.length === 0) {
            return res.json({ reply: "Sorry, I couldn't find any matching properties." });
        }

        const property = results[0];

        // Extract relevant property details
        const properties = results.map((result) => ({
            id: result.metadata.id,
            address: result.pageContent.split('. ')[0], // Extract the address
            price: result.metadata.price || "Price not available", // Include price,
            description: result.pageContent,
            latitude: result.metadata.latitude,
            longitude: result.metadata.longitude,
            bedrooms: result.metadata.bedrooms || "N/A", // Include bedrooms
        }));

        const fewShotExamples = `
            Example 1:
            User: Show me the 5 best houses in Los Angeles.
            Assistant: Sure! Here are some of the best options I found:
            The first property is located at 832 N Orange Grove Ave, Los Angeles, CA 90046. It's a stunning house with 5 bedrooms and 6 bathrooms, available for $19,995 per month.

            Another great option is 16564 Park Lane Cir, Los Angeles, CA 90049, a beautiful 5-bedroom, 4-bathroom home listed at $14,950 per month.

            If you're looking for something smaller, there's a modern apartment at 1234 Wilshire Blvd, Apt 316, Los Angeles, CA 90017, with 2 bedrooms and 2 bathrooms for $5,000 monthly.

            We also have a cozy 2-bedroom, 1.5-bathroom unit at 11153 Morrison Home St, Unit Middle, Los Angeles, CA 91601, renting for $5,000 per month.

            Lastly, there's a luxurious property at 346 N Kings Rd, Los Angeles, CA 90048, featuring 6 bedrooms and 6 bathrooms, available for $19,950 monthly.

            Let me know if you'd like to learn more about any of these properties or if you're looking for something different!
            `;

        const prompt = `
            ${fewShotExamples}
            
            User: ${userMessage}
            Assistant: Sure! Here are some of the best options I found:
            ${properties
                .map(
                    (p, index) =>
                        `The ${index + 1 === 1 ? "first" : `next`} property is located at ${p.address}. It's a ${p.bedrooms || 'N/A'
                        }-bedroom, ${p.bathrooms || 'N/A'}-bathroom home, available for $${p.price || 'N/A'
                        } per month.
            
                  ${p.description ? p.description.trim() : 'No additional details are available at this time.'}`
                )
                .join('\n\n')}
            
            Let me know if you'd like more information on any of these properties or if you have other preferences!
            `;




        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', //3.5 for testing
            messages: [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": `
                  content: "You are an assistant that helps tenants find rental houses. Use the tone and structure shown in the example provided ${fewShotExamples}"
                `
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        });


        const botReply = response.choices[0].message;
        console.log("bot reply", botReply)
        // Remove unnecessary newline characters (if rendering plain text)
        const formattedReply = botReply.content.replace(/\\n/g, '\n');


        // Send a clean reply to the frontend
        res.json({ reply: formattedReply, properties });
        //res.json({ reply: botReply, properties });
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});


app.post('/api/openai', async (req, res) => {
    try {

        console.log('Request body:', req.body)
        messages = req.body
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid or missing "messages" parameter' });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": `
                      You are a helpful assistant that answers programming questions 
                      in the style of a southern belle from the southeast United States.
                    `
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Are semicolons optional in JavaScript?"
                        }
                    ]
                }
            ]
        });

        console.log(response)
        /*
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages
        })
        //console.log(response.choices[0].message.content)
        */
        //res.json(response.choices[0].message.content)


    } catch (err) {
        console.log('Error:', err)
        res.status(500).json({ error: 'Unable to access OpenAI API' });
    }
});

// Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});