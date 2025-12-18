import * as vscode from 'vscode';
import { TimerManager } from './timerManager';
import { WaterReminderViewProvider } from './sidebarProvider';
import { RetroViewProvider } from './retroViewProvider';
import { AchievementManager } from './achievementManager';
import { MedicineStorageManager } from './medicineStorageManager';
import { MedicineTimerManager } from './medicineTimerManager';

let timerManager: TimerManager;
let achievementManager: AchievementManager;
let medicineStorageManager: MedicineStorageManager;
let medicineTimerManager: MedicineTimerManager;
let statusBarItem: vscode.StatusBarItem;
let goalsMetCount: number = 0;

export function activate(context: vscode.ExtensionContext) {
    console.log('Water Reminder extension is now active!');

    // Initialize managers
    timerManager = new TimerManager(context);
    achievementManager = new AchievementManager(context);
    medicineStorageManager = new MedicineStorageManager(context);
    medicineTimerManager = new MedicineTimerManager(context, medicineStorageManager);
    goalsMetCount = context.globalState.get('goalsMetCount', 0);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'waterReminder.openRetroView';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Update status bar
    updateStatusBar();
    timerManager.onTimerUpdate(() => updateStatusBar());
    timerManager.onDailyCountUpdate(() => updateStatusBar());

    // Register sidebar view provider
    const sidebarProvider = new WaterReminderViewProvider(timerManager);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('waterReminderView', sidebarProvider)
    );

    // Register retro webview view provider
    const retroViewProvider = new RetroViewProvider(context.extensionUri, timerManager, medicineStorageManager, medicineTimerManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(RetroViewProvider.viewType, retroViewProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.startTimer', () => {
            if (timerManager.getIsPaused()) {
                timerManager.resume();
                vscode.window.showInformationMessage('⏱️ Timer resumed!');
            } else {
                timerManager.start();
                vscode.window.showInformationMessage('⏱️ Water reminder timer started!');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.pauseTimer', () => {
            timerManager.pause();
            vscode.window.showInformationMessage('⏸️ Timer paused');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.resetTimer', () => {
            timerManager.reset();
            vscode.window.showInformationMessage('🔄 Timer reset');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.drankWater', async () => {
            timerManager.drankWater();
            const dailyCount = timerManager.getDailyCount();
            const dailyGoal = timerManager.getDailyGoal();
            
            // Check for achievements
            const newAchievements = achievementManager.checkAchievements({
                currentStreak: timerManager.getCurrentStreak(),
                totalGlasses: timerManager.getTotalGlassesAllTime(),
                dailyCount: dailyCount,
                dailyGoal: dailyGoal,
                goalsMetCount: goalsMetCount
            });
            
            if (dailyCount >= dailyGoal) {
                // Increment goals met counter
                const previousCount = dailyCount - 1;
                if (previousCount < dailyGoal) {
                    goalsMetCount++;
                    context.globalState.update('goalsMetCount', goalsMetCount);
                }
                vscode.window.showInformationMessage(`🎉 Congratulations! You've reached your daily water goal! (${dailyCount}/${dailyGoal})`);
            } else {
                vscode.window.showInformationMessage(`💧 Great! Water logged: ${dailyCount}/${dailyGoal}`);
            }
            
            // Show achievement notifications
            newAchievements.forEach(ach => {
                setTimeout(() => {
                    vscode.window.showInformationMessage(
                        `${ach.icon} Achievement Unlocked: ${ach.title}! ${ach.description}`,
                        'View All Achievements'
                    ).then(action => {
                        if (action) {
                            vscode.commands.executeCommand('waterReminder.showAchievements');
                        }
                    });
                }, 1000);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.openRetroView', () => {
            // Just focus the sidebar view instead of opening new panels
            vscode.commands.executeCommand('waterReminder.retroView.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.resetDailyCount', () => {
            timerManager.resetDailyCount();
            vscode.window.showInformationMessage('🔄 Daily water count reset');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.showAchievements', () => {
            showAchievementsQuickPick();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('waterReminder.logCaffeine', () => {
            timerManager.logCaffeine();
            const caffeineCount = timerManager.getCaffeineCount();
            const recommendedWater = timerManager.getRecommendedWaterForCaffeine();
            vscode.window.showInformationMessage(
                `☕ Caffeine logged! Today: ${caffeineCount} cup(s). Recommended: ${recommendedWater} extra glasses of water!`
            );
        })
    );

    // Listen for timer completion to show notification
    timerManager.onTimerComplete(() => {
        showWaterReminder(context);
    });

    // Inactivity alerts disabled - using only smart reminders
    // timerManager.onInactivityAlert((inactiveMinutes) => {
    //     showInactivityAlert(context, inactiveMinutes);
    // });

    // Listen for smart reminders (90 minutes when paused/stopped)
    timerManager.onSmartReminder(() => {
        showSmartReminder(context);
    });

    // Listen for medicine reminders
    medicineTimerManager.onMedicineReminder((event) => {
        if (event.isPreReminder) {
            vscode.window.showInformationMessage(
                `⏰ Reminder: Take "${event.medicine.name}" in ${event.minutesUntil} minutes`,
                'Remind Me Later',
                'Got It'
            );
        } else {
            // Actual reminder time!
            vscode.window.showWarningMessage(
                `💊 Time to take "${event.medicine.name}"!`,
                { modal: true },
                'Taken',
                'Snooze 10m',
                'Skip'
            ).then(selection => {
                if (selection === 'Taken') {
                    // TODO: Log medicine intake
                    vscode.window.showInformationMessage(`✅ Marked "${event.medicine.name}" as taken. Great job!`);
                } else if (selection === 'Snooze 10m') {
                    // TODO: Implement snooze logic in MedicineTimerManager
                    vscode.window.showInformationMessage(`💤 Snoozed "${event.medicine.name}" for 10 minutes.`);
                }
            });
        }
    });

    // Welcome message
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            '💧 Water Reminder activated! Click the status bar or open the sidebar to start.',
            'Got it!'
        ).then(() => {
            context.globalState.update('hasShownWelcome', true);
        });
    }
}

function updateStatusBar() {
    const remainingSeconds = timerManager.getRemainingSeconds();
    const timeDisplay = timerManager.formatTime(remainingSeconds);
    const dailyCount = timerManager.getDailyCount();
    const dailyGoal = timerManager.getDailyGoal();
    
    statusBarItem.text = `💧 ${timeDisplay} | ${dailyCount}/${dailyGoal}`;
    statusBarItem.tooltip = `Water Reminder - Next reminder in ${timeDisplay}\nToday: ${dailyCount}/${dailyGoal} glasses`;
}

async function showWaterReminder(context: vscode.ExtensionContext) {
    // Show notification with action buttons
    const action = await vscode.window.showWarningMessage(
        '💧 Time to drink water! Stay hydrated! 💧',
        { modal: false },
        '💧 Log Water Intake',
        'Snooze 5 min',
        'Open Retro View'
    );

    if (action === '💧 Log Water Intake') {
        vscode.commands.executeCommand('waterReminder.drankWater');
    } else if (action === 'Snooze 5 min') {
        timerManager.start(5);
        vscode.window.showInformationMessage('⏰ Snoozed for 5 minutes');
    } else if (action === 'Open Retro View') {
        vscode.commands.executeCommand('waterReminder.openRetroView');
    }
}

const SMART_REMINDER_QUOTES = [
    "🙆 Fun fact: Hydration makes your skin glow! Your future self will thank you!",
    "🧠 Your brain is literally shrinking from dehydration. Let's fix that!",
    "😌 Stress? Anxiety? Try H2O therapy - it's free and tastes like nothing!",
    "✨ Flawless skin secret: It's not expensive cream, it's just... water!",
    "🎯 Productivity hack: Stay hydrated. Your brain runs 73% on water, not coffee!",
    "💪 Dehydration = Confusion, Fatigue, Grumpiness. Water = Superhuman mode!",
    "🚨 HYDRATION POLICE: You've been coding dry for 2 hours! Drink or face the consequences!",
    "🎪 Breaking news: Local developer forgets to drink water, becomes human raisin!",
    "🤖 System alert: Your meat computer needs coolant. Please refuel H2O!",
    "🎮 Achievement locked: 'Actually Remembered to Drink Water'. Unlock it now!",
    "📢 PSA: Your body called. It said 'Hey, remember me? I need water!'",
    "🦸 Be a hero to your kidneys. They've been working hard. Give them water!",
    "😊 Mood boost in 3... 2... 1... Just drink water! (Science approved!)",
    "🌈 Feeling foggy? 75% chance it's dehydration. The other 25%? Also dehydration!",
    "🎭 Plot twist: That afternoon slump isn't caffeine withdrawl, it's thirst!",
    "💡 Brain fog clearing spell: Drink water. Repeat. Watch magic happen!",
    "📊 ROI on water: Reduced stress, improved focus, zero cost. Best investment ever!",
    "⚡ Energy levels low? Before reaching for caffeine, try the OG energy drink: Water!",
    "🎯 Peak performance requires peak hydration. Champions drink water!",
    "🔬 Science says: 2% dehydration = 20% brain performance loss. Time to hydrate!"
];

function getRandomSmartQuote(): string {
    return SMART_REMINDER_QUOTES[Math.floor(Math.random() * SMART_REMINDER_QUOTES.length)];
}

async function showSmartReminder(context: vscode.ExtensionContext) {
    const quote = getRandomSmartQuote();
    
    const action = await vscode.window.showInformationMessage(
        `💧 Friendly Reminder: ${quote}`,
        { modal: false },
        '💧 Log Water Intake',
        'Dismiss'
    );

    if (action === '💧 Log Water Intake') {
        // Execute drank water command which will handle timer restart if needed
        vscode.commands.executeCommand('waterReminder.drankWater');
    }
}

async function showInactivityAlert(context: vscode.ExtensionContext, inactiveMinutes: number) {
    // Get random smart reminder quote
    const randomQuote = getRandomSmartQuote();

    // Show notification with random quote
    const action = await vscode.window.showWarningMessage(
        randomQuote,
        { modal: false },
        '💧 Log Water Intake',
        'Remind Me Later',
        'Open Water Tracker'
    );

    if (action === '💧 Log Water Intake') {
        vscode.commands.executeCommand('waterReminder.drankWater');
    } else if (action === 'Remind Me Later') {
        // Reset alert so it shows again in 30 minutes if still inactive
        vscode.window.showInformationMessage('⏰ Will remind you again in 30 minutes if you don\'t drink water');
    } else if (action === 'Open Water Tracker') {
        vscode.commands.executeCommand('waterReminder.openRetroView');
    }
}

function showAchievementsQuickPick() {
    const achievements = achievementManager.getAchievements();
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);
    
    const items: vscode.QuickPickItem[] = [
        {
            label: '$(trophy) Achievement Progress',
            description: `${unlocked.length}/${achievements.length} Unlocked (${achievementManager.getProgressPercentage()}%)`,
            kind: vscode.QuickPickItemKind.Separator
        },
        ...unlocked.map(ach => ({
            label: `${ach.icon} ${ach.title}`,
            description: ach.description,
            detail: ach.unlockedAt ? `Unlocked: ${new Date(ach.unlockedAt).toLocaleDateString()}` : 'Unlocked'
        })),
        {
            label: '$(lock) Locked Achievements',
            kind: vscode.QuickPickItemKind.Separator
        },
        ...locked.map(ach => ({
            label: `🔒 ${ach.title}`,
            description: ach.description,
            detail: `Requirement: ${ach.requirement}`
        }))
    ];
    
    vscode.window.showQuickPick(items, {
        title: '🏆 Water Reminder Achievements',
        placeHolder: 'Keep hydrating to unlock more achievements!'
    });
}

export function deactivate() {
    if (timerManager) {
        timerManager.dispose();
    }
    if (achievementManager) {
        achievementManager.dispose();
    }
    if (medicineTimerManager) {
        medicineTimerManager.dispose();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
