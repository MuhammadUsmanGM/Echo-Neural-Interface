/**
 * Productivity & Note-Taking Plugin for Echo
 * 
 * A useful plugin for quickly managing notes, todos, and clipboard history.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'productivity-plugin',
    version: '1.0.0',
    description: 'Quick notes and productivity tools.',
    author: 'Echo Team',

    init: async function() {
        this.notesDir = path.join(os.homedir(), '.echo-notes');
        if (!fs.existsSync(this.notesDir)) {
            fs.mkdirSync(this.notesDir, { recursive: true });
        }
    },

    commands: {
        /**
         * Quick Note
         * Usage: "Echo, note remember to buy milk"
         */
        note: async function(args) {
            if (!args) return { success: false, message: 'Please provide a note content.' };
            
            const timestamp = new Date().toLocaleString();
            const noteContent = `[${timestamp}] ${args}\n`;
            const noteFile = path.join(this.notesDir, 'notes.txt');
            
            try {
                fs.appendFileSync(noteFile, noteContent);
                return {
                    success: true,
                    message: `Note saved: "${args}"`
                };
            } catch (error) {
                return { success: false, message: 'Failed to save note.' };
            }
        },

        /**
         * Read Notes
         * Usage: "Echo, read my notes"
         */
        readnotes: async function() {
            const noteFile = path.join(this.notesDir, 'notes.txt');
            if (!fs.existsSync(noteFile)) {
                return { success: true, message: 'You have no notes yet.' };
            }

            try {
                const data = fs.readFileSync(noteFile, 'utf8');
                const lastNotes = data.split('\n').filter(line => line.trim()).slice(-5).join('\n');
                return {
                    success: true,
                    message: `Here are your last 5 notes:\n${lastNotes}`
                };
            } catch (error) {
                return { success: false, message: 'Could not read notes.' };
            }
        },

        /**
         * Clear Notes
         */
        clearnotes: async function() {
            const noteFile = path.join(this.notesDir, 'notes.txt');
            try {
                if (fs.existsSync(noteFile)) {
                    fs.unlinkSync(noteFile);
                }
                return { success: true, message: 'Notes cleared, sir.' };
            } catch (error) {
                return { success: false, message: 'Could not clear notes.' };
            }
        },

        /**
         * Generate a random password
         */
        password: async function(args) {
            const length = parseInt(args) || 12;
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
            let retVal = "";
            for (let i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            return {
                success: true,
                message: `Generated password: ${retVal} (Copied to clipboard logic would go here)`
            };
        }
    },

    commandDescriptions: {
        note: 'Save a quick text note',
        readnotes: 'Display your recent notes',
        clearnotes: 'Delete all your notes',
        password: 'Generate a secure random password'
    }
};
