const inquirer = require('inquirer');
const chalk = require('chalk');
const Scheduler = require('./scheduler');

const scheduler = new Scheduler();

async function run() {
    console.log(chalk.cyan.bold('\n⏰ Echo Scheduler & Reminders\n'));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '📋 View Scheduled Tasks', value: 'list' },
                { name: '➕ Create Reminder', value: 'reminder' },
                { name: '🔄 Schedule Workflow', value: 'workflow' },
                { name: '⏱️  Schedule Command', value: 'command' },
                { name: '✏️  Edit Task', value: 'edit' },
                { name: '🗑️  Delete Task', value: 'delete' },
                { name: '🔘 Toggle Task On/Off', value: 'toggle' },
                { name: '⬅️  Back', value: 'back' }
            ]
        }
    ]);

    if (action === 'back') return;

    switch (action) {
        case 'list':
            await listTasks();
            break;
        case 'reminder':
            await createReminder();
            break;
        case 'workflow':
            await scheduleWorkflow();
            break;
        case 'command':
            await scheduleCommand();
            break;
        case 'edit':
            await editTask();
            break;
        case 'delete':
            await deleteTask();
            break;
        case 'toggle':
            await toggleTask();
            break;
    }

    // Loop back
    await run();
}

async function listTasks() {
    const tasks = scheduler.getTasks();

    if (tasks.length === 0) {
        console.log(chalk.gray('\n  No scheduled tasks yet.\n'));
        return;
    }

    console.log(chalk.cyan('\n📅 Scheduled Tasks:\n'));

    tasks.forEach(task => {
        const status = task.enabled ? chalk.green('✓ Active') : chalk.gray('✗ Disabled');
        const nextRun = task.enabled ? new Date(task.nextRun).toLocaleString() : 'N/A';
        const recurring = task.recurring ? chalk.yellow(' (Recurring)') : '';

        console.log(`  ${chalk.bold(task.name)} [${status}]${recurring}`);
        console.log(`    Type: ${task.type}`);
        console.log(`    Schedule: ${task.schedule}`);
        console.log(`    Next Run: ${nextRun}`);
        console.log(`    Action: ${task.action}`);
        console.log(`    ID: ${chalk.gray(task.id)}\n`);
    });
}

async function createReminder() {
    console.log(chalk.cyan('\n⏰ Create New Reminder\n'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Reminder name:',
            validate: input => input.trim() ? true : 'Name is required'
        },
        {
            type: 'input',
            name: 'message',
            message: 'Reminder message:',
            validate: input => input.trim() ? true : 'Message is required'
        },
        {
            type: 'list',
            name: 'timeType',
            message: 'When should this reminder trigger?',
            choices: [
                { name: 'Specific time (e.g., "at 3pm", "tomorrow at 9am")', value: 'natural' },
                { name: 'Time from now (e.g., "in 30 minutes")', value: 'relative' },
                { name: 'Recurring (e.g., "daily at 8am")', value: 'recurring' },
                { name: 'Custom schedule', value: 'custom' }
            ]
        }
    ]);

    let schedule, recurring = false;

    if (answers.timeType === 'natural' || answers.timeType === 'relative' || answers.timeType === 'recurring') {
        const { timeInput } = await inquirer.prompt([
            {
                type: 'input',
                name: 'timeInput',
                message: 'Enter time (e.g., "at 3pm", "in 30 minutes", "daily at 8am"):',
                validate: input => input.trim() ? true : 'Time is required'
            }
        ]);

        const parsed = scheduler.parseNaturalTime(timeInput);
        schedule = parsed.schedule;
        recurring = parsed.recurring;
    } else {
        const { customSchedule, isRecurring } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customSchedule',
                message: 'Enter schedule (HH:MM, ISO date, or "daily HH:MM"):',
                validate: input => input.trim() ? true : 'Schedule is required'
            },
            {
                type: 'confirm',
                name: 'isRecurring',
                message: 'Is this a recurring task?',
                default: false
            }
        ]);

        schedule = customSchedule;
        recurring = isRecurring;
    }

    const task = scheduler.addTask({
        name: answers.name,
        type: 'reminder',
        schedule: schedule,
        action: answers.message,
        recurring: recurring
    });

    console.log(chalk.green(`\n✓ Reminder created successfully!`));
    console.log(chalk.gray(`  Next run: ${new Date(task.nextRun).toLocaleString()}\n`));
}

