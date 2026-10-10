// ============================================================
// Brancher - Structured Logging with Winston
// Centralized logging for audit trails, debugging, and monitoring
// ============================================================
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, "..", "logs");
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const PROD = process.env.NODE_ENV === "production";

// Define log levels with colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Define format untuk logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (readable untuk development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    return `${timestamp} [${level}]: ${message} ${Object.keys(extra).length ? JSON.stringify(extra, null, 2) : ""}`;
  })
);

// Define transports
const transports = [
  // Console output (always)
  new winston.transports.Console({
    format: consoleFormat,
    level: PROD ? "warn" : "debug",
  }),
  // Error log file (production + development)
  new winston.transports.File({
    filename: path.join(LOGS_DIR, "error.log"),
    level: "error",
    format: format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file (all levels)
  new winston.transports.File({
    filename: path.join(LOGS_DIR, "all.log"),
    format: format,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
  }),
];

// Create logger
const logger = winston.createLogger({
  level: PROD ? "warn" : "debug",
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "exceptions.log"),
      format: format,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "rejections.log"),
      format: format,
    }),
  ],
});

// ========== HELPER FUNCTIONS ==========

/**
 * Log HTTP request
 * @param {string} method
 * @param {string} path
 * @param {number} statusCode
 * @param {number} responseTime
 * @param {string} userId (optional)
 */
function logHttp(method, path, statusCode, responseTime, userId = null) {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "http";
  logger.log({
    level,
    message: `${method} ${path} ${statusCode}`,
    method,
    path,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId,
  });
}

/**
 * Log authentication event
 * @param {string} action (login, register, logout, failed_login)
 * @param {number} userId
 * @param {string} username
 * @param {string} email
 * @param {object} metadata (optional)
 */
function logAuth(action, userId, username, email, metadata = {}) {
  logger.info(`Auth: ${action}`, {
    action,
    userId,
    username,
    email,
    ...metadata,
  });
}

/**
 * Log database operation
 * @param {string} operation (INSERT, UPDATE, DELETE, SELECT)
 * @param {string} table
 * @param {object} metadata (optional)
 */
function logDb(operation, table, metadata = {}) {
  logger.debug(`Database: ${operation} on ${table}`, {
    operation,
    table,
    ...metadata,
  });
}

/**
 * Log business event
 * @param {string} event (branch_created, channel_created, message_sent, etc)
 * @param {number} userId
 * @param {object} metadata
 */
function logEvent(event, userId, metadata = {}) {
  logger.info(`Event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log error with context
 * @param {Error} error
 * @param {string} context
 * @param {object} metadata (optional)
 */
function logError(error, context, metadata = {}) {
  logger.error(`Error in ${context}`, {
    error: error.message,
    stack: error.stack,
    context,
    ...metadata,
  });
}

/**
 * Log permission denied
 * @param {number} userId
 * @param {string} action
 * @param {string} resource
 * @param {object} metadata (optional)
 */
function logPermissionDenied(userId, action, resource, metadata = {}) {
  logger.warn(`Permission denied`, {
    userId,
    action,
    resource,
    ...metadata,
  });
}

/**
 * Log rate limit exceeded
 * @param {string} ip
 * @param {string} endpoint
 * @param {number} attempts
 */
function logRateLimit(ip, endpoint, attempts) {
  logger.warn(`Rate limit exceeded`, {
    ip,
    endpoint,
    attempts,
  });
}

/**
 * Express middleware untuk HTTP logging
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
function httpLogger(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logHttp(req.method, req.path, res.statusCode, duration, req.session?.userId);
  });
  
  next();
}

module.exports = {
  logger,
  logHttp,
  logAuth,
  logDb,
  logEvent,
  logError,
  logPermissionDenied,
  logRateLimit,
  httpLogger,
};
