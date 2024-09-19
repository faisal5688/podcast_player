namespace HTML5AudioPlayer {

    export class LanguageManager {
        private static _instance: LanguageManager = new LanguageManager();

        public static get Instance(): LanguageManager {
            return LanguageManager._instance;
        }

        private _curLang: string;

        public get Lang(): string {
            return this._curLang;
        }

        public set Lang(langCode: string) {
            if (this.validateLangCode(langCode)) {
                this._curLang = langCode;
                this.Enabled = true;
            }
            else {
                this.Enabled = false;
                console.warn("Invalid Lang code: ", langCode, " all resources will be loaded from default resource location.");
            }
        }

        private _enabled: boolean;

        public get Enabled(): boolean {
            return this._enabled;
        }

        public set Enabled(enabled: boolean) {
            this._enabled = enabled;
        }

        /**
         * Do not use this, Use {LanguageManager.Instance} instead.
         */
        private constructor(options?: any) { }

        private validateLangCode(langCode: string): boolean {

            // TODO: validate the language code and return true/false accordingly.

            return true;
        }

        getCurrentLangPath(): string {
            let languageManager: LanguageManager = this,
                curLangPath: string = "";

            if (languageManager.Enabled) {
                curLangPath = "lang/" + languageManager.Lang + "/";
            }
            return curLangPath;
        }
    }
}