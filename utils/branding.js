/**
 * Echo ASCII Art - Premium Emerald Green
 * Terminal-friendly logo for CLI tools
 */

// ANSI escape codes for RGB color (emerald green)
const EMERALD_GREEN = '\x1b[38;2;80;200;120m';
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
 * Print the Echo logo to console
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
    RESET
  }
};
