const express = require('express');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

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

// Configure multer for file uploads with more permissive settings
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original extension
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

//Post to send 
app.post('/send', upload.single("image"),  async (req, res) => {
    const { message }  = req.body;
    const image = req.file;    
      try {
            const chatIds = TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());
            for (const chatId of chatIds) {
                if (!image) {
                    await axios.post(
                        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                        {
                            chat_id: chatId,
                            text: message
                        }
                    );
                }
                // Send selfie to Telegram with a caption if there is one
                if (image) {
                    console.log(image);
                    console.log("Image path:", image?.path);
                    const formData = new FormData();           
                    formData.append("chat_id", chatId); 
                    formData.append(
                        "photo",
                        fs.createReadStream(image.path),
                        {
                            filename: image.filename,
                            contentType: image.mimetype
                        }
                    );
                
                    await axios.post(
                        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
                        formData,
                        {
                            headers: formData.getHeaders()
                        }
                    );
                }
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
