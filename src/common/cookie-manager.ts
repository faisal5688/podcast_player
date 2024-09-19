namespace Utilities {
    export class CookieManager {
        private static _instance: CookieManager = new CookieManager();

        public static get Instance(): CookieManager {
            return CookieManager._instance;
        }

        /**
         * Do not use this, Use {CookieManager.Instance} instead.
         */
        private constructor(options?: any) { }

        public createCookie(name: string, value: string, days: number): void {
            let expires: string = "";

            if (days) {
                let date: Date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toLocaleDateString();
            }

            document.cookie = name + "=" + value + expires + "; path=/";
        }

        public readCookie(name: string): string {
            let nameEQ: string = name + '=',
                cookies: string[] = document.cookie.split(';'),
                curCookie: string = '', curCookies: string[];

            for (let i = 0; i < cookies.length; i++) {
                curCookie = cookies[i];
                while (curCookie.charAt(0) === ' ') {
                    curCookie = curCookie.substring(1, curCookie.length);
                }
                if (curCookie.indexOf(nameEQ) === 0) {
                    return curCookie.substring(nameEQ.length, curCookie.length);
                }
            }
            return null;
        }

        public eraseCookie(name: string): void {
            this.createCookie(name, '', -1);
        }
    }
}