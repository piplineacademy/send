const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


// MIDDLEWARE - Fix for CORS and JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'index.html')));

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS;

//Post to send 
app.post('/send', async (req, res) => {
    const { message }  = req.body;
      try {
            const chatIds = TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());
                for (const chatId of chatIds) {
                await axios.post(
                    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                        chat_id: chatId,
                        text: message
                    }
                );
            }
                res.json({ success: true });
    
        } catch (error) {
            console.error(error.response?.data || error.message);
            res.status(500).json({ success: false });
        }
});





app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at ${PORT}`);
});
