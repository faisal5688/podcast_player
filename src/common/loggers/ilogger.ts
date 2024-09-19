namespace Utilities.Logging {

    export enum LogLevel {
        trace = 1,
        log,
        warn,
        error
    }

    export class LoggerOptions {
        level: LogLevel;
        appVersion: string;
    }

    export interface ILogger {
        Options: LoggerOptions;
        initialize(options: LoggerOptions): void;
        trace(callerName: string, message: string, ...optionalParams: any[]): void;
        log(callerName: string, message: string, ...optionalParams: any[]): void;
        warn(callerName: string, message: string, ...optionalParams: any[]): void;
        error(callerName: string, message: string, ...optionalParams: any[]): void;
    }
}