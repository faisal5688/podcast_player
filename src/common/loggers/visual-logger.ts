namespace Utilities.Logging {

    export class VisualLoggerOptions extends LoggerOptions {
        logDiv: string;
    }

    export class VisualLogger implements ILogger {
        private static _instance: VisualLogger = new VisualLogger();

        public Options: VisualLoggerOptions;

        private _logDiv: JQuery;
        private _logsText: JQuery;

        /**
         * Use this property to get the instance of the VisualLogger. Being singleton class, "new" is not supported.
         * @returns VisualLogger instance
         */
        public static get Instance(): VisualLogger {
            return VisualLogger._instance;
        }

        public initialize(options: any): void {
            let visualLogger: VisualLogger = this;

            visualLogger.Options = options;
            visualLogger._logDiv = $(visualLogger.Options.logDiv);
            visualLogger._logsText = visualLogger._logDiv.find(".logs-text");
            visualLogger._logDiv.find(".close-logs").one("click", () => {
                visualLogger.clearLogs();
                visualLogger._logDiv.find(".clear-logs").off("click");
                visualLogger._logDiv.hide();
            });
            visualLogger._logDiv.find(".clear-logs").on("click", () => {
                if (confirm("This will clear all the logs, warnings and errors. Make sure you have copied everything before clearing.")) {
                    visualLogger.clearLogs();
                    localStorage.clear();
                    visualLogger._logDiv.find(".clear-logs").off("click");
                    visualLogger._logDiv.hide();
                }
            });
            visualLogger._logDiv.show();
        }

        public trace(callerName: string, message: string, ...optionalParams: any[]): void {
            let visualLogger: VisualLogger = this,
                newLog: string = (callerName ? callerName + "::: " + message : message);

            if (this.Options.level <= LogLevel.trace) {
                newLog += visualLogger.serializeOptions(optionalParams);

                if (visualLogger._logDiv && visualLogger._logDiv.length === 1) {
                    newLog = visualLogger._logsText.html() + "<div class='entry trace'>Log: " + newLog + "</div>";
                    visualLogger._logsText.html(newLog);
                }
            }
        }

        public log(callerName: string, message: string, ...optionalParams: any[]): void {
            let visualLogger: VisualLogger = this,
                newLog: string = (callerName ? callerName + "::: " + message : message);

            if (this.Options.level <= LogLevel.log) {
                newLog += visualLogger.serializeOptions(optionalParams);

                if (visualLogger._logDiv && visualLogger._logDiv.length === 1) {
                    newLog = visualLogger._logsText.html() + "<div class='entry log'>Log: " + newLog + "</div>";
                    visualLogger._logsText.html(newLog);
                }
            }
        }

        public warn(callerName: string, message: string, ...optionalParams: any[]): void {
            let visualLogger: VisualLogger = this,
                newLog: string = (callerName ? callerName + "::: " + message : message);

            if (this.Options.level <= LogLevel.warn) {
                newLog += visualLogger.serializeOptions(optionalParams);

                if (visualLogger._logDiv && visualLogger._logDiv.length === 1) {
                    newLog = visualLogger._logsText.html() + "<div class='entry warn'>Warning: " + newLog + "</div>";
                    visualLogger._logsText.html(newLog);
                }
            }
        }

        public error(callerName: string, message: string, ...optionalParams: any[]): void {
            let visualLogger: VisualLogger = this,
                newLog: string = (callerName ? callerName + "::: " + message : message);

            if (this.Options.level <= LogLevel.error) {
                newLog += visualLogger.serializeOptions(optionalParams);

                if (visualLogger._logDiv && visualLogger._logDiv.length === 1) {
                    newLog = visualLogger._logsText.html() + "<div class='entry err'>Error: " + newLog + "</div>";
                    visualLogger._logsText.html(newLog);
                }
            }
        }

        public clearLogs(): void {
            let visualLogger: VisualLogger = this;
            if (visualLogger._logsText) {
                visualLogger._logsText.html("");
            }
        }

        private serializeOptions(optionalParams: any[]): string {
            let newLog: string = "";
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
            return newLog;
        }
    }
}