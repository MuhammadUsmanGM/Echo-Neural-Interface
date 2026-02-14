const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

/**
 * Scheduler for time-based tasks and reminders
 * Supports cron-like scheduling and one-time reminders
 */
class Scheduler {
    constructor() {
        this.schedulerDir = path.join(os.homedir(), '.echo-memory');
        this.tasksFile = path.join(this.schedulerDir, 'scheduled-tasks.json');
        this.tasks = [];
        this.intervals = new Map();
        this.init();
    }

    init() {
        if (!fs.existsSync(this.schedulerDir)) {
            fs.mkdirSync(this.schedulerDir, { recursive: true });
        }
        this.loadTasks();
        this.startScheduler();
    }

    /**
     * Load tasks from disk
     */
    loadTasks() {
        if (fs.existsSync(this.tasksFile)) {
            try {
                const data = fs.readFileSync(this.tasksFile, 'utf8');
                this.tasks = JSON.parse(data);
            } catch (error) {
                console.error('Error loading scheduled tasks:', error);
                this.tasks = [];
            }
        }
    }

    /**
     * Save tasks to disk
     */
    saveTasks() {
        try {
            fs.writeFileSync(this.tasksFile, JSON.stringify(this.tasks, null, 2));
        } catch (error) {
            console.error('Error saving scheduled tasks:', error);
        }
    }

    /**
     * Add a new scheduled task
     * @param {Object} task - Task object
     * @param {string} task.name - Task name
     * @param {string} task.type - 'reminder', 'workflow', 'command'
     * @param {string} task.schedule - Cron expression or ISO date string
     * @param {string} task.action - Action to perform
     * @param {boolean} task.recurring - Whether task repeats
     */
    addTask(task) {
        const newTask = {
            id: this.generateId(),
            name: task.name,
            type: task.type || 'reminder',
            schedule: task.schedule,
            action: task.action,
            recurring: task.recurring || false,
            enabled: true,
            createdAt: new Date().toISOString(),
            lastRun: null,
            nextRun: this.calculateNextRun(task.schedule)
        };

        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    /**
     * Generate unique task ID
     */
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    /**
     * Calculate next run time from schedule
     * Supports: ISO date strings, time strings (HH:MM), and simple cron
     */
    calculateNextRun(schedule) {
        const now = new Date();

        // ISO date string (one-time)
        if (schedule.includes('T') || schedule.includes('Z')) {
            return new Date(schedule).toISOString();
        }

        // Time string (HH:MM) - today or tomorrow
        if (/^\d{1,2}:\d{2}$/.test(schedule)) {
            const [hours, minutes] = schedule.split(':').map(Number);
            const nextRun = new Date(now);
            nextRun.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            return nextRun.toISOString();
        }

        // Simple cron: "daily HH:MM", "hourly", "every X minutes"
        if (schedule.startsWith('daily ')) {
            const time = schedule.replace('daily ', '');
            const [hours, minutes] = time.split(':').map(Number);
            const nextRun = new Date(now);
            nextRun.setHours(hours, minutes, 0, 0);
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            return nextRun.toISOString();
        }

        if (schedule === 'hourly') {
            const nextRun = new Date(now);
            nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
            return nextRun.toISOString();
        }

        if (schedule.startsWith('every ') && schedule.includes('minutes')) {
            const minutes = parseInt(schedule.match(/\d+/)[0]);
            const nextRun = new Date(now.getTime() + minutes * 60000);
            return nextRun.toISOString();
        }

        // Default: 1 hour from now
        return new Date(now.getTime() + 3600000).toISOString();
    }

    /**
     * Start the scheduler loop
     */
    startScheduler() {
        // Check every minute for tasks to run
        setInterval(() => {
            this.checkAndRunTasks();
        }, 60000); // 60 seconds

        // Also check immediately
        this.checkAndRunTasks();
    }

    /**
     * Check for tasks that need to run
     */
    checkAndRunTasks() {
        const now = new Date();

        this.tasks.forEach(task => {
            if (!task.enabled) return;

            const nextRun = new Date(task.nextRun);
            
            if (nextRun <= now) {
                this.executeTask(task);
                
                if (task.recurring) {
                    // Reschedule recurring task
                    task.lastRun = now.toISOString();
                    task.nextRun = this.calculateNextRun(task.schedule);
                } else {
                    // Disable one-time task
                    task.enabled = false;
                    task.lastRun = now.toISOString();
                }
                
                this.saveTasks();
            }
        });
    }

    /**
     * Execute a scheduled task
     */
    executeTask(task) {
        console.log(`Executing scheduled task: ${task.name}`);

        switch (task.type) {
            case 'reminder':
                this.showReminder(task);
                break;
            case 'workflow':
                this.runWorkflow(task);
                break;
            case 'command':
                this.runCommand(task);
                break;
            case 'notification':
                this.showNotification(task);
                break;
        }
    }

    /**
     * Show a reminder notification
     */
    showReminder(task) {
        const message = task.action || task.name;
        
        try {
            const NotificationManager = require('./notification-manager');
            const notifier = new NotificationManager();
            notifier.remind(message);
        } catch (error) {
            // Fallback to console if notification fails
            console.log(`\n⏰ REMINDER: ${message}\n`);
            
            // Try system notification as fallback
            if (process.platform === 'win32') {
                exec(`msg * "Echo Reminder: ${message}"`);
            } else if (process.platform === 'darwin') {
                exec(`osascript -e 'display notification "${message}" with title "Echo Reminder"'`);
            }
        }
    }

    /**
     * Show a notification
     */
    showNotification(task) {
        this.showReminder(task);
    }

    /**
     * Run a workflow
     */
    runWorkflow(task) {
        const ConfigManager = require('./config-manager');
        const config = new ConfigManager();
        const workflows = config.get('workflows') || {};
        const workflow = workflows[task.action];

        if (!workflow) {
            console.error(`Workflow "${task.action}" not found`);
            return;
        }

        console.log(`Running workflow: ${task.action}`);
        
        // Execute workflow actions
        const SystemActions = require('../services/system');
        workflow.forEach(async (action) => {
            switch (action.type) {
                case 'app':
                    await SystemActions.openApp(action.value);
                    break;
                case 'url':
                    await SystemActions.openUrl(action.value);
                    break;
                case 'search':
                    await SystemActions.searchWeb(action.value);
                    break;
                case 'command':
                    await SystemActions.executeCommand(action.value);
                    break;
            }
        });
    }

    /**
     * Run a system command
     */
    runCommand(task) {
        const SystemActions = require('../services/system');
        SystemActions.executeCommand(task.action);
    }

    /**
     * Get all tasks
     */
    getTasks(filter = {}) {
        let filtered = [...this.tasks];

        if (filter.enabled !== undefined) {
            filtered = filtered.filter(t => t.enabled === filter.enabled);
        }

        if (filter.type) {
            filtered = filtered.filter(t => t.type === filter.type);
        }

        return filtered;
    }

    /**
     * Get task by ID
     */
    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    /**
     * Update a task
     */
    updateTask(id, updates) {
        const task = this.getTask(id);
        if (!task) return false;

        Object.assign(task, updates);
        
        // Recalculate next run if schedule changed
        if (updates.schedule) {
            task.nextRun = this.calculateNextRun(updates.schedule);
        }

        this.saveTasks();
        return true;
    }

    /**
     * Delete a task
     */
    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return false;

        this.tasks.splice(index, 1);
        this.saveTasks();
        return true;
    }

