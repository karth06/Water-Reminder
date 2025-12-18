import * as vscode from 'vscode';
import { TimerManager } from './timerManager';
import { MedicineStorageManager } from './medicineStorageManager';
import { MedicineTimerManager } from './medicineTimerManager';

export class RetroViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'waterReminder.retroView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private timerManager: TimerManager,
        private medicineStorageManager: MedicineStorageManager,
        private medicineTimerManager: MedicineTimerManager
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
                case 'getMedicines':
                    this.sendMedicines();
                    break;
                case 'saveMedicine':
                    this.saveMedicine(data.medicine);
                    break;
                case 'deleteMedicine':
                    this.deleteMedicine(data.medicineId);
                    break;
                case 'toggleMedicineActive':
                    this.toggleMedicineActive(data.medicineId);
                    break;
                case 'toggleMedicineIntake':
                    this.toggleMedicineIntake(data.medicineId, data.date, data.timeIndex);
                    break;
                // Lock System
                case 'getLockState':
                    this.sendLockState();
                    break;
                case 'setPassword':
                    this.setPassword(data.password);
                    break;
                case 'lock':
                    this.setLockState(true);
                    break;
                case 'unlock':
                    this.unlock(data.password);
                    break;
                case 'resetPassword':
                    this.resetPassword();
                    break;
                case 'setSecurityQuestions':
                    this.setSecurityQuestions(data.questionsAndAnswers);
                    break;
                case 'getSecurityQuestions':
                    this.sendSecurityQuestions();
                    break;
                case 'verifySecurityAnswers':
                    this.verifySecurityAnswers(data.answers);
                    break;
            }
        });

        this.updateWebview();
    }

    private async sendLockState() {
        if (this._view) {
            const password = await this.medicineStorageManager.getPassword();
            const isLocked = await this.medicineStorageManager.getIsLocked();
            this._view.webview.postMessage({
                type: 'lockState',
                hasPassword: !!password,
                isLocked: isLocked
            });
        }
    }

    private async setPassword(password: string) {
        await this.medicineStorageManager.setPassword(password);
        this.sendLockState();
    }

    private async setLockState(locked: boolean) {
        await this.medicineStorageManager.setIsLocked(locked);
        this.sendLockState();
    }

    private async unlock(password: string) {
        const isValid = await this.medicineStorageManager.verifyPassword(password);
        if (isValid) {
            await this.medicineStorageManager.setIsLocked(false);
            this._view?.webview.postMessage({ type: 'unlockSuccess' });
            this.sendLockState();
        } else {
            this._view?.webview.postMessage({ type: 'unlockFailed' });
        }
    }

    private async resetPassword() {
        try {
            // Clear password, security questions, and unlock
            await this.medicineStorageManager.setPassword('');
            await this.medicineStorageManager.clearSecurityQuestions();
            await this.medicineStorageManager.setIsLocked(false);
            this.sendLockState();
            this._view?.webview.postMessage({ type: 'passwordReset' });
            vscode.window.showInformationMessage('🔓 Password and security questions cleared.');
        } catch (error) {
            console.error('[RetroViewProvider] Error resetting password:', error);
            vscode.window.showErrorMessage('Failed to reset password');
        }
    }

    private async setSecurityQuestions(questionsAndAnswers: Array<{question: string, answer: string}>) {
        try {
            await this.medicineStorageManager.setSecurityQuestions(questionsAndAnswers);
            this._view?.webview.postMessage({ type: 'securityQuestionsSet' });
        } catch (error) {
            console.error('[RetroViewProvider] Error setting security questions:', error);
            vscode.window.showErrorMessage('Failed to set security questions');
        }
    }

    private async sendSecurityQuestions() {
        if (this._view) {
            try {
                const questions = await this.medicineStorageManager.getSecurityQuestions();
                this._view.webview.postMessage({
                    type: 'securityQuestions',
                    questions
                });
            } catch (error) {
                console.error('[RetroViewProvider] Error getting security questions:', error);
                this._view.webview.postMessage({
                    type: 'securityQuestions',
                    questions: []
                });
            }
        }
    }

    private async verifySecurityAnswers(answers: string[]) {
        try {
            const isValid = await this.medicineStorageManager.verifySecurityAnswers(answers);
            if (isValid) {
                this._view?.webview.postMessage({ type: 'securityVerificationSuccess' });
            } else {
                this._view?.webview.postMessage({ type: 'securityVerificationFailed' });
            }
        } catch (error) {
            console.error('[RetroViewProvider] Error verifying security answers:', error);
            this._view?.webview.postMessage({ type: 'securityVerificationFailed' });
        }
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

    private async sendMedicines() {
        if (this._view) {
            try {
                const medicines = await this.medicineStorageManager.loadMedicines();
                this._view.webview.postMessage({
                    type: 'medicinesUpdate',
                    medicines
                });
            } catch (error) {
                console.error('[RetroViewProvider] Error loading medicines:', error);
                this._view.webview.postMessage({
                    type: 'medicinesUpdate',
                    medicines: []
                });
            }
        }
    }

    private async saveMedicine(medicine: any) {
        try {
            const medicines = await this.medicineStorageManager.loadMedicines();
            const existingIndex = medicines.findIndex((m: any) => m.id === medicine.id);
            
            if (existingIndex >= 0) {
                // Update existing
                medicines[existingIndex] = medicine;
            } else {
                // Add new
                medicines.push(medicine);
            }
            
            await this.medicineStorageManager.saveMedicines(medicines);
            await this.medicineTimerManager.rescheduleAll();
            this.sendMedicines();
            
            vscode.window.showInformationMessage(`💊 Medicine "${medicine.name}" saved successfully!`);
        } catch (error) {
            console.error('[RetroViewProvider] Error saving medicine:', error);
            vscode.window.showErrorMessage('Failed to save medicine');
        }
    }

    private async deleteMedicine(medicineId: string) {
        try {
            const medicines = await this.medicineStorageManager.loadMedicines();
            const medicine = medicines.find((m: any) => m.id === medicineId);
            const filtered = medicines.filter((m: any) => m.id !== medicineId);
            
            await this.medicineStorageManager.saveMedicines(filtered);
            await this.medicineTimerManager.rescheduleAll();
            this.sendMedicines();
            
            if (medicine) {
                vscode.window.showInformationMessage(`🗑️ Medicine "${medicine.name}" deleted`);
            }
        } catch (error) {
            console.error('[RetroViewProvider] Error deleting medicine:', error);
            vscode.window.showErrorMessage('Failed to delete medicine');
        }
    }

    private async toggleMedicineActive(medicineId: string) {
        try {
            const medicines = await this.medicineStorageManager.loadMedicines();
            const medicine = medicines.find((m: any) => m.id === medicineId);
            
            if (medicine) {
                medicine.isActive = !medicine.isActive;
                await this.medicineStorageManager.saveMedicines(medicines);
                await this.medicineTimerManager.rescheduleAll();
                this.sendMedicines();
                
                const status = medicine.isActive ? 'activated' : 'paused';
                vscode.window.showInformationMessage(`${medicine.isActive ? '✅' : '⏸️'} Medicine "${medicine.name}" ${status}`);
            }
        } catch (error) {
            console.error('[RetroViewProvider] Error toggling medicine:', error);
            vscode.window.showErrorMessage('Failed to update medicine status');
        }
    }

    private async toggleMedicineIntake(medicineId: string, date: string, timeIndex: number) {
        try {
            const medicines = await this.medicineStorageManager.loadMedicines();
            const medicine = medicines.find((m: any) => m.id === medicineId);
            
            if (medicine) {
                // Initialize intakeTracking if it doesn't exist
                if (!medicine.intakeTracking) {
                    medicine.intakeTracking = {};
                }
                
                // Initialize array for this date if it doesn't exist
                if (!medicine.intakeTracking[date]) {
                    medicine.intakeTracking[date] = [];
                }
                
                // Toggle the intake status for this time index
                const wasTaken = medicine.intakeTracking[date][timeIndex];
                medicine.intakeTracking[date][timeIndex] = !wasTaken;
                
                // Update stock quantity if tracked
                if (medicine.currentQuantity !== undefined) {
                    if (!wasTaken) {
                        // Marking as taken -> Decrement
                        medicine.currentQuantity = Math.max(0, medicine.currentQuantity - 1);
                        
                        // Check for low stock alert
                        if (medicine.refillThreshold !== undefined && medicine.currentQuantity <= medicine.refillThreshold) {
                            vscode.window.showWarningMessage(`⚠️ Low stock alert: ${medicine.name} has ${medicine.currentQuantity} doses left.`);
                        }
                    } else {
                        // Marking as untaken -> Increment
                        medicine.currentQuantity = medicine.currentQuantity + 1;
                    }
                }
                
                await this.medicineStorageManager.saveMedicines(medicines);
                this.sendMedicines();
            }
        } catch (error) {
            console.error('[RetroViewProvider] Error toggling intake:', error);
            vscode.window.showErrorMessage('Failed to update intake tracking');
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; connect-src https://api.quotable.io;">
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
