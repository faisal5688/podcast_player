/// <reference path="scorm-apiwrappers/scorm_12_apiwrapper.ts" />
/// <reference path="scorm-apiwrappers/scorm_2004_apiwrapper.ts" />
/// <reference path="cookie-manager.ts" />

namespace Utilities {

    class ScormDataEntries {
        Name: string;
        StatusKey: string;
        LocationKey: string;
        CompletionKey: string;
        EntryKey: string;
        ExitKey: string;
        ScoreKey: string;
        DefaultValues: {
            FirstEntry: string; // resume
            ResumedEntry: string;
            ExitTimeout: string;
            ExitReset: string;
            ExitSuspend: string;
            ExitLogout: string;
            ExitNormal: string;
        };
        ScormObject: any;
        InteractionsKeys: {
            ChildrenKey: string;
            CountKey: string;
            IdKey: string;
            ObjCountKey: string;
            ObjIdKey: string;
            TimeKey?: string;
            TimestampKey?: string;
            TypeKey: string;
            TypeMCQValue: string;
            CorrectCountKey: string;
            CorrectPatternKey: string;
            WeightingKey: string;
            StudentResponseKey?: string;
            ResultKey: string;
            LatencyKey: string;
            DescriptionKey?: string;
            LearnerResponseKey?: string;
        };
    }

    export enum Compliance {
        SCORM12 = "SCORM12",
        SCORM2004 = "SCORM2004"
    }

    export enum QuestionType {
        MCSS = "MCSS",
        MCMS = "MCMS"
    }


    export class ScormInteractions {
        Id: string;
        ObjCount: string;
        ObjId: string;
        Time: string;
        Type: string;
        CorrectCount: string;
        CorrectPattern: string;
        Weighting: string;
        Response: string;
        Result: string;
        Latency: string;
        Description: string;
        QuestionType: string;
        constructor(data: any) {
            this.Id = data.questionId || "";
            this.ObjCount = data.objCount || "";
            this.Time = data.time || "";
            this.CorrectCount = data.correctCount || "";
            this.CorrectPattern = data.correctPattern || "";
            this.Weighting = data.weighting || "";
            this.Result = data.result || "";
            this.Latency = data.latency || "";
            this.Type = "";
            this.QuestionType = data.questionType;
            this.Response = data.answer || "";
            this.Description = data.question || "";
        }
    }

    export class ScormWrapper {

        public static CONSTANTS = {
            SCORM12: {
                Name: "SCORM12",
                CompletionKey: "cmi.core.lesson_status",
                StatusKey: "cmi.core.lesson_status",
                LocationKey: "cmi.suspend_data",
                EntryKey: "cmi.core.entry",
                ExitKey: "cmi.core.exit",
                ScoreKey: "cmi.core.score.raw",
                InteractionsKeys: {
                    ChildrenKey: "cmi.interactions._children",
                    CountKey: "cmi.interactions._count",
                    IdKey: "cmi.interactions.n.id",
                    ObjCountKey: "cmi.interactions.n.objectives._count",
                    ObjIdKey: "cmi.interactions.n.objectives.n.id",
                    TimeKey: "cmi.interactions.n.time",
                    TypeKey: "cmi.interactions.n.type",
                    TypeMCQValue: "performance",
                    CorrectCountKey: "cmi.interactions.n.correct_responses._count",
                    CorrectPatternKey: "cmi.interactions.n.correct_responses.n.pattern",
                    WeightingKey: "cmi.interactions.n.weighting",
                    StudentResponseKey: "cmi.interactions.n.student_response",
                    ResultKey: "cmi.interactions.n.result",
                    LatencyKey: "cmi.interactions.n.latency"
                },
                DefaultValues: {
                    FirstEntry: "ab-initio",
                    ResumedEntry: "resume",
                    ExitTimeout: "timeout",
                    ExitReset: "",
                    ExitSuspend: "suspend",
                    ExitLogout: "logout",
                    ExitNormal: "normal"
                },
                ScormObject: null
            },
            SCORM2004: {
                Name: "SCORM2004",
                StatusKey: "cmi.success_status",
                CompletionKey: "cmi.completion_status",
                LocationKey: "cmi.suspend_data",
                EntryKey: "cmi.entry",
                ExitKey: "cmi.exit",
                ScoreKey: "cmi.score.scaled",
                InteractionsKeys: {
                    ChildrenKey: "cmi.interactions._children",
                    CountKey: "cmi.interactions._count",
                    IdKey: "cmi.interactions.n.id",
                    TypeKey: "cmi.interactions.n.type",
                    TypeMCQValue: "other",
                    ObjCountKey: "cmi.interactions.n.objectives._count",
                    ObjIdKey: "cmi.interactions.n.objectives.n.id",
                    TimestampKey: "cmi.interactions.n.timestamp",
                    CorrectCountKey: "cmi.interactions.n.correct_responses._count",
                    CorrectPatternKey: "cmi.interactions.n.correct_responses.n.pattern",
                    WeightingKey: "cmi.interactions.n.weighting",
                    LearnerResponseKey: "cmi.interactions.n.learner_response",
                    ResultKey: "cmi.interactions.n.result",
                    LatencyKey: "cmi.interactions.n.latency",
                    DescriptionKey: "cmi.interactions.n.description"
                },
                DefaultValues: {
                    FirstEntry: "ab-initio",
                    ResumedEntry: "resume",
                    ExitTimeout: "timeout",
                    ExitReset: "",
                    ExitSuspend: "suspend",
                    ExitLogout: "logout",
                    ExitNormal: "normal"
                },
                ScormObject: null
            },
            Status: {
                NotAttempted: "not attempted",
                Browsed: "browsed",
                Incomplete: "incomplete",
                Completed: "completed",
                Passed: "passed",
                Failed: "failed",
                Unknown: "unknown"
            }
        };

