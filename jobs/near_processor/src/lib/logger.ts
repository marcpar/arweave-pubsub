import { Logger, createLogger, transports, format } from 'winston';

let _logger: Logger;
function GetLogger(): Logger {
    return _logger ?? InitLogger();
}

const CustomFormat = format((info, opts) => {
    if (opts.service_name) {
        info.service_name = opts.service_name;
    }
    info.time = Math.round(new Date().getTime() / 1000);

    return info;
});

function InitLogger(): Logger {
    _logger = createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        format: format.combine(
            CustomFormat({
                service_name: 'near_processor'
            }),
            format.json()
        ),
        transports: [
            new transports.Console(),
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