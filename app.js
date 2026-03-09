// MirrorMind System Scripts

// 1. Update Clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeElement = document.getElementById('system-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

setInterval(updateClock, 1000);
updateClock();

// 1.5 Initialize Camera Feed & Face Detection
async function initCamera() {
    try {
        const videoElement = document.getElementById('camera-feed');
        if (!videoElement) return;

        // Load face-api models
        console.log("Loading face detection models...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log("Models loaded.");

        // Ensure we only request what we need. 
        // We only need video. No audio needed for the mirror interface.
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user" // Prefer front-facing camera for a mirror
            },
            audio: false
        });

        videoElement.srcObject = stream;
        console.log("Camera initialized successfully.");

        // Start emotion detection when video plays
        videoElement.addEventListener('play', () => {
            // Function to run detection continuously without blocking the main thread
            const detectFaces = async () => {
                if (videoElement.paused || videoElement.ended) return;

                // Use lower inputSize (160 instead of default 416) for much faster inference
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
                const detections = await faceapi.detectSingleFace(videoElement, options).withFaceExpressions();

                if (detections) {
                    processEmotions(detections.expressions);
                } else {
                    updateMoodUI("Analyzing...", "Detecting Face", 50, "fa-eye");
                }

                // Call itself again after a short delay (e.g., 200ms) to prevent UI locking
                setTimeout(detectFaces, 200);
            };

            detectFaces(); // Kick off the loop
        });

    } catch (err) {
        console.error("Error accessing camera or loading models: ", err);
        // Handle error visually if needed
        const videoContainer = document.querySelector('.bg-charcoal');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center text-red-500 opacity-60">
                    <i class="fa-solid fa-video-slash text-4xl mb-4"></i>
                    <p class="text-sm font-mono">CAMERA ACCESS DENIED OR UNAVAILABLE / MODELS FAILED</p>
                </div>
            `;
        }
    }
}

// Function to map face-api expressions to MirrorMind UI states
function processEmotions(expressions) {
    // expressions object: { neutral, happy, sad, angry, fearful, disgusted, surprised }
    // Let's find the dominant emotion
    let dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
    let confidence = expressions[dominantEmotion];

    if (confidence < 0.5) return; // Ignore weak signals

    let moodTitle = "Focused";
    let moodSubtitle = "Flow State Active";
    let focusScore = 94; // Default baseline
    let iconClass = "fa-bolt";

    switch (dominantEmotion) {
        case "happy":
            moodTitle = "Engaged";
            moodSubtitle = "Positive Resonance";
            focusScore = Math.floor(85 + (confidence * 10)); // 85-95
            iconClass = "fa-face-smile";
            break;
        case "sad":
            moodTitle = "Fatigued";
            moodSubtitle = "Energy Depletion Detected";
            focusScore = Math.floor(40 + (confidence * 20)); // 40-60
            iconClass = "fa-battery-quarter";
            break;
        case "angry":
        case "fearful":
        case "disgusted":
            moodTitle = "Stressed";
            moodSubtitle = "Cognitive Load High";
            focusScore = Math.floor(30 + (confidence * 20)); // 30-50
            iconClass = "fa-wind";
            break;
        case "surprised":
            moodTitle = "Alert";
            moodSubtitle = "Processing New Stimulus";
            focusScore = Math.floor(70 + (confidence * 15)); // 70-85
            iconClass = "fa-lightbulb";
            break;
        default: // neutral
            moodTitle = "Focused";
            moodSubtitle = "Flow State Active";
            focusScore = Math.floor(90 + (confidence * 8)); // 90-98
            iconClass = "fa-bolt";
            break;
    }

    // Update global state for UI memory
    window.currentMirrorState = {
        mood: moodTitle,
        details: moodSubtitle,
        score: focusScore
    };

    updateMoodUI(moodTitle, moodSubtitle, focusScore, iconClass);

    // Sync state with backend for VS Code Extension bridging
    fetch('http://localhost:3000/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mood: moodTitle,
            details: moodSubtitle,
            focusScore: focusScore
        })
    }).catch(err => console.error("Failed to sync state to backend:", err));
}

function updateMoodUI(title, subtitle, score, iconClass) {
    // The main mood text block
    const moodContainer = document.querySelector('.text-4xl.font-display.font-light.mb-1.text-white');
    if (moodContainer) moodContainer.textContent = title;

    // The subtitle text and icon
    const subtitleContainer = document.querySelector('.text-neoncyan.text-sm.flex.items-center.gap-2');
    if (subtitleContainer) {
        subtitleContainer.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${subtitle}`;
    }

    // The dial percentage
    const percentageContainer = document.querySelector('.font-display.text-xs.font-bold.text-neoncyan');
    if (percentageContainer) percentageContainer.textContent = score + '%';
}

