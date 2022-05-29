import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const transport: DailyRotateFile = new DailyRotateFile({
  filename: 'activity-%DATE%.log',
  dirname: './logs',
  datePattern: 'DD-MM-YYYY',
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'HH:mm:ss',
    }),
    winston.format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`)
  ),
  transports: [transport],
});

export default logger;
