require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Google Gemini SDK
const ai = new GoogleGenAI({
    // It automatically picks up GEMINI_API_KEY from environment 
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*' // In a real app, restrict this
}));
app.use(express.json());

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Global Variable to store user's current cognitive state
let currentUserState = {
    mood: "Focused",
    details: "Flow State Active",
    focusScore: 94,
    lastUpdate: Date.now()
};

// --- API Endpoints ---

// 0. State synchronization endpoints
app.post('/api/state', (req, res) => {
    const { mood, details, focusScore } = req.body;
    currentUserState = { mood, details, focusScore, lastUpdate: Date.now() };
    res.json({ success: true, state: currentUserState });
});

app.get('/api/state', (req, res) => {
    res.json(currentUserState);
});

// 1. Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const systemPrompt = "You are MirrorMind, a supportive, futuristic AI OS companion. You speak concisely and analytically, but warmly. The user is currently in a " + (context?.mood || "focused") + " state.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemPrompt}\n\nUser: ${message}\nMirrorMind:`,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Failed to communicate with AI service." });
    }
});

// 2. Email Endpoint
app.post('/api/email', async (req, res) => {
    try {
        const { toEmail, stats } = req.body;

        if (!toEmail) {
            return res.status(400).json({ error: "Destination email is required" });
        }

        const statsHtml = `
            <h2>MirrorMind Session Analytics</h2>
            <p>Here are your cognitive and emotional statistics for this session:</p>
            <ul>
                <li><strong>Current State:</strong> ${stats?.mood || 'Focused'}</li>
                <li><strong>Focus Score:</strong> ${stats?.focusScore || '94%'}</li>
                <li><strong>Session Duration:</strong> ${stats?.duration || '114 minutes'}</li>
            </ul>
            <p><em>Maintain the flow. — MirrorMind OS</em></p>
        `;

        const info = await transporter.sendMail({
            from: `"MirrorMind OS" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Your Cognitive Analytics Report",
            html: statsHtml,
        });

        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ error: "Failed to send email." });
    }
});

const puppeteer = require('puppeteer');

// --- Start Server & Hidden Camera Browser ---
app.listen(port, async () => {
    console.log(`MirrorMind backend running on port ${port}`);

    try {
        console.log("Launching Hidden Camera Process (Option B)...");
        // Launch a hidden Chrome/Edge browser using the system executable.
        // We set headless: new to hide it, but must pass args to auto-grant camera.
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', // Fallback to system Edge on Windows
            headless: 'new', // Use the new headless mode
            args: [
                '--use-fake-ui-for-media-stream', // Auto-grants camera permission
                '--autoplay-policy=no-user-gesture-required', // Allow video to play immediately
            ]
        });

        const page = await browser.newPage();

        // We assume the frontend is still being served on localhost:8080 by http-server
        console.log("Connecting hidden browser to MirrorMind camera node... waiting for http-server to boot");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for port 8080 to be ready
        await page.goto('http://localhost:8080/index.html');

        console.log("Hidden Camera activated successfully. MirrorMind is observing.");

    } catch (err) {
        console.error("Failed to launch hidden camera node:", err);
    }
});
