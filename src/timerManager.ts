import * as vscode from 'vscode';

export class TimerManager {
    private interval: NodeJS.Timeout | undefined;
    private inactivityInterval: NodeJS.Timeout | undefined;
    private remainingSeconds: number = 0;
    private totalSeconds: number = 0;
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private dailyCount: number = 0;
    private lastResetDate: string = '';
    private lastDrinkTime: number = Date.now();
    private inactivityAlertShown: boolean = false;
    private weeklyHistory: { [date: string]: number } = {};
    private totalGlassesAllTime: number = 0;
    private currentStreak: number = 0;
    private longestStreak: number = 0;
    private lastSmartReminderTime: number = Date.now();
    private smartReminderInterval: NodeJS.Timeout | undefined;
    private caffeineCount: number = 0;
    private lastCaffeineTime: number = 0;
    private workPatternData: { hour: number; drinks: number }[] = [];

    private readonly onTimerUpdateEmitter = new vscode.EventEmitter<number>();
    public readonly onTimerUpdate = this.onTimerUpdateEmitter.event;

    private readonly onTimerCompleteEmitter = new vscode.EventEmitter<void>();
    public readonly onTimerComplete = this.onTimerCompleteEmitter.event;

    private readonly onDailyCountUpdateEmitter = new vscode.EventEmitter<number>();
    public readonly onDailyCountUpdate = this.onDailyCountUpdateEmitter.event;

    private readonly onInactivityAlertEmitter = new vscode.EventEmitter<number>();
    public readonly onInactivityAlert = this.onInactivityAlertEmitter.event;

    private readonly onSmartReminderEmitter = new vscode.EventEmitter<void>();
    public readonly onSmartReminder = this.onSmartReminderEmitter.event;

    constructor(private context: vscode.ExtensionContext) {
        this.loadState();
        this.checkAndResetDaily();
        // Disabled: this.startInactivityMonitoring(); // Using only smart reminders instead
        this.startSmartReminders();
    }

    private loadState() {
        this.remainingSeconds = this.context.globalState.get('remainingSeconds', 0);
        this.totalSeconds = this.context.globalState.get('totalSeconds', 0);
        this.isRunning = this.context.globalState.get('isRunning', false);
        this.isPaused = this.context.globalState.get('isPaused', false);
        this.dailyCount = this.context.globalState.get('dailyCount', 0);
        this.lastResetDate = this.context.globalState.get('lastResetDate', this.getTodayDate());
        this.lastDrinkTime = this.context.globalState.get('lastDrinkTime', Date.now());
        this.weeklyHistory = this.context.globalState.get('weeklyHistory', {});
        this.totalGlassesAllTime = this.context.globalState.get('totalGlassesAllTime', 0);
        this.currentStreak = this.context.globalState.get('currentStreak', 0);
        this.longestStreak = this.context.globalState.get('longestStreak', 0);
        this.lastSmartReminderTime = this.context.globalState.get('lastSmartReminderTime', Date.now());
        this.caffeineCount = this.context.globalState.get('caffeineCount', 0);
        this.lastCaffeineTime = this.context.globalState.get('lastCaffeineTime', 0);
        this.workPatternData = this.context.globalState.get('workPatternData', []);

        // Resume timer if it was running
        if (this.isRunning && !this.isPaused) {
            this.resumeTimer();
        }
    }

    private saveState() {
        this.context.globalState.update('remainingSeconds', this.remainingSeconds);
        this.context.globalState.update('totalSeconds', this.totalSeconds);
        this.context.globalState.update('isRunning', this.isRunning);
        this.context.globalState.update('isPaused', this.isPaused);
        this.context.globalState.update('dailyCount', this.dailyCount);
        this.context.globalState.update('lastResetDate', this.lastResetDate);
        this.context.globalState.update('lastDrinkTime', this.lastDrinkTime);
        this.context.globalState.update('weeklyHistory', this.weeklyHistory);
        this.context.globalState.update('totalGlassesAllTime', this.totalGlassesAllTime);
        this.context.globalState.update('currentStreak', this.currentStreak);
        this.context.globalState.update('longestStreak', this.longestStreak);
        this.context.globalState.update('lastSmartReminderTime', this.lastSmartReminderTime);
        this.context.globalState.update('caffeineCount', this.caffeineCount);
        this.context.globalState.update('lastCaffeineTime', this.lastCaffeineTime);
        this.context.globalState.update('workPatternData', this.workPatternData);
    }

    private getTodayDate(): string {
        // Get current date/time in user's local timezone
        const now = new Date();
        
        // Get reset hour from configuration (default: 5 AM)
        const config = vscode.workspace.getConfiguration('waterReminder');
        const resetHour = config.get<number>('dailyResetHour', 5);
        
        // If it's before reset hour, consider it as part of previous day
        // This way the day resets at user's preferred time instead of midnight
        if (now.getHours() < resetHour) {
            // Subtract one day
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toDateString();
        }
        
        return now.toDateString();
    }

