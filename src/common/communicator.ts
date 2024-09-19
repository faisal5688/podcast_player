/// <reference path="data-structures.ts" />
/// <reference path="utilities.ts" />

namespace HTML5AudioPlayer {
    export class Communicator extends Backbone.Model {

        private static _instance: Communicator = new Communicator();

        private _APIURLs: DataStructures.APIUrls;

        private _configPath: string = "resources/data/config.json";

        private _resourcePath: string;

        /**
         * Use this to get the instance of the Communicator. Being singleton class, "new" is not supported
         * @returns Communicator instance
         */
        public static get Instance(): Communicator {
            return Communicator._instance;
        }

        /**
         * Do not use this, Use {Communicator.Instance} instead.
         */
        private constructor(options?: any) {
            super(options);
        }

        /**
         * Loads application config file. Will trigger {Events.SUCCESS} or {Events.ERROR}
         */
        public loadConfig(): void {
            let communicator: Communicator = this,
                options: JQueryAjaxSettings = {
                    url: communicator._configPath,
                    method: 'GET',
                    dataType: 'json',
                    success: function (data: any, textStatus: string, jqXHR: JQueryXHR): void {
                        data = data || {};
                        communicator.trigger(Events.SUCCESS, data);
                    },
                    error: function (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): void {
                        communicator.trigger(Events.ERROR, jqXHR, textStatus, errorThrown);
                    }
                };
            $.ajax(options);
        }

        /**
         * Update configuration for the Communicator instance.
         * @param  {DataStructures.AppConfig} config
         */
        public updateConfig(config: DataStructures.AppConfig): void {
            let communicator: Communicator = this;

            communicator._APIURLs = (HTML5AudioPlayer.APP_MODE === "release"
                ? config.apisrelease : config.apisdebug);

            communicator._resourcePath = config.resources;

        }

        /**
         * Load language specific course data.
         */
        public loadCourseData(): void {
            let communicator: Communicator = this,
                url: string = communicator._resourcePath
                    + LanguageManager.Instance.getCurrentLangPath()
                    + communicator._APIURLs.coursedata,
                options: JQueryAjaxSettings = {
                    url: url,
                    method: 'GET',
                    dataType: 'json',
                    success: function (data: any, textStatus: string, jqXHR: JQueryXHR): void {
                        data = data || {};
                        communicator.trigger(Events.SUCCESS, data);
                    },
                    error: function (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): void {
                        communicator.trigger(Events.ERROR, jqXHR, textStatus, errorThrown);
                    }
                };
            $.ajax(options);
        }
    }
}