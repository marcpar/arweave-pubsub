import { Logger, createLogger, transports, format } from 'winston';
import { hostname } from 'os';

let _logger: Logger;
let host: string;

function GetLogger(): Logger {
    host = hostname();
    return _logger ?? InitLogger();
}

const CustomFormat = format((info, opts) => {
    if (!info.log_type) {
        info.log_type = 'default';
    }
    if (opts.service_name) {
        info.service_name = opts.service_name;
    }
    info.time = Math.round(new Date().getTime() / 1000);
    info.hostname = host;
    info.message = `${info.message}`

    return info;
});

function InitLogger(): Logger {
    _logger = createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        format: format.combine(
            CustomFormat({
                service_name: 'arweave_processor'
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