    private checkAndResetDaily() {
        const today = this.getTodayDate();
        if (this.lastResetDate !== today) {
            // Save yesterday's count to history
            const yesterday = this.lastResetDate;
            if (this.dailyCount > 0) {
                this.weeklyHistory[yesterday] = this.dailyCount;
                
                // Update streak
                const goalMet = this.dailyCount >= this.getDailyGoal();
                if (goalMet) {
                    this.currentStreak++;
                    if (this.currentStreak > this.longestStreak) {
                        this.longestStreak = this.currentStreak;
                    }
                } else {
                    this.currentStreak = 0;
                }
            }
            
            // Clean old history (keep last 30 days)
            const dates = Object.keys(this.weeklyHistory);
            if (dates.length > 30) {
                dates.sort().slice(0, dates.length - 30).forEach(date => {
                    delete this.weeklyHistory[date];
                });
            }
            
            this.dailyCount = 0;
            this.caffeineCount = 0; // Reset caffeine count daily
            this.lastResetDate = today;
            this.saveState();
            this.onDailyCountUpdateEmitter.fire(this.dailyCount);
        }
    }

    private startInactivityMonitoring() {
        // Check every minute for inactivity
        this.inactivityInterval = setInterval(() => {
            const now = Date.now();
            const currentHour = new Date().getHours();
            
            // Get reset hour from configuration (default: 5 AM)
            const config = vscode.workspace.getConfiguration('waterReminder');
            const resetHour = config.get<number>('dailyResetHour', 5);
            
            // Don't alert during typical sleep hours (11 PM to reset hour)
            // Assuming sleep time is from 11 PM to user's reset hour
            const isSleepTime = currentHour >= 23 || currentHour < resetHour;
            if (isSleepTime) {
                this.inactivityAlertShown = false;
                return;
            }
            
            const inactiveMinutes = Math.floor((now - this.lastDrinkTime) / (1000 * 60));
            
            // Check if last drink was before reset hour today (likely from yesterday)
            const lastDrinkDate = new Date(this.lastDrinkTime);
            const todayResetTime = new Date();
            todayResetTime.setHours(resetHour, 0, 0, 0);
            
            // If last drink was before today's reset time, reset the timer from reset time
            if (lastDrinkDate < todayResetTime) {
                const minutesSinceReset = Math.floor((now - todayResetTime.getTime()) / (1000 * 60));
                
                // Only alert if more than 60 minutes have passed since reset time (giving time to wake up)
                if (minutesSinceReset >= 60 && !this.inactivityAlertShown) {
                    this.inactivityAlertShown = true;
                    this.onInactivityAlertEmitter.fire(minutesSinceReset);
                }
            } else {
                // Normal inactivity check (60 minutes since last drink)
                if (inactiveMinutes >= 60 && !this.inactivityAlertShown) {
                    this.inactivityAlertShown = true;
                    this.onInactivityAlertEmitter.fire(inactiveMinutes);
                }
            }
            
            // Reset alert flag after 90 minutes to allow re-alerting
            if (inactiveMinutes >= 90) {
                this.inactivityAlertShown = false;
            }
        }, 60000); // Check every minute
    }

    private startSmartReminders() {
        // Check every 30 minutes for smart reminders
        this.smartReminderInterval = setInterval(() => {
            const now = Date.now();
            const minutesSinceLastReminder = (now - this.lastSmartReminderTime) / (1000 * 60);
            
            // If timer is paused/stopped for 90+ minutes, send smart reminder
            if (minutesSinceLastReminder >= 90 && (!this.isRunning || this.isPaused)) {
                this.lastSmartReminderTime = now;
                this.saveState();
                this.onSmartReminderEmitter.fire();
            }
        }, 30 * 60 * 1000); // Check every 30 minutes
    }

    public start(minutes?: number) {
        this.checkAndResetDaily();
        
        if (minutes === undefined) {
            const config = vscode.workspace.getConfiguration('waterReminder');
            minutes = config.get<number>('intervalMinutes', 30);
        }

        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = true;
        this.isPaused = false;

        this.saveState();
        this.startTicking();
        this.onTimerUpdateEmitter.fire(this.remainingSeconds);
    }

    private startTicking() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.saveState();
                this.onTimerUpdateEmitter.fire(this.remainingSeconds);

