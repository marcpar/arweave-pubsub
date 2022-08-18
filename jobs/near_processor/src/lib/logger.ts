import { Logger, createLogger, transports, format } from 'winston';

let _logger: Logger;
function GetLogger(): Logger {
    return _logger ?? InitLogger();
}

function InitLogger(): Logger {

    _logger = createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        transports: [
            new transports.Console({
                format: format.simple()
            }),
        ]
    });
    let consoleLog = console.log;
    console.log = (...data: any[]) => { _logger.warn("console.log called"); consoleLog(data) };
    return _logger;
}


export {
    GetLogger as Logger,
    InitLogger
}