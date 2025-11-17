import * as vscode from 'vscode';
import { TimerManager } from './timerManager';

export class RetroViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'waterReminder.retroView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private timerManager: TimerManager
    ) {
        // Listen to timer updates
        this.timerManager.onTimerUpdate(() => {
            this.updateWebview();
        });

        this.timerManager.onDailyCountUpdate(() => {
            this.updateWebview();
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'start':
                    vscode.commands.executeCommand('waterReminder.startTimer');
                    break;
                case 'pause':
                    vscode.commands.executeCommand('waterReminder.pauseTimer');
                    break;
                case 'reset':
                    vscode.commands.executeCommand('waterReminder.resetTimer');
                    break;
                case 'drankWater':
                    vscode.commands.executeCommand('waterReminder.drankWater');
                    break;
                case 'getState':
                    this.updateWebview();
                    break;
                case 'updateInterval':
                    vscode.commands.executeCommand('waterReminder.stopSound');
                    const config = vscode.workspace.getConfiguration('waterReminder');
                    config.update('intervalMinutes', data.intervalMinutes, vscode.ConfigurationTarget.Global);
                    const wasRunning = this.timerManager.getIsRunning() && !this.timerManager.getIsPaused();
                    this.timerManager.updateInterval(data.intervalMinutes);
                    // Restart timer with new interval if it was running
                    if (wasRunning) {
                        this.timerManager.start(data.intervalMinutes);
                    }
                    // Send confirmation back to webview
                    this._view?.webview.postMessage({ type: 'intervalUpdated', intervalMinutes: data.intervalMinutes });
                    this.updateWebview();
                    break;
                case 'updateGoal':
                    const goalConfig = vscode.workspace.getConfiguration('waterReminder');
                    goalConfig.update('dailyGoal', data.dailyGoal, vscode.ConfigurationTarget.Global);
                    this.timerManager.setDailyGoal(data.dailyGoal);
                    // Send confirmation back to webview
                    this._view?.webview.postMessage({ type: 'goalUpdated', dailyGoal: data.dailyGoal });
                    this.updateWebview();
                    break;
                case 'logCaffeine':
                    vscode.commands.executeCommand('waterReminder.logCaffeine');
                    this.updateWebview();
                    break;
                case 'getStats':
                    this.sendStats();
                    break;
                case 'toggleSound':
                    const soundConfig = vscode.workspace.getConfiguration('waterReminder');
                    const currentSoundEnabled = soundConfig.get<boolean>('soundEnabled', true);
                    soundConfig.update('soundEnabled', !currentSoundEnabled, vscode.ConfigurationTarget.Global);
                    this.updateWebview();
                    break;
                case 'updateSoundType':
                    const soundTypeConfig = vscode.workspace.getConfiguration('waterReminder');
                    soundTypeConfig.update('soundType', data.soundType, vscode.ConfigurationTarget.Global);
                    this.updateWebview();
                    break;
                case 'previewSound':
                    vscode.commands.executeCommand('waterReminder.previewSound', data.soundType);
                    break;
            }
        });

        this.updateWebview();
    }

    private sendStats() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'stats',
                currentStreak: this.timerManager.getCurrentStreak(),
                longestStreak: this.timerManager.getLongestStreak(),
                totalGlasses: this.timerManager.getTotalGlassesAllTime(),
                weeklyAverage: this.timerManager.getWeeklyAverage(),
                weeklyHistory: this.timerManager.getWeeklyHistory(),
                peakHours: this.timerManager.getPeakHydrationHours(),
                caffeineCount: this.timerManager.getCaffeineCount(),
                recommendedWater: this.timerManager.getRecommendedWaterForCaffeine()
            });
        }
    }

    private updateWebview() {
        if (this._view) {
            const config = vscode.workspace.getConfiguration('waterReminder');
            const intervalMinutes = config.get<number>('intervalMinutes', 30);
            const soundEnabled = config.get<boolean>('soundEnabled', true);
            const soundType = config.get<string>('soundType', 'alarm-1');
            
            this._view.webview.postMessage({
                type: 'update',
                remainingSeconds: this.timerManager.getRemainingSeconds(),
                totalSeconds: this.timerManager.getTotalSeconds(),
                isRunning: this.timerManager.getIsRunning(),
                isPaused: this.timerManager.getIsPaused(),
                dailyCount: this.timerManager.getDailyCount(),
                dailyGoal: this.timerManager.getDailyGoal(),
                intervalMinutes: intervalMinutes,
                soundEnabled: soundEnabled,
                soundType: soundType,
                caffeineCount: this.timerManager.getCaffeineCount()
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
    <title>Water Reminder</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
