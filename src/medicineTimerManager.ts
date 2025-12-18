import * as vscode from 'vscode';
import { MedicineStorageManager } from './medicineStorageManager';

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    times: string[]; // e.g., ["08:00", "14:00", "20:00"]
    notes: string;
    duration: string;
    colorTag: string;
    icon: string;
    isActive: boolean;
    createdAt: number;
}

interface ScheduledNotification {
    medicineId: string;
    medicineName: string;
    scheduledTime: string;
    notificationTime: Date;
    preNotificationTime: Date;
    timeoutId?: NodeJS.Timeout;
    preTimeoutId?: NodeJS.Timeout;
}

export class MedicineTimerManager {
    private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
    private checkInterval: NodeJS.Timeout | undefined;
    private readonly PRE_NOTIFICATION_MINUTES = 5;

    private readonly onMedicineReminderEmitter = new vscode.EventEmitter<{
        medicine: Medicine;
        isPreReminder: boolean;
        minutesUntil?: number;
    }>();
    public readonly onMedicineReminder = this.onMedicineReminderEmitter.event;

    constructor(
        private context: vscode.ExtensionContext,
        private storageManager: MedicineStorageManager
    ) {
        this.startMedicineScheduler();
    }

    /**
     * Initialize medicine scheduler - checks every minute
     */
    private startMedicineScheduler(): void {
        // Check immediately
        this.checkAndScheduleReminders();

        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkAndScheduleReminders();
        }, 60000); // 60 seconds

        console.log('[MedicineTimer] Scheduler started');
    }

    /**
     * Check all medicines and schedule upcoming reminders
     */
    async checkAndScheduleReminders(): Promise<void> {
        try {
            const medicines = await this.storageManager.loadMedicines();
            const activeMedicines = medicines.filter((m: Medicine) => m.isActive);

            console.log('[MedicineTimer] Checking', activeMedicines.length, 'active medicines');

            for (const medicine of activeMedicines) {
                for (const timeSlot of medicine.times) {
                    await this.scheduleNotificationForTime(medicine, timeSlot);
                }
            }

            // Clean up old scheduled notifications
            this.cleanupOldNotifications();
        } catch (error) {
            console.error('[MedicineTimer] Error checking reminders:', error);
        }
    }

    /**
     * Schedule notification for a specific medicine time
     */
    private async scheduleNotificationForTime(medicine: Medicine, timeSlot: string): Promise<void> {
        const notificationKey = `${medicine.id}-${timeSlot}`;

        // Skip if already scheduled
        if (this.scheduledNotifications.has(notificationKey)) {
            return;
        }

        const now = new Date();
        const [hours, minutes] = timeSlot.split(':').map(Number);

        // Create notification time for today
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }

        // Calculate pre-notification time (5 minutes before)
        const preNotificationTime = new Date(notificationTime.getTime() - this.PRE_NOTIFICATION_MINUTES * 60000);

        const millisecondsUntilNotification = notificationTime.getTime() - now.getTime();
        const millisecondsUntilPreNotification = preNotificationTime.getTime() - now.getTime();

        // Only schedule if within next 24 hours
        if (millisecondsUntilNotification > 24 * 60 * 60 * 1000) {
            return;
        }

        const scheduled: ScheduledNotification = {
            medicineId: medicine.id,
            medicineName: medicine.name,
            scheduledTime: timeSlot,
            notificationTime,
            preNotificationTime
        };

        // Schedule pre-notification (5 minutes before)
        if (millisecondsUntilPreNotification > 0) {
            scheduled.preTimeoutId = setTimeout(() => {
                this.sendPreNotification(medicine);
            }, millisecondsUntilPreNotification);
        }

        // Schedule main notification
        if (millisecondsUntilNotification > 0) {
            scheduled.timeoutId = setTimeout(() => {
                this.sendMainNotification(medicine, timeSlot);
                // Remove from scheduled after notification sent
                this.scheduledNotifications.delete(notificationKey);
            }, millisecondsUntilNotification);
        }

        this.scheduledNotifications.set(notificationKey, scheduled);

        console.log(`[MedicineTimer] Scheduled ${medicine.name} for ${timeSlot} (in ${Math.round(millisecondsUntilNotification / 60000)} minutes)`);
    }

    /**
     * Send 5-minute pre-notification
     */
    private sendPreNotification(medicine: Medicine): void {
        console.log(`[MedicineTimer] Sending pre-notification for ${medicine.name}`);

        vscode.window.showInformationMessage(
            `⏰ Reminder: Take "${medicine.name}" in ${this.PRE_NOTIFICATION_MINUTES} minutes`,
            'Remind Me Later',
            'Got It'
        ).then(selection => {
            if (selection === 'Remind Me Later') {
                // Snooze for 5 more minutes
                setTimeout(() => {
                    this.sendPreNotification(medicine);
                }, 5 * 60000);
            }
        });

        // Emit event for webview
        this.onMedicineReminderEmitter.fire({
            medicine,
            isPreReminder: true,
            minutesUntil: this.PRE_NOTIFICATION_MINUTES
        });
    }

    /**
     * Send main notification at scheduled time
     */
    private sendMainNotification(medicine: Medicine, timeSlot: string): void {
        console.log(`[MedicineTimer] Sending main notification for ${medicine.name} at ${timeSlot}`);

        const message = medicine.notes
            ? `💊 Time to take "${medicine.name}" (${medicine.dosage})\n📝 ${medicine.notes}`
            : `💊 Time to take "${medicine.name}" (${medicine.dosage})`;

        vscode.window.showWarningMessage(
            message,
            { modal: false },
            'Mark as Taken',
            'Snooze 10 min',
            'Skip'
        ).then(selection => {
            if (selection === 'Mark as Taken') {
                this.markMedicineAsTaken(medicine.id, timeSlot);
                vscode.window.showInformationMessage(`✅ Marked "${medicine.name}" as taken!`);
            } else if (selection === 'Snooze 10 min') {
                // Snooze for 10 minutes
                setTimeout(() => {
                    this.sendMainNotification(medicine, timeSlot);
                }, 10 * 60000);
                vscode.window.showInformationMessage(`⏰ Will remind you about "${medicine.name}" in 10 minutes`);
            } else if (selection === 'Skip') {
                console.log(`[MedicineTimer] User skipped ${medicine.name} at ${timeSlot}`);
            }
        });

        // Play sound notification
        this.playNotificationSound();

        // Emit event for webview
        this.onMedicineReminderEmitter.fire({
            medicine,
            isPreReminder: false
        });
    }

    /**
     * Mark medicine as taken (log in history)
     */
    private markMedicineAsTaken(medicineId: string, timeSlot: string): void {
        const history = this.context.globalState.get<any[]>('medicineHistory', []);
        
        history.push({
            medicineId,
            timeSlot,
            takenAt: new Date().toISOString(),
            status: 'taken'
        });

        // Keep only last 30 days of history
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filteredHistory = history.filter(entry => 
            new Date(entry.takenAt) > thirtyDaysAgo
        );

        this.context.globalState.update('medicineHistory', filteredHistory);
    }

    /**
     * Play notification sound
     */
    private playNotificationSound(): void {
        const config = vscode.workspace.getConfiguration('medicineReminder');
        const soundEnabled = config.get<boolean>('soundEnabled', true);

        if (soundEnabled) {
            // VS Code doesn't have built-in sound API, but notification itself makes sound
            console.log('[MedicineTimer] Playing notification sound (system default)');
        }
    }

    /**
     * Clean up old notifications that have passed
     */
    private cleanupOldNotifications(): void {
        const now = new Date();
        const keysToDelete: string[] = [];

        this.scheduledNotifications.forEach((scheduled, key) => {
            if (scheduled.notificationTime < now) {
                // Clear timeouts
                if (scheduled.timeoutId) {
                    clearTimeout(scheduled.timeoutId);
                }
                if (scheduled.preTimeoutId) {
                    clearTimeout(scheduled.preTimeoutId);
                }
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.scheduledNotifications.delete(key));

        if (keysToDelete.length > 0) {
            console.log(`[MedicineTimer] Cleaned up ${keysToDelete.length} old notifications`);
        }
    }

    /**
     * Reschedule all reminders (call after medicine changes)
     */
    async rescheduleAll(): Promise<void> {
        console.log('[MedicineTimer] Rescheduling all reminders');

        // Clear all existing timeouts
        this.scheduledNotifications.forEach(scheduled => {
            if (scheduled.timeoutId) {
                clearTimeout(scheduled.timeoutId);
            }
            if (scheduled.preTimeoutId) {
                clearTimeout(scheduled.preTimeoutId);
            }
        });

        this.scheduledNotifications.clear();

        // Reschedule
        await this.checkAndScheduleReminders();
    }

    /**
     * Get upcoming reminders
     */
    getUpcomingReminders(): ScheduledNotification[] {
        const now = new Date();
        return Array.from(this.scheduledNotifications.values())
            .filter(s => s.notificationTime > now)
            .sort((a, b) => a.notificationTime.getTime() - b.notificationTime.getTime());
    }

    /**
     * Get medicine adherence statistics
     */
    getMedicineStats(): any {
        const history = this.context.globalState.get<any[]>('medicineHistory', []);
        
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const recentHistory = history.filter(entry => 
            new Date(entry.takenAt) > last7Days
        );

        const takenCount = recentHistory.filter(e => e.status === 'taken').length;
        const skippedCount = recentHistory.filter(e => e.status === 'skipped').length;
        
        const adherenceRate = recentHistory.length > 0
            ? Math.round((takenCount / recentHistory.length) * 100)
            : 0;

        return {
            totalTaken: takenCount,
            totalSkipped: skippedCount,
            adherenceRate,
            last7Days: recentHistory.length
        };
    }

    /**
     * Cleanup on disposal
     */
    dispose(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Clear all scheduled timeouts
        this.scheduledNotifications.forEach(scheduled => {
            if (scheduled.timeoutId) {
                clearTimeout(scheduled.timeoutId);
            }
            if (scheduled.preTimeoutId) {
                clearTimeout(scheduled.preTimeoutId);
            }
        });

        this.scheduledNotifications.clear();
        console.log('[MedicineTimer] Disposed');
    }
}