async function scheduleWorkflow() {
    const ConfigManager = require('./config-manager');
    const config = new ConfigManager();
    const workflows = config.get('workflows') || {};
    const workflowNames = Object.keys(workflows);

    if (workflowNames.length === 0) {
        console.log(chalk.yellow('\n⚠️  No workflows available. Create one first with "echo workflows".\n'));
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'workflow',
            message: 'Select workflow to schedule:',
            choices: workflowNames
        },
        {
            type: 'input',
            name: 'name',
            message: 'Task name:',
            default: (answers) => `Run ${answers.workflow} workflow`
        },
        {
            type: 'input',
            name: 'schedule',
            message: 'Schedule (e.g., "daily at 9am", "at 3pm"):',
            validate: input => input.trim() ? true : 'Schedule is required'
        }
    ]);

    const parsed = scheduler.parseNaturalTime(answers.schedule);

    const task = scheduler.addTask({
        name: answers.name,
        type: 'workflow',
        schedule: parsed.schedule,
        action: answers.workflow,
        recurring: parsed.recurring
    });

    console.log(chalk.green(`\n✓ Workflow scheduled successfully!`));
    console.log(chalk.gray(`  Next run: ${new Date(task.nextRun).toLocaleString()}\n`));
}

async function scheduleCommand() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Task name:',
            validate: input => input.trim() ? true : 'Name is required'
        },
        {
            type: 'input',
            name: 'command',
            message: 'Command to execute:',
            validate: input => input.trim() ? true : 'Command is required'
        },
        {
            type: 'input',
            name: 'schedule',
            message: 'Schedule (e.g., "daily at 9am", "hourly"):',
            validate: input => input.trim() ? true : 'Schedule is required'
        }
    ]);

    const parsed = scheduler.parseNaturalTime(answers.schedule);

    const task = scheduler.addTask({
        name: answers.name,
        type: 'command',
        schedule: parsed.schedule,
        action: answers.command,
        recurring: parsed.recurring
    });

    console.log(chalk.green(`\n✓ Command scheduled successfully!`));
    console.log(chalk.gray(`  Next run: ${new Date(task.nextRun).toLocaleString()}\n`));
}

async function editTask() {
    const tasks = scheduler.getTasks();

    if (tasks.length === 0) {
        console.log(chalk.gray('\n  No tasks to edit.\n'));
        return;
    }

    const { taskId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'taskId',
            message: 'Select task to edit:',
            choices: tasks.map(t => ({
                name: `${t.name} (${t.type}) - ${t.schedule}`,
                value: t.id
            }))
        }
    ]);

    const task = scheduler.getTask(taskId);

    const updates = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'New name (leave empty to keep current):',
            default: task.name
        },
        {
            type: 'input',
            name: 'schedule',
            message: 'New schedule (leave empty to keep current):',
            default: task.schedule
        }
    ]);

    scheduler.updateTask(taskId, {
        name: updates.name || task.name,
        schedule: updates.schedule || task.schedule
    });

    console.log(chalk.green('\n✓ Task updated successfully!\n'));
}

async function deleteTask() {
    const tasks = scheduler.getTasks();

    if (tasks.length === 0) {
        console.log(chalk.gray('\n  No tasks to delete.\n'));
        return;
    }

    const { taskId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'taskId',
            message: 'Select task to delete:',
            choices: [...tasks.map(t => ({
                name: `${t.name} (${t.type})`,
                value: t.id
            })), { name: 'Cancel', value: null }]
        }
    ]);

    if (!taskId) return;

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this task?',
            default: false
        }
    ]);

    if (confirm) {
        scheduler.deleteTask(taskId);
        console.log(chalk.green('\n✓ Task deleted successfully!\n'));
    }
}

async function toggleTask() {
    const tasks = scheduler.getTasks();

    if (tasks.length === 0) {
        console.log(chalk.gray('\n  No tasks to toggle.\n'));
        return;
    }

    const { taskId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'taskId',
            message: 'Select task to enable/disable:',
            choices: tasks.map(t => ({
                name: `${t.name} [${t.enabled ? chalk.green('Active') : chalk.gray('Disabled')}]`,
                value: t.id
            }))
        }
    ]);

    const enabled = scheduler.toggleTask(taskId);
    console.log(chalk.green(`\n✓ Task ${enabled ? 'enabled' : 'disabled'} successfully!\n`));
}

module.exports = { run };
