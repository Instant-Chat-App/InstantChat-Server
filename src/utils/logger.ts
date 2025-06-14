import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(), // Ghi ra terminal
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Ghi lỗi
    new winston.transports.File({ filename: 'logs/combined.log' }) // Ghi tất cả
  ]
});