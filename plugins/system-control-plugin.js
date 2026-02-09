/**
 * System Control Plugin for Echo
 * 
 * Provides system information and control capabilities.
 * Demonstrates a more advanced "actual" plugin.
 */

const os = require('os');
const path = require('path');

module.exports = {
    name: 'system-control-plugin',
    version: '1.2.0',
    description: 'Advanced system monitoring and control plugin.',
    author: 'Echo Team',

    init: async function() {
        console.log('System Control Plugin initialized. Monitoring system...');
    },

    commands: {
        /**
         * Get system uptime in readable format
         */
        uptime: async function() {
            const uptimeSeconds = os.uptime();
            const days = Math.floor(uptimeSeconds / (3600 * 24));
            const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);

            let message = 'System uptime:: ';
            if (days > 0) message += `${days} days, `;
            if (hours > 0) message += `${hours} hours, `;
            message += `${minutes} minutes.`;

            return {
                success: true,
                message: message
            };
        },

        /**
         * Get basic memory usage
         */
        memory: async function() {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            
            const toGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);

            return {
                success: true,
                message: `Memory Usage: ${toGB(usedMem)} GB used of ${toGB(totalMem)} GB total.`
            };
        },

        /**
         * Get CPU information
         */
        cpu: async function() {
            const cpus = os.cpus();
            const model = cpus[0].model;
            const cores = cpus.length;

            return {
                success: true,
                message: `CPU Info: ${model} (${cores} cores)`
            };
        },

        /**
         * Get OS information
         */
        osinfo: async function() {
            return {
                success: true,
                message: `Operating System: ${os.type()} ${os.release()} (${os.arch()})`
            };
        }
    },

    commandDescriptions: {
        uptime: 'Show how long the system has been running',
        memory: 'Show memory usage statistics',
        cpu: 'Show processor information',
        osinfo: 'Show operating system details'
    }
};
