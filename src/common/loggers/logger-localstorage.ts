/// <reference path="ilogger.ts" />

namespace Utilities.Logging {

    export class LSLoggerOptions extends LoggerOptions {
        prefix: string;
    }

    export class LSLogger implements ILogger {
        private static _instance: LSLogger = new LSLogger();

        public Options: LSLoggerOptions;

        /**
         * Use this property to get the instance of the LSLogger. Being singleton class, "new" is not supported.
         * @returns LSLogger instance
         */
        public static get Instance(): LSLogger {
            return LSLogger._instance;
        }

        /**
         * Do not use this, Use {LSLogger.Instance} instead.
         */
        private constructor(options?: any) { }

        public initialize(options: any): void {
            this.Options = options;
        }

        public trace(callerName: string, message: string, ...optionalParams: any[]): void {
            if (this.Options.level <= LogLevel.trace) {
                this.updateItem.apply(this, [callerName, this.Options.prefix + "-trace", message].concat(optionalParams));
            }
        }

        public log(callerName: string, message: string, ...optionalParams: any[]): void {
            if (this.Options.level <= LogLevel.log) {
                this.updateItem.apply(this, [callerName, this.Options.prefix + "-log", message].concat(optionalParams));
            }
        }

        public warn(callerName: string, message: string, ...optionalParams: any[]): void {
            if (this.Options.level <= LogLevel.warn) {
                this.updateItem.apply(this, [callerName, this.Options.prefix + "-warn", message].concat(optionalParams));
            }
        }

        public error(callerName: string, message: string, ...optionalParams: any[]): void {
            if (this.Options.level <= LogLevel.error) {
                this.updateItem.apply(this, [callerName, this.Options.prefix + "-error", message].concat(optionalParams));
            }
        }

        private updateItem(callerName: string, name: string, message, ...optionalParams: any[]): void {
            let currentStack = localStorage.getItem(name) || "",
                newLog: string = this.Options.appVersion + ": "
                    + (new Date()).toString("yyyy-MM-dd (hh:mm): ")
                    + (callerName ? callerName + ": " + message : message);

            if (optionalParams) {
                for (let i: number = 0; i < optionalParams.length; i++) {
                    let param = optionalParams[i];
                    if (typeof param === "object") {
                        optionalParams[i] = JSON.stringify(param);
                        newLog = newLog + optionalParams[i];
                    }
                    else {
                        newLog = newLog + param;
                    }
                }
            }
            localStorage.setItem(name, currentStack + "\n " + newLog);
        }
    }
}