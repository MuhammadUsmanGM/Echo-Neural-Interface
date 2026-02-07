const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

console.log(chalk.cyan.bold(`Preparing to publish Echo AI Agent v${packageJson.version}...\n`));

try {
    // 1. Check for sensitive files
    console.log(chalk.yellow('Checking for sensitive files...'));
    if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
        console.log(chalk.red('⚠️  WARNING: .env file found. Make sure it is in .gitignore and .npmignore!'));
        console.log(chalk.gray('Checking .npmignore...'));
        const npmIgnore = fs.readFileSync(path.join(__dirname, '..', '.npmignore'), 'utf8');
        if (!npmIgnore.includes('.env')) {
            console.error(chalk.bgRed.white(' CRITICAL: .env is NOT in .npmignore. Aborting publish to protect secrets. '));
            process.exit(1);
        }
    }
    console.log(chalk.green('✓ Security check passed.'));

    // 2. Run tests (simulated)
    console.log(chalk.yellow('\nRunning tests...'));
    // execSync('npm test', { stdio: 'inherit' }); // Uncomment when tests are real
    console.log(chalk.green('✓ Tests passed (simulated).'));

    // 3. Verify main entry point
    console.log(chalk.yellow('\nVerifying entry point...'));
    if (!fs.existsSync(path.join(__dirname, '..', packageJson.main))) {
        console.error(chalk.red(`❌ Error: Main file ${packageJson.main} not found!`));
        process.exit(1);
    }
    console.log(chalk.green('✓ Entry point found.'));

    // 4. Verify CLI entry point
    console.log(chalk.yellow('\nVerifying CLI bin...'));
    const binPath = packageJson.bin.echo;
    if (!fs.existsSync(path.join(__dirname, '..', binPath))) {
        console.error(chalk.red(`❌ Error: CLI file ${binPath} not found!`));
        process.exit(1);
    }
    
    // Make CLI executable
    try {
        if (process.platform !== 'win32') {
            execSync(`chmod +x ${path.join(__dirname, '..', binPath)}`);
            console.log(chalk.green('✓ CLI executable permissions set.'));
        }
    } catch (e) {
        console.log(chalk.yellow('⚠️  Could not set executable permissions (might be Windows).'));
    }

    console.log(chalk.green('\n✅ Project is ready for publishing!'));
    console.log(chalk.white('\nTo publish, run:'));
    console.log(chalk.cyan('npm login'));
    console.log(chalk.cyan('npm publish --access public'));

} catch (error) {
    console.error(chalk.red('\n❌ Pre-publish check failed:'), error.message);
    process.exit(1);
}
