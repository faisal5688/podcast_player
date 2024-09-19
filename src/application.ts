/// <reference path="common/scorm-wrapper.ts" />
/// <reference path="../node_modules/handlebars/types/index.d.ts" />

namespace HTML5AudioPlayer {
    export let COURSE_MODEL: Models.Course;
    export let COURSE_VIEW: Views.Course;

    export class Application {

        private static _instance: Application = new Application();

        public static get Instance(): Application { return Application._instance; }

        private _config: DataStructures.AppConfig;
        public get Config(): DataStructures.AppConfig { return this._config; }
        public set Config(config: DataStructures.AppConfig) { this._config = config; }

        /**
         * Do not use this, Use {Application.Instance} instead.
         */
        private constructor(options?: any) { }

        public init(): void {
            let app: Application = this;

            Communicator.Instance.once(Events.SUCCESS, app.onConfigLoaded, app);
            Communicator.Instance.once(Events.ERROR, app.onConfigFailed, app);
            Communicator.Instance.loadConfig();
        }

        private onConfigFailed(jqXHR: JQueryXHR, textStatus: string, errorThrown: string): void {
            let app: Application = this;
            Communicator.Instance.off(Events.SUCCESS, app.onConfigLoaded, app);
            console.error("Failed to get config file, can not load application. error: ", errorThrown);
            alert("Failed to get config file, can not load application. error: " + errorThrown);
        }

        @named
        private onConfigLoaded(data: any): void {
            let app: Application = this;
            Communicator.Instance.off(Events.ERROR, app.onConfigFailed, app);

            app.Config = data;

            APP_MODE = app.Config.mode;
            APP_VERSION = app.Config.version;
            LOGGING_ENABLED = app.Config.logging.enabled;
            LOGGING_LEVEL = app.Config.logging.level;

            $(".appversion").text(APP_VERSION);
            $(".appversion").on("click", app.showVisualLogs);
            app.readAllQueryStringValues();

            Communicator.Instance.updateConfig(app.Config);

            if (app.Config.language) {
                LanguageManager.Instance.Lang = app.Config.language;
            }
            else {
                LanguageManager.Instance.Enabled = false;
            }

            Utilities.AppLogger = Utilities.Logging[app.Config.logging.logger].Instance;
            app.Config.logging.options.level = LOGGING_LEVEL;
            app.Config.logging.options.appVersion = APP_VERSION;
            Utilities.AppLogger.initialize(app.Config.logging.options);
            Utilities.consoleLog("Application Started!");
            document.addEventListener("keydown", app.onKeyPress, false);

            Communicator.Instance.once(Events.SUCCESS, app.onCourseDataLoaded, app);
            Communicator.Instance.once(Events.ERROR, app.onCourseDataFailed, app);

            Utilities.showLoader(true);
            Communicator.Instance.loadCourseData();
        }

        private onCourseDataFailed(jqXHR: JQueryXHR, textStatus: string, errorThrown: string): void {
            let app: Application = this;
            Communicator.Instance.off(Events.SUCCESS, app.onCourseDataLoaded, app);

            console.error("Failed to get Course data, can not load the application. error: ", errorThrown);
            alert("Failed to get CourseCourse data, can not load the application. error: " + errorThrown);
        }

        private onCourseDataLoaded(data: any): void {
            let app: Application = this;
            Communicator.Instance.off(Events.ERROR, app.onCourseDataFailed, app);

            COURSE_MODEL = new Models.Course(data);
            COURSE_VIEW = new Views.Course({
                model: COURSE_MODEL,
                el: '#app'
            });
            COURSE_VIEW.render();

            COURSE_VIEW.afterRender();

            app.clickToTouchStart();

            Utilities.showLoader(false);
        }

        @named
        private clickToTouchStart(): void {
            if (Utilities.isiOS()) {
                Utilities.consoleTrace("IOS found. Triggering touchstart.");
                $(document).on('click', function (event) {
                    $(event.target).trigger('touchstart');
                });
            }
        }