                if (this.remainingSeconds === 0) {
                    this.complete();
                }
            }
        }, 1000);
    }

    private complete() {
        this.stop();
        this.onTimerCompleteEmitter.fire();
    }

    public pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
            this.saveState();
            this.onTimerUpdateEmitter.fire(this.remainingSeconds);
        }
    }

    public resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.saveState();
            this.resumeTimer();
        }
    }

    private resumeTimer() {
        if (this.remainingSeconds > 0) {
            this.startTicking();
            this.onTimerUpdateEmitter.fire(this.remainingSeconds);
        }
    }

    public stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
        this.saveState();
    }

    public reset() {
        this.stop();
        const config = vscode.workspace.getConfiguration('waterReminder');
        const minutes = config.get<number>('intervalMinutes', 30);
        this.remainingSeconds = minutes * 60;
        this.totalSeconds = this.remainingSeconds;
        this.saveState();
        this.onTimerUpdateEmitter.fire(this.remainingSeconds);
    }

    public drankWater() {
        this.checkAndResetDaily();
        this.dailyCount++;
        this.totalGlassesAllTime++;
        this.lastDrinkTime = Date.now();
        this.lastSmartReminderTime = Date.now(); // Reset smart reminder timer
        this.inactivityAlertShown = false;
        
        // Track work pattern
        const hour = new Date().getHours();
        const hourData = this.workPatternData.find(d => d.hour === hour);
        if (hourData) {
            hourData.drinks++;
        } else {
            this.workPatternData.push({ hour, drinks: 1 });
        }
        
        // Keep only last 100 entries
        if (this.workPatternData.length > 100) {
            this.workPatternData.shift();
        }
        
        this.saveState();
        this.onDailyCountUpdateEmitter.fire(this.dailyCount);

        // Auto-start if enabled, or start with configured interval if timer was paused/stopped
        const config = vscode.workspace.getConfiguration('waterReminder');
        const autoStart = config.get<boolean>('autoStart', true);
        const intervalMinutes = config.get<number>('intervalMinutes', 30);
        
        if (autoStart) {
            this.start();
        } else if (!this.isRunning || this.isPaused) {
            // Start timer with configured interval if it was paused/stopped
            this.start(intervalMinutes);
        }
    }

    public resetDailyCount() {
        this.dailyCount = 0;
        this.lastResetDate = this.getTodayDate();
        this.saveState();
        this.onDailyCountUpdateEmitter.fire(this.dailyCount);
    }

    public getRemainingSeconds(): number {
        return this.remainingSeconds;
    }

    public getTotalSeconds(): number {
        return this.totalSeconds;
    }

    public getIsRunning(): boolean {
        return this.isRunning;
    }

    public getIsPaused(): boolean {
        return this.isPaused;
    }

    public getDailyCount(): number {
        this.checkAndResetDaily();
        return this.dailyCount;
    }

    public getDailyGoal(): number {
        const config = vscode.workspace.getConfiguration('waterReminder');
        return config.get<number>('dailyGoal', 8);
    }

    public getInactiveMinutes(): number {
        return Math.floor((Date.now() - this.lastDrinkTime) / (1000 * 60));
    }

    public getWeeklyHistory(): { [date: string]: number } {
        return { ...this.weeklyHistory };
    }

    public getTotalGlassesAllTime(): number {
        return this.totalGlassesAllTime;
    }

    public getCurrentStreak(): number {
        return this.currentStreak;
    }

    public getLongestStreak(): number {
        return this.longestStreak;
    }

    public getWeeklyAverage(): number {
        const values = Object.values(this.weeklyHistory);
        if (values.length === 0) {return 0;}
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    public logCaffeine() {
        this.checkAndResetDaily();
        this.caffeineCount++;
        this.lastCaffeineTime = Date.now();
        this.saveState();
    }

    public getCaffeineCount(): number {
        this.checkAndResetDaily();
        return this.caffeineCount;
    }

    public getRecommendedWaterForCaffeine(): number {
        // For each coffee, recommend 2 extra glasses of water
        return this.caffeineCount * 2;
    }

    public getPeakHydrationHours(): number[] {
        // Analyze work pattern to find peak hours
        const hourCounts: { [hour: number]: number } = {};
        this.workPatternData.forEach(d => {
            hourCounts[d.hour] = (hourCounts[d.hour] || 0) + d.drinks;
        });
        
        const sorted = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        return sorted;
    }

    public setDailyGoal(goal: number) {
        // The goal is stored in VS Code settings, this just triggers an update
        this.onDailyCountUpdateEmitter.fire(this.dailyCount);
    }

    public updateInterval(minutes: number) {
        // If timer is not running, update the remaining time
        if (!this.isRunning) {
            this.totalSeconds = minutes * 60;
            this.remainingSeconds = this.totalSeconds;
            this.saveState();
            this.onTimerUpdateEmitter.fire(this.remainingSeconds);
        }
    }

    public formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    public dispose() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.inactivityInterval) {
            clearInterval(this.inactivityInterval);
        }
        if (this.smartReminderInterval) {
            clearInterval(this.smartReminderInterval);
        }
        this.onTimerUpdateEmitter.dispose();
        this.onTimerCompleteEmitter.dispose();
        this.onDailyCountUpdateEmitter.dispose();
        this.onInactivityAlertEmitter.dispose();
        this.onSmartReminderEmitter.dispose();
    }
}
