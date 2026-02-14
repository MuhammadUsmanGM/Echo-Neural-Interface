/**
 * Reminder Plugin for Echo AI Agent
 * Allows users to create reminders through voice commands
 */

const Scheduler = require('../scripts/scheduler');

module.exports = {
    name: 'reminder-plugin',
    version: '1.0.0',
    description: 'Create and manage reminders through voice commands',
    author: 'Echo Team',

    init: async function() {
        console.log('Reminder plugin initialized!');
        this.scheduler = new Scheduler();
    },

    commands: {
        /**
         * Create a reminder
         * Usage: "Echo, remind me to call John at 3pm"
         * Usage: "Echo, set a reminder for meeting in 30 minutes"
         */
        remind_me: async function(args) {
            try {
                // Parse the reminder from natural language
                // Expected format: "to [message] at/in [time]"
                const input = args || '';
                
                let message = '';
                let timeStr = '';
                
                // Try to extract message and time
                if (input.includes(' at ')) {
                    const parts = input.split(' at ');
                    message = parts[0].replace(/^to\s+/, '').trim();
                    timeStr = 'at ' + parts[1].trim();
                } else if (input.includes(' in ')) {
                    const parts = input.split(' in ');
                    message = parts[0].replace(/^to\s+/, '').trim();
                    timeStr = 'in ' + parts[1].trim();
                } else {
                    // Default: reminder in 1 hour
                    message = input.replace(/^to\s+/, '').trim();
                    timeStr = 'in 1 hour';
                }

                if (!message) {
                    return {
                        success: false,
                        message: 'Please specify what you want to be reminded about.'
                    };
                }

                const scheduler = new Scheduler();
                const parsed = scheduler.parseNaturalTime(timeStr);
                
                const task = scheduler.addTask({
                    name: `Reminder: ${message}`,
                    type: 'reminder',
                    schedule: parsed.schedule,
                    action: message,
                    recurring: parsed.recurring
                });

                const nextRun = new Date(task.nextRun).toLocaleString();
                
                return {
                    success: true,
                    message: `Reminder set for ${nextRun}: ${message}`
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Failed to create reminder: ' + error.message
                };
            }
        },

        /**
         * List active reminders
         * Usage: "Echo, show my reminders"
         */
        show_reminders: async function(args) {
            try {
                const scheduler = new Scheduler();
                const tasks = scheduler.getTasks({ enabled: true, type: 'reminder' });

                if (tasks.length === 0) {
                    return {
                        success: true,
                        message: 'You have no active reminders.'
                    };
                }

                const reminderList = tasks.map((task, index) => {
                    const nextRun = new Date(task.nextRun).toLocaleString();
                    return `${index + 1}. ${task.action} - ${nextRun}`;
                }).join('. ');

                return {
                    success: true,
                    message: `You have ${tasks.length} reminder${tasks.length > 1 ? 's' : ''}: ${reminderList}`
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Failed to retrieve reminders: ' + error.message
                };
            }
        },

        /**
         * Clear all reminders
         * Usage: "Echo, clear all reminders"
         */
        clear_reminders: async function(args) {
            try {
                const scheduler = new Scheduler();
                const tasks = scheduler.getTasks({ type: 'reminder' });
                
                tasks.forEach(task => {
                    scheduler.deleteTask(task.id);
                });

                return {
                    success: true,
                    message: `Cleared ${tasks.length} reminder${tasks.length !== 1 ? 's' : ''}.`
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Failed to clear reminders: ' + error.message
                };
            }
        }
    },

    commandDescriptions: {
        remind_me: 'Create a reminder with natural language (e.g., "remind me to call John at 3pm")',
        show_reminders: 'Show all active reminders',
        clear_reminders: 'Clear all reminders'
    }
};
