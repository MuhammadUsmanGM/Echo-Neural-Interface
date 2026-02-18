const winston = require('winston');
const path = require('path');
const { app } = require('electron');

/**
 * Logger - Structured logging for Echo AI Agent
 * Provides different log levels and formats for development and production
 */
class Logger {
  constructor() {
    const logDir = app ? app.getPath('logs') : path.join(__dirname, '../logs');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // Write all logs to combined.log
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // Write errors to error.log
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5
        })
      ]
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: consoleFormat
        })
      );
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        ...meta
      });
    } else {
      this.logger.error(message, meta);
    }
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log API call with timing
   */
  logApiCall(provider, duration, success, error = null) {
    const meta = {
      provider,
      duration,
      success
    };

    if (error) {
      meta.error = error.message;
    }

    if (success) {
      this.info(`API call to ${provider} completed`, meta);
    } else {
      this.error(`API call to ${provider} failed`, error, meta);
    }
  }

  /**
   * Log user command
   */
  logCommand(command, success, error = null) {
    const meta = { command, success };

    if (error) {
      meta.error = error.message;
    }

    if (success) {
      this.info('Command executed', meta);
    } else {
      this.error('Command failed', error, meta);
    }
  }

  /**
   * Log system action
   */
  logSystemAction(action, details = {}) {
    this.info(`System action: ${action}`, details);
  }
}

// Export singleton instance
let loggerInstance = null;

module.exports = {
  getLogger: () => {
    if (!loggerInstance) {
      loggerInstance = new Logger();
    }
    return loggerInstance;
  }
};
