/// <reference path="loggers/logger-localstorage.ts" />

/**
 * Declare the functionName property for every function.
 * This is achieved using the @named decorator for the functions
 */
interface Function {
    functionName: string;
}

/**
 * A decorator function to add the functionName attribute to the function
 * @param target target function
 * @param key Name of the function
 */
function named(target: any, key: string) {
    target[key].functionName = key;
}

namespace Utilities {

    export let AppLogger: Logging.ILogger;

    export function isiPad() {
        let user_agent = navigator.userAgent.toLowerCase(),
            ios_devices = user_agent.match(/(ipad)/);
        return ios_devices;
    }

    export function isiPad_1() {
        var isiPad = /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
        if (isiPad) {
            console.log("This is an iPad");
        }
        return isiPad;
    }


    export function isiPhone() {
        let user_agent = navigator.userAgent.toLowerCase(),
            ios_devices = user_agent.match(/(iphone)/);
        return ios_devices;
    }

    export function isiOS() {
        let user_agent = navigator.userAgent.toLowerCase(),
            ios_devices = user_agent.match(/(iphone|ipod|ipad)/);
        return ios_devices;
    }

    export function readDeviceOrientation(): string {
        if (window.orientation) {
            let ori = parseInt(window.orientation.toString());
            if (Math.abs(ori) === 90) {
                return "Landscape";
            }
            return "Portrait";
        }
        else if (window.innerHeight > window.innerWidth) {
            return "Portrait";
        }
        return "Landscape";
    }

    export function getParam(name: string): string {
        let resultArray: RegExpExecArray;
        if (resultArray = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) {
            return decodeURIComponent(resultArray[1]);
        }
        return "";
    }

    export function showLoader(show: boolean): void {
        if (show) {
            $(".loader").show();
        }
        else {
            $(".loader").hide();
        }
    }

    export function openPdf(pdf: string): void {

        // TODO: add lang support
        window.open(pdf);
    }

    export function openPopupWindow(url: string, winTitle?: string, scrollbars: number = 1): void {
        let winW: number = 1280,
            winH: number = 1024,
            newWin: any = null,
            winLeft: number = window.screenLeft ? window.screenLeft : window.screenX,
            winTop: number = window.screenTop ? window.screenTop : window.screenY,
            params: string = "";

        if (window.screen.width && window.screen.height) {
            winW = window.screen.width;
            winH = window.screen.height;
        }

        params = winTitle ? winTitle : "";
        params += ', width=' + (winW * 2 / 3 - 10);
        params += ', height=' + (winH - 100);
        params += ', top=' + (winTop) + ', left=' + ((winLeft - 10) + winW / 3);
        params += ', resizable=yes';
        params += ', toolbar=0';
        params += ', scrollbars=' + scrollbars;
        params += ', status=0';
        params += ', menuBar=0';

        newWin = window.open(url, '_blank', params);
        if (newWin) {
            newWin.focus();
        }
    }

    export function consoleTrace(message: string, ...optionalParams: any[]): void {
        let callerName = arguments.callee.caller.functionName || "Unnamed ";
        if (HTML5AudioPlayer.APP_MODE === "debug" || HTML5AudioPlayer.LOGGING_ENABLED) {
            if (console) {
                console.log.apply(console, [callerName, message].concat(optionalParams));
            }
        }
        AppLogger.trace.apply(AppLogger, [callerName, message].concat(optionalParams));
    }

    export function consoleLog(message: string, ...optionalParams: any[]): void {
        let callerName = arguments.callee.caller.functionName || "Unnamed ";
        if (HTML5AudioPlayer.APP_MODE === "debug" || HTML5AudioPlayer.LOGGING_ENABLED) {
            if (console) {
                console.log.apply(console, [callerName, message].concat(optionalParams));
            }
        }
        AppLogger.log.apply(AppLogger, [callerName, message].concat(optionalParams));
    }

    export function consoleWarn(message: string, ...optionalParams: any[]): void {
        let callerName = arguments.callee.caller.functionName || "Unnamed ";
        if (console) {
            console.warn.apply(console, [callerName, message].concat(optionalParams));
        }
        AppLogger.warn.apply(AppLogger, [callerName, message].concat(optionalParams));
    }

    export function consoleError(message: string, ...optionalParams: any[]): void {
        let callerName = arguments.callee.caller.functionName || "Unnamed ";
        if (console) {
            console.error.apply(console, [callerName, message].concat(optionalParams));
        }
        AppLogger.error.apply(AppLogger, [callerName, message].concat(optionalParams));
    }
}
