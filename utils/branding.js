/**
 * Echo ASCII Art - Premium Emerald Green
 * Terminal-friendly logo for CLI tools
 */

// Simple ANSI color codes (better Windows compatibility)
const EMERALD_GREEN = '\x1b[38;5;42m';
const BRIGHT_GREEN = '\x1b[38;5;83m';
const RESET = '\x1b[0m';

const ECHO_ASCII = `${EMERALD_GREEN}
███████╗ ██████╗██╗  ██╗ ██████╗
██╔════╝██╔════╝██║  ██║██╔═══██╗
█████╗  ██║     ███████║██║   ██║
██╔══╝  ██║     ██╔══██║██║   ██║
███████╗╚██████╗██║  ██║╚██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝
${RESET}`;

/**
 * Print the Echo logo to console (once)
 */
function printLogo() {
  console.log(ECHO_ASCII);
}

/**
 * Get the Echo logo as a string
 * @returns {string} The formatted logo string
 */
function getLogo() {
  return ECHO_ASCII;
}

/**
 * Get the logo without colors (plain ASCII)
 * @returns {string} The plain ASCII logo
 */
function getLogoPlain() {
  return `
███████╗ ██████╗██╗  ██╗ ██████╗
██╔════╝██╔════╝██║  ██║██╔═══██╗
█████╗  ██║     ███████║██║   ██║
██╔══╝  ██║     ██╔══██║██║   ██║
███████╗╚██████╗██║  ██║╚██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝
`;
}

module.exports = {
  printLogo,
  getLogo,
  getLogoPlain,
  ECHO_ASCII,
  colors: {
    EMERALD_GREEN,
    BRIGHT_GREEN,
    RESET
  }
};