// Start camera on page load
document.addEventListener('DOMContentLoaded', initCamera);

// 2. Initialize Chart.js for Mood History
document.addEventListener("DOMContentLoaded", function () {
    const chartElement = document.getElementById('moodChart');
    if (!chartElement) return;

    const ctx = chartElement.getContext('2d');

    // Gradient for the line area
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

    const data = {
        labels: ['-60m', '-50m', '-40m', '-30m', '-20m', '-10m', 'Now'],
        datasets: [{
            label: 'Focus Level',
            data: [65, 70, 68, 85, 90, 92, 94],
            borderColor: '#00f0ff',
            borderWidth: 2,
            backgroundColor: gradient,
            pointBackgroundColor: '#151a24',
            pointBorderColor: '#00f0ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4 // Smooth bezier curves
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide legend for cleaner look
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 26, 36, 0.8)',
                    titleFont: { family: 'Outfit', size: 12 },
                    bodyFont: { family: 'Inter', size: 14 },
                    padding: 10,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + '% Focus';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.3)',
                        font: { family: 'Inter', size: 10 }
                    }
                },
                y: {
                    min: 40,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderDash: [5, 5],
                        drawBorder: false,
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.3)',
                        font: { family: 'Inter', size: 10 },
                        stepSize: 20
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    };

    new Chart(ctx, config);
});

// 3. Chatbot Logic
const BACKEND_URL = 'http://localhost:3000';

function toggleChat() {
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface) {
        chatInterface.classList.toggle('hidden');
        if (!chatInterface.classList.contains('hidden')) {
            document.getElementById('chat-input').focus();
        }
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const inputEl = document.getElementById('chat-input');
    const message = inputEl.value.trim();
    if (!message) return;

    // Clear input
    inputEl.value = '';

    // Append user message
    appendMessage(message, 'user');

    // Simulate thinking state briefly
    const typingId = appendMessage('...', 'system');

    try {
        const currentState = window.currentMirrorState || { mood: 'Focused', details: 'Flow State Active', score: 94 };

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                context: {
                    mood: `${currentState.mood} - ${currentState.details}`,
                    focusScore: currentState.score
                }
            })
        });

        const data = await response.json();

        // Remove typing indicator
        document.getElementById(typingId)?.remove();

        if (data.reply) {
            appendMessage(data.reply, 'system');
        } else {
            appendMessage("Error: Could not parse response.", 'system');
        }

    } catch (error) {
        console.error("Chat Error:", error);
        document.getElementById(typingId)?.remove();
        appendMessage("System offline. Cannot connect to cognitive reasoning engine.", 'system');
    }
}

function appendMessage(text, sender) {
    const messageContainer = document.getElementById('chat-messages');
    if (!messageContainer) return null;

    const div = document.createElement('div');
    const msgId = 'msg-' + Date.now();
    div.id = msgId;

    if (sender === 'user') {
        div.className = 'self-end bg-neoncyan/10 border border-neoncyan/20 p-3 rounded-xl rounded-tr-sm max-w-[85%] text-white';
    } else {
        div.className = 'self-start bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-sm max-w-[85%] text-gray-300';
    }

    div.textContent = text;
    messageContainer.appendChild(div);

    // Auto scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;

    return msgId;
}

// 4. Email Analytics Logic
async function sendEmailStats() {
    const email = prompt("Enter destination email address:");
    if (!email) return;

    try {
        const currentState = window.currentMirrorState || { mood: 'Focused', details: 'Flow State Active', score: 94 };

        const response = await fetch(`${BACKEND_URL}/api/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toEmail: email,
                stats: {
                    mood: `${currentState.mood} - ${currentState.details}`,
                    focusScore: `${currentState.score}%`,
                    duration: 'Session Active'
                }
            })
        });

        const data = await response.json();
        if (data.success) {
            alert("Analytics report dispatched successfully via MirrorMind Relay.");
        } else {
            alert("Failed to dispatch report: " + data.error);
        }
    } catch (error) {
        console.error("Email Error:", error);
        alert("Connection established failed. Check backend server.");
    }
}
