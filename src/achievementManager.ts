import * as vscode from 'vscode';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    requirement: number;
    unlocked: boolean;
    unlockedAt?: number;
}

export class AchievementManager {
    private achievements: Achievement[] = [];
    private readonly onAchievementUnlockedEmitter = new vscode.EventEmitter<Achievement>();
    public readonly onAchievementUnlocked = this.onAchievementUnlockedEmitter.event;

    constructor(private context: vscode.ExtensionContext) {
        this.initializeAchievements();
        this.loadProgress();
    }

    private initializeAchievements() {
        this.achievements = [
            // Streak Achievements
            { id: 'streak_3', title: 'Getting Started', description: 'Maintain 3-day streak', icon: '🔥', requirement: 3, unlocked: false },
            { id: 'streak_7', title: 'Week Warrior', description: 'Maintain 7-day streak', icon: '⭐', requirement: 7, unlocked: false },
            { id: 'streak_30', title: 'Monthly Master', description: 'Maintain 30-day streak', icon: '👑', requirement: 30, unlocked: false },
            { id: 'streak_100', title: 'Century Champion', description: 'Maintain 100-day streak', icon: '💎', requirement: 100, unlocked: false },
            
            // Total Glasses Achievements
            { id: 'total_50', title: 'First Steps', description: 'Drink 50 glasses total', icon: '💧', requirement: 50, unlocked: false },
            { id: 'total_100', title: 'Hydration Hero', description: 'Drink 100 glasses total', icon: '🌊', requirement: 100, unlocked: false },
            { id: 'total_500', title: 'Water Wizard', description: 'Drink 500 glasses total', icon: '🧙', requirement: 500, unlocked: false },
            { id: 'total_1000', title: 'Legendary Hydrator', description: 'Drink 1000 glasses total', icon: '🏆', requirement: 1000, unlocked: false },
            
            // Daily Goal Achievements
            { id: 'goal_7', title: 'Consistent', description: 'Meet daily goal 7 times', icon: '🎯', requirement: 7, unlocked: false },
            { id: 'goal_30', title: 'Dedicated', description: 'Meet daily goal 30 times', icon: '🌟', requirement: 30, unlocked: false },
            { id: 'goal_100', title: 'Unstoppable', description: 'Meet daily goal 100 times', icon: '⚡', requirement: 100, unlocked: false },
            
            // Special Achievements
            { id: 'early_bird', title: 'Early Bird', description: 'Start hydration before 8 AM', icon: '🌅', requirement: 1, unlocked: false },
            { id: 'night_owl', title: 'Night Owl', description: 'Drink water after 10 PM', icon: '🌙', requirement: 1, unlocked: false },
            { id: 'overachiever', title: 'Overachiever', description: 'Exceed daily goal by 50%', icon: '🚀', requirement: 1, unlocked: false }
        ];
    }

    private loadProgress() {
        const saved = this.context.globalState.get<Achievement[]>('achievements', []);
        if (saved.length > 0) {
            // Merge saved progress with current achievements
            this.achievements.forEach(ach => {
                const savedAch = saved.find(s => s.id === ach.id);
                if (savedAch) {
                    ach.unlocked = savedAch.unlocked;
                    ach.unlockedAt = savedAch.unlockedAt;
                }
            });
        }
    }

    private saveProgress() {
        this.context.globalState.update('achievements', this.achievements);
    }

    public checkAchievements(stats: {
        currentStreak: number;
        totalGlasses: number;
        dailyCount: number;
        dailyGoal: number;
        goalsMetCount: number;
    }): Achievement[] {
        const newlyUnlocked: Achievement[] = [];
        const now = Date.now();
        const hour = new Date().getHours();

        // Check streak achievements
        const streakAchievements = this.achievements.filter(a => a.id.startsWith('streak_'));
        streakAchievements.forEach(ach => {
            if (!ach.unlocked && stats.currentStreak >= ach.requirement) {
                ach.unlocked = true;
                ach.unlockedAt = now;
                newlyUnlocked.push(ach);
                this.onAchievementUnlockedEmitter.fire(ach);
            }
        });

        // Check total glasses achievements
        const totalAchievements = this.achievements.filter(a => a.id.startsWith('total_'));
        totalAchievements.forEach(ach => {
            if (!ach.unlocked && stats.totalGlasses >= ach.requirement) {
                ach.unlocked = true;
                ach.unlockedAt = now;
                newlyUnlocked.push(ach);
                this.onAchievementUnlockedEmitter.fire(ach);
            }
        });

        // Check goal-based achievements
        const goalAchievements = this.achievements.filter(a => a.id.startsWith('goal_'));
        goalAchievements.forEach(ach => {
            if (!ach.unlocked && stats.goalsMetCount >= ach.requirement) {
                ach.unlocked = true;
                ach.unlockedAt = now;
                newlyUnlocked.push(ach);
                this.onAchievementUnlockedEmitter.fire(ach);
            }
        });

        // Check special achievements
        const earlyBird = this.achievements.find(a => a.id === 'early_bird');
        if (earlyBird && !earlyBird.unlocked && hour < 8) {
            earlyBird.unlocked = true;
            earlyBird.unlockedAt = now;
            newlyUnlocked.push(earlyBird);
            this.onAchievementUnlockedEmitter.fire(earlyBird);
        }

        const nightOwl = this.achievements.find(a => a.id === 'night_owl');
        if (nightOwl && !nightOwl.unlocked && hour >= 22) {
            nightOwl.unlocked = true;
            nightOwl.unlockedAt = now;
            newlyUnlocked.push(nightOwl);
            this.onAchievementUnlockedEmitter.fire(nightOwl);
        }

        const overachiever = this.achievements.find(a => a.id === 'overachiever');
        if (overachiever && !overachiever.unlocked && stats.dailyCount >= stats.dailyGoal * 1.5) {
            overachiever.unlocked = true;
            overachiever.unlockedAt = now;
            newlyUnlocked.push(overachiever);
            this.onAchievementUnlockedEmitter.fire(overachiever);
        }

        if (newlyUnlocked.length > 0) {
            this.saveProgress();
        }

        return newlyUnlocked;
    }

    public getAchievements(): Achievement[] {
        return [...this.achievements];
    }

    public getUnlockedCount(): number {
        return this.achievements.filter(a => a.unlocked).length;
    }

    public getTotalCount(): number {
        return this.achievements.length;
    }

    public getProgressPercentage(): number {
        return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }

    public dispose() {
        this.onAchievementUnlockedEmitter.dispose();
    }
}