        private static _instance: ScormWrapper = new ScormWrapper();

        private _CurrentSCORM: ScormDataEntries;
        public get CurrentSCORM(): ScormDataEntries {
            return this._CurrentSCORM;
        }

        private _interactionsCount: number;
        private _CommLostMsg: string;
        private _CookieManager: CookieManager = null;

        private _debug: boolean = true;
        public get Debug(): boolean { return this._debug; }
        public set Debug(value: boolean) {
            this._debug = value;
            ADL.SCORM12.debug = this._debug;
            ADL.SCORM2004.debug = this._debug;
        }

        private constructor() {
            this._CurrentSCORM = null;
            this._CookieManager = null;
            this._CommLostMsg = "The communication with server that tracks your progress has failed. Further course progress will be lost. Please relaunch the course to continue and track your progress.";
        }

        public static get Instance(): ScormWrapper {
            return ScormWrapper._instance;
        }

        public initialize(version: Compliance, useCookies: boolean = false, CommLostMsg?: string, logger?: any): boolean {
            let result: boolean = false;

            if (null != this._CurrentSCORM) {
                throw new Error("Error: SCORM already Initialized to use SCORM Version: " + this._CurrentSCORM.Name);
            }

            // IMP: if version is incorrect nothing will work as this._CurrentSCORM will be null.
            this._CurrentSCORM = ScormWrapper.CONSTANTS[version];

            this._CommLostMsg = CommLostMsg || this._CommLostMsg;

            if (this._CurrentSCORM) {
                if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM12.Name) {
                    this._CurrentSCORM.ScormObject = ADL.SCORM12;
                    this._CurrentSCORM.ScormObject.output = logger || window.console;
                    result = this._CurrentSCORM.ScormObject.doLMSInitialize() === "true";
                }
                else if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM2004.Name) {
                    this._CurrentSCORM.ScormObject = ADL.SCORM2004;
                    this._CurrentSCORM.ScormObject.output = logger || window.console;
                    result = this._CurrentSCORM.ScormObject.doInitialize() === "true";
                }
            }
            else {
                throw new Error("Error: SCORM Initialization failed: expected values for version are ScormWrapper.CONSTANTS.SCORM2004.Name OR ScormWrapper.CONSTANTS.SCORM12.Name.");
            }

            // If asked to use cookies, use only when SCORM is not available
            if (result) {
                useCookies = false;
            }

