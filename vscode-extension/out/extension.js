"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const node_fetch_1 = require("node-fetch"); // Requires node-fetch@2
let statusBarItem;
let pollInterval;
const BACKEND_URL = 'http://localhost:3000/api/state';
function activate(context) {
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
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('mirrormind.webview', provider));
    // Register Command
    let disposable = vscode.commands.registerCommand('mirrormind.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.mirrormind-sidebar');
    });
    context.subscriptions.push(disposable);
}
function startPolling() {
    if (pollInterval)
        clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        try {
            const response = await (0, node_fetch_1.default)(BACKEND_URL);
            if (!response.ok)
                throw new Error("Network response was not ok");
            const state = await response.json();
            // e.g. state = { mood: "Focused", focusScore: 94 }
            let icon = "$(zap)";
            if (state.mood === "Engaged")
                icon = "$(smiley)";
            if (state.mood === "Fatigued")
                icon = "$(battery-0)";
            if (state.mood === "Stressed")
                icon = "$(flame)";
            updateStatusBar(`${icon} ${state.mood} (${state.focusScore}%)`, state.details);
        }
        catch (error) {
            updateStatusBar("$(disconnected) MirrorMind Offline", "Ensure server.js is running");
        }
    }, 2000); // Poll every 2 seconds
}
function updateStatusBar(text, tooltip) {
    statusBarItem.text = text;
    statusBarItem.tooltip = tooltip;
}
function deactivate() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
}
// Webview Provider Class
class MirrorMindWebviewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
        // Simple HTML structure simulating the cognitive support / chat view
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MirrorMind</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 10px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .card {
                        background-color: var(--vscode-editorWidget-background);
                        border: 1px solid var(--vscode-widget-border);
                        padding: 10px;
                        margin-bottom: 10px;
                        border-radius: 4px;
                    }
                    h3 { margin-top: 0; font-size: 14px; color: var(--vscode-terminal-ansiCyan); }
                    p { font-size: 12px; margin-bottom: 5px; opacity: 0.8;}
                </style>
            </head>
            <body>
                <h2>Cognitive Support</h2>
                <div class="card">
                    <h3>Optimal Break Window</h3>
                    <p>You've maintained hyper-focus for extended periods. Consider a 5-minute break soon.</p>
                </div>
                <div class="card">
                    <h3>Focus Audio</h3>
                    <p>Suggesting ambient binaural beats for current cognitive load.</p>
                </div>
                <hr style="border:0; border-bottom: 1px solid var(--vscode-widget-border); margin: 20px 0;"/>
                <h2>AI Assistant</h2>
                <div class="card">
                    <p><em>(Chat interface connecting to Gemini API will load here)</em></p>
                    <p>MirrorMind holds context of your current flow state.</p>
                </div>
            </body>
            </html>`;
    }
}
//# sourceMappingURL=extension.js.map