        private onKeyPress(evt: KeyboardEvent): void {
            if (evt.ctrlKey && evt.altKey) {
                if (evt.key === "l") {
                    Utilities.consoleTrace("evt.key: ", evt.key);
                    HTML5AudioPlayer.Application.Instance.showVisualLogs();
                }
                if (evt.key === "0") {
                    Utilities.consoleTrace("evt.key: ", evt.key);
                    LOGGING_LEVEL = Utilities.Logging.LogLevel.trace;
                    Utilities.AppLogger.Options.level = LOGGING_LEVEL;
                    alert("Log level changed to \"TRACE\" and above.");
                }
                if (evt.key === "1") {
                    Utilities.consoleTrace("evt.key: ", evt.key);
                    LOGGING_LEVEL = Utilities.Logging.LogLevel.log;
                    Utilities.AppLogger.Options.level = LOGGING_LEVEL;
                    alert("Log level changed to \"LOGS\" and above.");
                }
                if (evt.key === "2") {
                    Utilities.consoleTrace("evt.key: ", evt.key);
                    LOGGING_LEVEL = Utilities.Logging.LogLevel.warn;
                    Utilities.AppLogger.Options.level = LOGGING_LEVEL;
                    alert("Log level changed to \"WARNINGS\" and above.");
                }
                if (evt.key === "3") {
                    Utilities.consoleTrace("evt.key: ", evt.key);
                    LOGGING_LEVEL = Utilities.Logging.LogLevel.error;
                    Utilities.AppLogger.Options.level = LOGGING_LEVEL;
                    alert("Log level changed to \"ERROR\" and above.");
                }
            }
        }

        private showVisualLogs(): void {
            let prefix: string = (<Utilities.Logging.LSLoggerOptions>Utilities.AppLogger.Options).prefix;

            Utilities.Logging.VisualLogger.Instance.initialize({
                "logDiv": "#visual-logs",
                "level": LOGGING_LEVEL
            });

            Utilities.Logging.VisualLogger.Instance.clearLogs();

            let currentStack = localStorage.getItem(prefix + "-trace");
            if (currentStack) {
                Utilities.Logging.VisualLogger.Instance.trace("Local Storage Traces:\n", currentStack);
            }

            currentStack = localStorage.getItem(prefix + "-log");
            if (currentStack) {
                Utilities.Logging.VisualLogger.Instance.log("Local Storage LOGS:\n", currentStack);
            }

            currentStack = localStorage.getItem(prefix + "-warn");
            if (currentStack) {
                Utilities.Logging.VisualLogger.Instance.warn("Local Storage WARNMINGS:\n", currentStack);
            }

            currentStack = localStorage.getItem(prefix + "-error");
            if (currentStack) {
                Utilities.Logging.VisualLogger.Instance.error("Local Storage ERRORS:\n", currentStack);
            }
        }

        private readAllQueryStringValues(): void {
            let app: Application = this;
            // override the log level from querystring if provided.
            let logLevel: string = Utilities.getParam("loglevel");
            if (logLevel) {
                try {
                    let lvl: number = parseInt(logLevel);
                    if (lvl < 1 || lvl > 4) {
                        alert("Incorrect loglevel value. it should be from 1 to 4.");
                    }
                    else {
                        LOGGING_LEVEL = lvl;
                    }
                }
                catch (ex) {
                    alert("Incorrect loglevel value. it should be from 1 to 4.");
                }
            }
        }

        @named
        public exit(): void {
            COURSE_MODEL.exitScormComm();
            Utilities.consoleLog("Application Exit!");
        }
    }
}

(() => {
    window.addEventListener('load', function () {
        HTML5AudioPlayer.Application.Instance.init();
    });

    window.onbeforeunload = function (this: Window, ev: BeforeUnloadEvent) {
        HTML5AudioPlayer.Application.Instance.exit();
    };

    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

        switch (operator) {
            case '==':
                // as we are registering ==, linter rule needs to be disabled for this line.
                // tslint:disable-next-line:triple-equals
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                // as we are registering ==, linter rule needs to be disabled for this line.
                // tslint:disable-next-line:triple-equals
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });
})();