            if (useCookies) {
                this._CookieManager = CookieManager.Instance;
                result = true;
            }
            this.ValidateResult(result);
            return result;
        }

        public getLessonStatus(): string {
            return this.getValue(this._CurrentSCORM.StatusKey);
        }

        public setLessonStatus(value: string): boolean {
            return this.setValue(this._CurrentSCORM.StatusKey, value);
        }

        public getCompletionStatus(): string {
            return this.getValue(this._CurrentSCORM.CompletionKey);
        }

        public setCompletionStatus(value: string): boolean {
            return this.setValue(this._CurrentSCORM.CompletionKey, value);
        }

        public getLessonLocation(): string {
            return this.getValue(this._CurrentSCORM.LocationKey);
        }

        public setLessonLocation(value: any): boolean {
            return this.setValue(this._CurrentSCORM.LocationKey, value);
        }

        public getScore(): string {
            return this.getValue(this._CurrentSCORM.ScoreKey);
        }

        public setScore(value: any): boolean {
            return this.setValue(this._CurrentSCORM.ScoreKey, value);
        }
        // set and get cmi.interactions values

        public getInteractionsChildren(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.ChildrenKey);
        }

        public getInteractionsCount(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.CountKey);
        }

        public getInteractionsId(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.IdKey);
        }

        public setInteractionsId(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.IdKey), value);
        }

        public getInteractionsObjCount(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.ObjCountKey);
        }

        public setInteractionsObjCount(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.ObjCountKey), value);
        }

        public getInteractionsObjId(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.ObjIdKey);
        }

        public setInteractionsObjId(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.ObjIdKey), value);
        }

        public getInteractionsType(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.TypeKey);
        }

        public setInteractionsType(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.TypeKey), value);
        }

        public getInteractionsCorrectCount(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.CorrectCountKey);
        }

        public setInteractionsCorrectCount(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.CorrectCountKey), value);
        }

        public getInteractionsCorrectPattern(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.CorrectPatternKey);
        }

        public setInteractionsCorrectPattern(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.CorrectPatternKey), value);
        }

        public getInteractionsWeighting(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.WeightingKey);
        }

        public setInteractionsWeighting(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.WeightingKey), value);
        }

        public getInteractionsResult(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.ResultKey);
        }

        public setInteractionsResult(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.ResultKey), value);
        }

        public getInteractionsLatency(): string {
            return this.getValue(this._CurrentSCORM.InteractionsKeys.LatencyKey);
        }

        public setInteractionsLatency(value: any): boolean {
            return this.setValue(this.getKeyValue(this._CurrentSCORM.InteractionsKeys.LatencyKey), value);
        }

        public getInteractionsDescription(): string {
            let descriptionKey = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.IdKey
                : this._CurrentSCORM.InteractionsKeys.DescriptionKey;
            return this.getValue(descriptionKey);
        }

        public setInteractionsDescription(value: any): boolean {
            let descriptionKey = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.IdKey
                : this._CurrentSCORM.InteractionsKeys.DescriptionKey;
            return this.setValue(this.getKeyValue(descriptionKey), value);
        }

        public getInteractionsTime(): string {
            let timeKey = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.TimeKey
                : this._CurrentSCORM.InteractionsKeys.TimestampKey;
            return this.getValue(timeKey);
        }

        public setInteractionsTime(value: any): boolean {
            let timeKey = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.TimeKey
                : this._CurrentSCORM.InteractionsKeys.TimestampKey;
            return this.setValue(this.getKeyValue(timeKey), value);
        }

        public getInteractionsResponse(): string {
            let response = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.StudentResponseKey
                : this._CurrentSCORM.InteractionsKeys.LearnerResponseKey;
            return this.getValue(response);
        }

        public setInteractionsResponse(value: any): boolean {
            let response = this._CurrentSCORM.Name === Compliance.SCORM12
                ? this._CurrentSCORM.InteractionsKeys.StudentResponseKey
                : this._CurrentSCORM.InteractionsKeys.LearnerResponseKey;
            return this.setValue(this.getKeyValue(response), value);
        }

        public getKeyValue(value: string): string {
            let key = value.replace(".n.", "." + this._interactionsCount + ".");
            return key;
        }

        public exit(value: string): boolean {
            Utilities.consoleLog("Exiting from SCORM: key: ", this._CurrentSCORM.ExitKey, ", value:", value);
            return this.setValue(this._CurrentSCORM.ExitKey, value);
        }

        @named
        public firstLaunch(): boolean {
            let result: boolean = false;
            if (this._CookieManager) {
                // if _CookieManager is avaialable then get the location and check if it's available.
                return (!!this.getLessonLocation());
            }

            let value = this.getValue(this._CurrentSCORM.EntryKey);
            Utilities.consoleTrace(this._CurrentSCORM.EntryKey + ": " + value);
            result = (value === this._CurrentSCORM.DefaultValues.FirstEntry);
            return result;
        }

        @named
        private getValue(name: string): string {
            let value: string = null;

            if (this._CookieManager) {
                return this._CookieManager.readCookie(name);
            }

            if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM12.Name) {
                value = this._CurrentSCORM.ScormObject.doLMSGetValue(name);
            }
            else if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM2004.Name) {
                value = this._CurrentSCORM.ScormObject.doGetValue(name);
            }
            Utilities.consoleTrace("Value from SCORRM: ", name, ": ", value);
            if (value === "FAILEDTOGETVALUE") {
                this.ValidateResult(false);
                value = "";
            }
            return value;
        }

        private setValue(name: string, value: any): boolean {
            let result: boolean = null;

            if (this._CookieManager) {
                this._CookieManager.eraseCookie(name);
                this._CookieManager.createCookie(name, value, 90);
                return true;
            }
            Utilities.consoleTrace("Saving to SCORM: ", name, ": ", value);
            if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM12.Name) {
                result = this._CurrentSCORM.ScormObject.doLMSSetValue(name, value) === "true";
            }
            else if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM2004.Name) {
                result = this._CurrentSCORM.ScormObject.doSetValue(name, value) === "true";
            }
            this.ValidateResult(result);
            return result;
        }

        public setInteractionsData(data: ScormInteractions, type: string, quesNo: number, totalQuestLen?: number): void {

            this._interactionsCount = this.getInteractionValue(type, quesNo, totalQuestLen);

            if (data.Id) {
                this.setInteractionsId(data.Id);
            }
            if (data.ObjCount) {
                this.setInteractionsObjCount(data.ObjCount);
            }
            if (data.ObjId) {
                this.setInteractionsObjId(data.ObjId);
            }
            if (data.Time) {
                this.setInteractionsTime(data.Time);
            }
            data.Type = "";
            if (data.QuestionType === QuestionType.MCMS || data.QuestionType === QuestionType.MCSS) {
                data.Type = this._CurrentSCORM.InteractionsKeys.TypeMCQValue;
            }
            if (data.Type) {
                this.setInteractionsType(data.Type);
            }
            if (data.CorrectCount) {
                this.setInteractionsCorrectCount(data.CorrectCount);
            }
            if (data.CorrectPattern) {
                this.setInteractionsCorrectPattern(data.CorrectPattern);
            }
            if (data.Weighting) {
                this.setInteractionsWeighting(data.Weighting);
            }
            if (data.Response) {
                this.setInteractionsResponse(data.Response);
            }
            if (data.Result) {
                this.setInteractionsResult(data.Result);
            }
            if (data.Latency) {
                this.setInteractionsLatency(data.Latency);
            }
            if (data.Description) {
                this.setInteractionsDescription(data.Description);
            }
            this.commit();
        }

        private getInteractionValue(type: string, quesNo: number, totalQuestLen: number): number {
            if (type === "survey") {
                return quesNo;
            }

            if (type === "assessment") {
                let count = null;
                if (quesNo == 1) {
                    //First question
                    count = this.getInteractionsCount();
                    if (isNaN(count)) {
                        count = 0;
                    }
                    else {
                        if (count > 0 && count < totalQuestLen) {
                            //User left the first attempt in between
                            count = 0;
                        }
                        else {
                            if (count > totalQuestLen) {
                                //This will then only record full attempts at the assement and will discard partial attempts
                                count = count - (count % totalQuestLen);
                            }
                        }
                    }
                }
                else {
                    //Not first question
                    count++;
                }
                return count;
            }
        }

        public commit(): boolean {
            let result: boolean = null;

            if (this._CookieManager) {
                return true;
            }

            if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM12.Name) {
                result = this._CurrentSCORM.ScormObject.doLMSCommit() === "true";
            }
            else if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM2004.Name) {
                result = this._CurrentSCORM.ScormObject.doCommit() === "true";
            }
            this.ValidateResult(result);
            return result;
        }

        @named
        public finish(closeWindow: boolean = false): boolean {
            let result: boolean = null;

            if (this._CookieManager) {
                return true;
            }

            Utilities.consoleLog("Terminating SCORM communication.");

            if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM12.Name) {
                result = this._CurrentSCORM.ScormObject.doLMSFinish() === "true";
            }
            else if (this._CurrentSCORM.Name === ScormWrapper.CONSTANTS.SCORM2004.Name) {
                result = this._CurrentSCORM.ScormObject.doTerminate() === "true";
            }
            if (closeWindow) {
                let opener: any = window.opener;
                if (opener && (typeof (opener.closeMainWindow) === "function")) {
                    opener.closeMainWindow();
                }
            }
            this.ValidateResult(result);
            return result;
        }

        private ValidateResult(result: boolean): void {
            if (!result) {
                alert(this._CommLostMsg);
            }
        }
    }
}