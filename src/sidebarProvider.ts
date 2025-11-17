import * as vscode from 'vscode';
import { TimerManager } from './timerManager';

export class WaterReminderViewProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private timerManager: TimerManager) {
        // Listen to timer updates
        this.timerManager.onTimerUpdate(() => {
            this.refresh();
        });

        this.timerManager.onDailyCountUpdate(() => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            // Root level items
            const items: TreeItem[] = [];

            // Timer Display
            const remainingSeconds = this.timerManager.getRemainingSeconds();
            const timeDisplay = this.timerManager.formatTime(remainingSeconds);
            const isRunning = this.timerManager.getIsRunning();
            const isPaused = this.timerManager.getIsPaused();

            let timerStatus = '⏸️ Paused';
            if (!isRunning) {
                timerStatus = '⏹️ Stopped';
            } else if (!isPaused) {
                timerStatus = '⏱️ Running';
            }

            const timerItem = new TreeItem(
                `⏰ ${timeDisplay}`,
                vscode.TreeItemCollapsibleState.None
            );
            timerItem.description = timerStatus;
            timerItem.contextValue = 'timer';
            items.push(timerItem);

            // Daily Progress
            const dailyCount = this.timerManager.getDailyCount();
            const dailyGoal = this.timerManager.getDailyGoal();
            const progressBar = this.createProgressBar(dailyCount, dailyGoal);
            
            const dailyItem = new TreeItem(
                `💧 Today: ${dailyCount}/${dailyGoal}`,
                vscode.TreeItemCollapsibleState.None
            );
            dailyItem.description = progressBar;
            dailyItem.contextValue = 'daily';
            items.push(dailyItem);

            // Control Buttons
            const separator = new TreeItem('───────────', vscode.TreeItemCollapsibleState.None);
            separator.contextValue = 'separator';
            items.push(separator);

            if (!isRunning || isPaused) {
                const startItem = new TreeItem(
                    isPaused ? '▶️ Resume Timer' : '▶️ Start Timer',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'waterReminder.startTimer',
                        title: 'Start Timer'
                    }
                );
                startItem.contextValue = 'control';
                items.push(startItem);
            } else {
                const pauseItem = new TreeItem(
                    '⏸️ Pause Timer',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'waterReminder.pauseTimer',
                        title: 'Pause Timer'
                    }
                );
                pauseItem.contextValue = 'control';
                items.push(pauseItem);
            }

            const resetItem = new TreeItem(
                '🔄 Reset Timer',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'waterReminder.resetTimer',
                    title: 'Reset Timer'
                }
            );
            resetItem.contextValue = 'control';
            items.push(resetItem);

            const drankItem = new TreeItem(
                '💧 Log Water Intake',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'waterReminder.drankWater',
                    title: '💧 Log Water Intake'
                }
            );
            drankItem.contextValue = 'control';
            items.push(drankItem);

            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }

    private createProgressBar(current: number, goal: number): string {
        const percentage = Math.min(100, Math.round((current / goal) * 100));
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}
