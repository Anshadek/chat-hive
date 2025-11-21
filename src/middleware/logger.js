// src/middleware/logger.js
import chalk from 'chalk';

export default function logger(req, res, next) {
    const time = new Date().toISOString();

    console.log(
        chalk.green(`[${time}]`),
        chalk.cyan(req.method),
        chalk.yellow(req.originalUrl)
    );

    next();
}
