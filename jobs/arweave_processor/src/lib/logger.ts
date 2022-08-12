import { Logger, createLogger, transports, format } from 'winston';

let _logger: Logger;
function GetLogger(): Logger {
    return _logger ?? InitLogger();
}

function InitLogger(): Logger {
    console.log = () => { throw new Error('console.log is disabled') };

    _logger = createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        transports: [
            new transports.Console({
                format: format.simple()
            }),
        ]
    });
    return _logger;
}


export {
    GetLogger as Logger,
    InitLogger
}