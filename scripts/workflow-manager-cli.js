const { default: inquirer } = require('inquirer');
const chalk = require('chalk');
const ConfigManager = require('./config-manager');
const config = new ConfigManager();

async function run() {
    console.log(chalk.cyan.bold('\n⌨️ Echo Workflow Manager\n'));

    const workflows = config.get('workflows') || {};
    const workflowNames = Object.keys(workflows);

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '📋 List Workflows', value: 'list' },
                { name: '➕ Create New Workflow', value: 'create' },
                { name: '🗑️  Delete Workflow', value: 'delete' },
                { name: '⬅️  Back', value: 'back' }
            ]
        }
    ]);

    if (action === 'back') return;

    if (action === 'list') {
        if (workflowNames.length === 0) {
            console.log(chalk.gray('  No workflows defined yet.'));
        } else {
            console.log(chalk.cyan('\n📜 Defined Workflows:\n'));
            workflowNames.forEach(name => {
                const actions = workflows[name];
                console.log(`  ${chalk.bold(name)} (${actions.length} actions)`);
                actions.forEach(a => console.log(`    - ${a.type}: ${a.value}`));
                console.log('');
            });
        }
    } else if (action === 'create') {
        const { name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Workflow Name (e.g., Morning):',
                validate: (input) => input.trim() ? true : 'Name cannot be empty.'
            }
        ]);

        const actions = [];
        let adding = true;

        while (adding) {
            const { type } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: `Add action to "${name}" (Current: ${actions.length}):`,
                    choices: [
                        { name: '🚀 Launch App', value: 'app' },
                        { name: '🌐 Open URL', value: 'url' },
                        { name: '🔍 Web Search', value: 'search' },
                        { name: '💻 Shell Command', value: 'command' },
                        { name: '✅ Finish Workflow', value: 'finish' }
                    ]
                }
            ]);

            if (type === 'finish') {
                if (actions.length === 0) {
                    console.log(chalk.yellow('⚠️  Cannot create an empty workflow.'));
                    continue;
                }
                adding = false;
            } else {
                const { value } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'value',
                        message: `Enter ${type} value:`,
                        validate: (input) => input.trim() ? true : 'Value cannot be empty.'
                    }
                ]);
                actions.push({ type, value });
            }
        }

        workflows[name] = actions;
        config.set('workflows', workflows);
        console.log(chalk.green(`\n✓ Workflow "${name}" created successfully!\n`));
        console.log(chalk.gray(`You can trigger it by saying: "Echo, run ${name} workflow"\n`));

    } else if (action === 'delete') {
        if (workflowNames.length === 0) {
            console.log(chalk.gray('  No workflows to delete.'));
            return;
        }

        const { toDelete } = await inquirer.prompt([
            {
                type: 'list',
                name: 'toDelete',
                message: 'Select workflow to delete:',
                choices: [...workflowNames, 'Cancel']
            }
        ]);

        if (toDelete === 'Cancel') return;

        delete workflows[toDelete];
        config.set('workflows', workflows);
        console.log(chalk.green(`✓ Workflow "${toDelete}" deleted.`));
    }

    // Loop back
    await run();
}

module.exports = { run };
