import * as vscode from 'vscode';
import fetch from 'node-fetch'; // Requires node-fetch@2

let statusBarItem: vscode.StatusBarItem;
let pollInterval: NodeJS.Timeout | undefined;

const BACKEND_URL = 'http://localhost:3000/api/state';

export function activate(context: vscode.ExtensionContext) {
    console.log('MirrorMind extension is now active!');

    // 1. Create Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'mirrormind.start';
    context.subscriptions.push(statusBarItem);

    // Initial state
    updateStatusBar("Connecting...", "fa-eye");
    statusBarItem.show();

    // Start polling the backend state
    startPolling();

    // 2. Register Webview Provider
    const provider = new MirrorMindWebviewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('mirrormind.webview', provider)
    );

    // Register Command
    let disposable = vscode.commands.registerCommand('mirrormind.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.mirrormind-sidebar');
    });

    context.subscriptions.push(disposable);
}

function startPolling() {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(BACKEND_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            const state: any = await response.json();

            // e.g. state = { mood: "Focused", focusScore: 94 }
            let icon = "$(zap)";
            if (state.mood === "Engaged") icon = "$(smiley)";
            if (state.mood === "Fatigued") icon = "$(battery-0)";
            if (state.mood === "Stressed") icon = "$(flame)";

            updateStatusBar(`${icon} ${state.mood} (${state.focusScore}%)`, state.details);

        } catch (error) {
            updateStatusBar("$(disconnected) MirrorMind Offline", "Ensure server.js is running");
        }
    }, 2000); // Poll every 2 seconds
}

function updateStatusBar(text: string, tooltip: string) {
    statusBarItem.text = text;
    statusBarItem.tooltip = tooltip;
}

export function deactivate() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
}