    /**
     * Enable/disable a task
     */
    toggleTask(id) {
        const task = this.getTask(id);
        if (!task) return false;

        task.enabled = !task.enabled;
        this.saveTasks();
        return task.enabled;
    }

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
    }

    /**
     * Parse natural language time to schedule format
     * Examples: "in 5 minutes", "at 3pm", "tomorrow at 9am", "daily at 8am"
     */
    parseNaturalTime(input) {
        const now = new Date();
        const lower = input.toLowerCase();

        // "in X minutes"
        if (lower.includes('in') && lower.includes('minute')) {
            const minutes = parseInt(lower.match(/\d+/)[0]);
            return {
                schedule: `every ${minutes} minutes`,
                recurring: false
            };
        }

        // "in X hours"
        if (lower.includes('in') && lower.includes('hour')) {
            const hours = parseInt(lower.match(/\d+/)[0]);
            const targetTime = new Date(now.getTime() + hours * 3600000);
            return {
                schedule: targetTime.toISOString(),
                recurring: false
            };
        }

        // "at HH:MM" or "at Hpm/am"
        if (lower.includes('at')) {
            const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const meridiem = timeMatch[3];

                if (meridiem === 'pm' && hours < 12) hours += 12;
                if (meridiem === 'am' && hours === 12) hours = 0;

                const schedule = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                // Check if it's recurring (daily)
                const recurring = lower.includes('daily') || lower.includes('every day');
                
                return {
                    schedule: recurring ? `daily ${schedule}` : schedule,
                    recurring: recurring
                };
            }
        }

        // "tomorrow at HH:MM"
        if (lower.includes('tomorrow')) {
            const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const meridiem = timeMatch[3];

                if (meridiem === 'pm' && hours < 12) hours += 12;
                if (meridiem === 'am' && hours === 12) hours = 0;

                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(hours, minutes, 0, 0);

                return {
                    schedule: tomorrow.toISOString(),
                    recurring: false
                };
            }
        }

        // "daily at HH:MM"
        if (lower.includes('daily') || lower.includes('every day')) {
            const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const meridiem = timeMatch[3];

                if (meridiem === 'pm' && hours < 12) hours += 12;
                if (meridiem === 'am' && hours === 12) hours = 0;

                const schedule = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                return {
                    schedule: `daily ${schedule}`,
                    recurring: true
                };
            }
        }

        // Default: 1 hour from now
        return {
            schedule: new Date(now.getTime() + 3600000).toISOString(),
            recurring: false
        };
    }
}

module.exports = Scheduler;