// Webview Provider Class
class MirrorMindWebviewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MirrorMind</title>
                <!-- Fonts -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@200;300;400;500;700&display=swap" rel="stylesheet">
                <!-- Icons -->
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <!-- Tailwind JS -->
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    tailwind.config = {
                        theme: {
                            extend: {
                                fontFamily: {
                                    sans: ['Inter', 'sans-serif'],
                                    display: ['Outfit', 'sans-serif'],
                                },
                                colors: {
                                    obsidian: '#0b0d17',
                                    charcoal: '#151a24',
                                    neoncyan: '#00f0ff',
                                    neonpurple: '#bd00ff',
                                    neonamber: '#ffb800',
                                }
                            }
                        }
                    }
                </script>
                <style>
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.5); }
                    body { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #0b0d17; }
                </style>
            </head>
            <body class="text-white font-sans antialiased flex flex-col h-full bg-obsidian selection:bg-neonpurple selection:text-white relative">
                
                <!-- Background Ambient Glow -->
                <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div class="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] rounded-full bg-neoncyan/10 blur-[100px] mix-blend-screen opacity-40"></div>
                </div>

                <div class="relative z-10 flex flex-col h-full p-4">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5 shrink-0">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-neoncyan/30 to-neonpurple/30 flex items-center justify-center border border-white/10">
                                <i class="fa-solid fa-eye text-neoncyan text-[10px]"></i>
                            </div>
                            <h3 class="font-display text-sm tracking-wider text-white uppercase">MirrorMind</h3>
                        </div>
                        <div class="w-2 h-2 rounded-full bg-neoncyan shadow-[0_0_10px_#00f0ff] animate-pulse"></div>
                    </div>

                    <!-- Cognitive Support (Mocked for extension) -->
                    <div class="mb-4 space-y-2 shrink-0">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fa-solid fa-bolt text-neonamber/80 text-xs"></i>
                            <h4 class="font-display text-[10px] text-gray-400 uppercase tracking-widest">Cognitive State</h4>
                        </div>
                        
                        <div class="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors group focus-card cursor-default">
                            <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center gap-2">
                                    <div class="w-5 h-5 rounded-full bg-neoncyan/20 flex items-center justify-center text-neoncyan group-hover:scale-110 transition-transform">
                                        <i class="fa-solid fa-brain text-[10px]"></i>
                                    </div>
                                    <span class="text-xs font-medium text-white">Flow State Maintained</span>
                                </div>
                                <span class="text-[10px] font-mono text-neoncyan bg-neoncyan/10 px-1.5 py-0.5 rounded">94%</span>
                            </div>
                            <div class="w-full bg-black/30 rounded-full h-1 mt-2">
                                <div class="bg-neoncyan h-1 rounded-full w-[94%] relative">
                                    <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_#00f0ff]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="my-2 border-t border-white/5 shrink-0"></div>

                    <!-- Chat Interface Header -->
                    <div class="flex items-center gap-2 mb-3 shrink-0 mt-2">
                        <i class="fa-solid fa-sparkles text-neonpurple/80 text-xs"></i>
                        <h4 class="font-display text-[10px] text-gray-400 uppercase tracking-widest">AI Companion</h4>
                    </div>

                    <!-- Chat Messages Area -->
                    <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 flex flex-col gap-3 pr-1 text-xs">
                        <div class="self-start bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-sm max-w-[90%] text-gray-300 shadow-sm shadow-black/20 leading-relaxed">
                            I am online and connected to your IDE context. How can I assist your coding today?
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="relative mt-auto shrink-0 group">
                        <input type="text" id="chat-input" placeholder="Query MirrorMind..." 
                            class="w-full bg-charcoal border border-white/10 rounded-xl py-3 pl-4 pr-11 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neoncyan/50 transition-all shadow-inner"
                            onkeypress="handleChatEnter(event)">
                        <button onclick="sendChatMessage()"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-lg bg-neoncyan/10 text-neoncyan hover:bg-neoncyan/20 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-paper-plane text-[10px]"></i>
                        </button>
                    </div>
                </div>

                <script>
                    function handleChatEnter(event) {
                        if (event.key === 'Enter') {
                            sendChatMessage();
                        }
                    }

                    async function sendChatMessage() {
                        const inputEl = document.getElementById('chat-input');
                        const message = inputEl.value.trim();
                        if (!message) return;

                        inputEl.value = '';
                        appendMessage(message, 'user');
                        const typingId = appendMessage('...', 'system');

                        try {
                            const response = await fetch('http://localhost:3000/api/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: message,
                                    context: {
                                        source: 'vscode-extension',
                                        details: 'User asking from IDE'
                                    }
                                })
                            });

                            const data = await response.json();
                            document.getElementById(typingId)?.remove();

                            if (data.reply) {
                                appendMessage(data.reply, 'system');
                            } else {
                                appendMessage("Error: Could not parse response.", 'system');
                            }

                        } catch (error) {
                            console.error("Chat Error:", error);
                            document.getElementById(typingId)?.remove();
                            appendMessage("System offline. Cannot connect to cognitive reasoning engine (http://localhost:3000).", 'system');
                        }
                    }

                    function appendMessage(text, sender) {
                        const container = document.getElementById('chat-messages');
                        if (!container) return null;

                        const div = document.createElement('div');
                        const msgId = 'msg-' + Date.now();
                        div.id = msgId;

                        if (sender === 'user') {
                            div.className = 'self-end bg-neoncyan/10 border border-neoncyan/20 p-2.5 rounded-xl rounded-tr-sm max-w-[90%] text-white shadow-sm shadow-neoncyan/5 leading-relaxed';
                            div.textContent = text;
                        } else {
                            // Removing whitespace-pre-wrap as small chat bubbles look better wrapping normally unless explicit
                            div.className = 'self-start bg-white/5 border border-white/10 p-2.5 rounded-xl rounded-tl-sm max-w-[90%] text-gray-300 shadow-sm shadow-black/20 leading-relaxed overflow-hidden text-ellipsis whitespace-pre-wrap';
                            div.textContent = text; 
                        }

                        container.appendChild(div);
                        container.scrollTop = container.scrollHeight;
                        return msgId;
                    }
                </script>
            </body>
            </html>`;
    }
}
