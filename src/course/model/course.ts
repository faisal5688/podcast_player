/// <reference path="../../common/custom-events.ts" />
/// <reference path="../../common/utilities.ts" />

/// <reference path="../../components/audio-player/model/audio-player.ts" />
/// <reference path="../../components/knowledge-check/model/knowledge-check.ts" />

/// <reference path="../../components/carousel/model/carousel.ts" />

namespace HTML5AudioPlayer.Models {
    export class Course extends Backbone.Model {

        get Logo(): string { return this.get("logo"); }
        set Logo(value: string) { this.set("logo", value); }

        get Title(): string { return this.get("title"); }
        set Title(value: string) { this.set("title", value); }

        get IndexPDF(): string { return this.get("indexpdf"); }
        set IndexPDF(value: string) { this.set("indexpdf", value); }

        get ResourcePDF(): string { return this.get("resourcepdf"); }
        set ResourcePDF(value: string) { this.set("resourcepdf", value); }


        get GlossaryPDF(): string { return this.get("glossarypdf"); }
        set GlossaryPDF(value: string) { this.set("glossarypdf", value); }

        get CommLostMsg(): string { return this.get("commlostmsg"); }
        set CommLostMsg(value: string) { this.set("commlostmsg", value); }

        get UseCookies(): boolean { return this.get("usecookies"); }
        set UseCookies(value: boolean) { this.set("usecookies", value); }

        get CourseComplete(): boolean { return this.get("CourseComplete"); }
        set CourseComplete(value: boolean) { this.set("CourseComplete", value); }

        get Compliance(): Utilities.Compliance { return this.get("compliance"); }
        set Compliance(value: Utilities.Compliance) { this.set("compliance", value); }

        get CourseMode(): DataStructures.CourseMode { return this.get("coursemode"); }
        set CourseMode(value: DataStructures.CourseMode) { this.set("coursemode", value); }

        get PlayerData(): DataStructures.PlayerData { return this.get("playerdata"); }


        get PlayerModel(): Components.Models.AudioPlayer { return this.get("PlayerModel"); }
        set PlayerModel(value: Components.Models.AudioPlayer) { this.set("PlayerModel", value); }

        get Carousel(): DataStructures.Carousel { return this.get("carousel"); }

        get CarouselModel(): Components.Models.Carousel { return this.get("CarouselModelModel"); }
        set CarouselModel(value: Components.Models.Carousel) { this.set("CarouselModelModel", value); }


        get CompleteOn(): DataStructures.CompleteOn { return this.get("completeon"); }
        set CompleteOn(value: DataStructures.CompleteOn) { this.set("completeon", value); }

        get KnowledgeCheck(): Components.Models.KnowledgeCheck { return this.get("KnowledgeCheckModel"); }
        set KnowledgeCheck(value: Components.Models.KnowledgeCheck) { this.set("KnowledgeCheckModel", value); }

        get Assessment(): Components.Models.Assessment { return this.get("AssessmentModel"); }
        set Assessment(value: Components.Models.Assessment) { this.set("AssessmentModel", value); }

        get Survey(): Components.Models.Survey { return this.get("SurveyModel"); }
        set Survey(value: Components.Models.Survey) { this.set("SurveyModel", value); }

        get ScormPreviousData(): any { return this.get("ScormPreviousData"); }
        set ScormPreviousData(value: any) { this.set("ScormPreviousData", value); }
        private scorm: Utilities.ScormWrapper;

        get ShowLauncher(): boolean { return this.get("ShowLauncher"); }
        get ShowExitButton(): boolean { return this.get("ShowExitButton"); }
        get ExitPopup(): DataStructures.ModalDialogOptions { return this.get("exitPopup"); }
        get Help(): DataStructures.HelpData { return this.get("help"); }

        get hasCarousel(): boolean { return this.get("hasCarousel"); }
        set hasCarousel(value: boolean) { this.set("current", value); }

        constructor(options: any) {
            super(options);
            let model: Course = this;
            //let hasCarousel:Boolean = true;
           //alert(model.Carousel.hasCarousel)


           model.hasCarousel = model.Carousel.hasCarousel;

            model.scorm = Utilities.ScormWrapper.Instance;
            Utilities.consoleTrace("UseCookies: ", model.UseCookies);
            if (!model.scorm.initialize(model.Compliance, model.UseCookies, model.CommLostMsg, Utilities.AppLogger)) {
                Utilities.consoleWarn("Failed to init SCORM:", model.Compliance);
            }
            else {
                Utilities.consoleTrace("Course Mode: ", model.CourseMode);
                if (model.CourseMode === DataStructures.CourseMode.OPEN && model.CompleteOn === DataStructures.CompleteOn.LAUNCH) {
                    Utilities.consoleTrace("CompleteOn: ", model.CompleteOn);
                    model.setLessonStatusComplete();
                }
                else {
                    Utilities.consoleTrace("CompleteOn: ", model.CompleteOn);
                    model.setLessonStatusIncomplete();
                }
                model.ScormPreviousData = null;
                model.PlayerData.ScormPreviousData = model.getScormData();
            }

            model.PlayerData.coursemode = model.CourseMode;
            model.PlayerData.passingPercent = options.assessmentData ? options.assessmentData.passingPercent : 0;
            model.PlayerModel = new Components.Models.AudioPlayer(model.PlayerData);
            model.PlayerModel.on(Events.EVENT_SAVE_COURSE_DATA, model.onSendDataToScorm, model);
            model.PlayerModel.once(Events.EVENT_MARK_COURSE_COMPLETE, model.onMarkCourseComplete, model);


            model.CarouselModel = new Components.Models.Carousel(model.Carousel);

            // hasCarousel = model.Carousel.hasCarousel;
            //alert(model.ShowExitButton)
           // PlayerData
           console.log("model.Carousel")
           console.log(model.CarouselModel)
            //Carousel

            options.knowledgechecks = options.knowledgechecks || { "enabled": false };
            model.KnowledgeCheck = new Components.Models.KnowledgeCheck(options.knowledgechecks);
            if (model.CourseMode === DataStructures.CourseMode.CPE && model.KnowledgeCheck.Enabled) {
                model.PlayerModel.CuePoints = model.KnowledgeCheck.getCuePoints(model.PlayerModel.Playlist.CurrentItem.Id);
                model.PlayerModel.CuePointDelta = model.KnowledgeCheck.CuePointDelta;
            }

            model.CourseComplete = false;

            if (model.CourseMode === DataStructures.CourseMode.CPE
                && options.assessmentData
                && options.assessmentData.hasAssessment
            ) {
                if (model.ScormPreviousData) {
                    options.assessmentData.scormData = model.ScormPreviousData.assessment;
                }
                model.Assessment = new Components.Models.Assessment(options.assessmentData);
            }

            if (model.CourseMode === DataStructures.CourseMode.CPE
                && options.surveyData
                && options.surveyData.hasSurvey
            ) {
                model.Survey = new Components.Models.Survey(options.surveyData);
            }
        }

        @named
        private getScormData(): any {
            let model: Course = this,
                ScormPreviousData: string = null;
            // if (!Utilities.ScormWrapper.Instance.firstLaunch()) {
            ScormPreviousData = Utilities.ScormWrapper.Instance.getLessonLocation();
            if (ScormPreviousData) {
                model.ScormPreviousData = JSON.parse(ScormPreviousData);
            }
            else {
                Utilities.consoleTrace("lesson_location not found on SCORM.");
            }
            // }

            if (!model.ScormPreviousData) {
                // if there's no ScormPreviousData then make sure there will be at least an empty object for next launch.
                Utilities.consoleTrace("Adding empty value for lesson_location on SCORM.");
                model.ScormPreviousData = {};
                model.sendDataToScorm();
            }

            return model.ScormPreviousData;
        }

        @named
        private onSendDataToScorm(data: any): void {
            let model: Course = this;

            model.ScormPreviousData = data;
            model.sendDataToScorm();
        }

        @named
        private sendDataToScorm(): void {
            let model: Course = this,
                scorm: Utilities.ScormWrapper = Utilities.ScormWrapper.Instance,
                scormData: string = "";

            scormData = JSON.stringify(model.ScormPreviousData);

            if (scorm.setLessonLocation(scormData)) {
                if (!scorm.commit()) {
                    Utilities.consoleWarn("Warning: Failed to COMMIT the set value to scorm. value: ", scormData);
                }
            }
            else {
                Utilities.consoleWarn("Failed to set value to scorm. Value: ", scormData);
            }
        }

        @named
        private onMarkCourseComplete(): void {
            let model: Course = this,
                status = Utilities.ScormWrapper.CONSTANTS.Status;

            if (model.Assessment && model.Assessment.ScormData.status !== status.Passed) {
                // don't set completion here if assessment is present.
                return;
            }

            model.CourseComplete = true;

            if (model.scorm.setCompletionStatus(status.Completed)) {
                if (!model.scorm.commit()) {
                    Utilities.consoleWarn("Warning: Failed to COMMIT the set completed to scorm...");
                }
            }
            else {
                Utilities.consoleWarn("Failed to set completed status to SCORM.");
            }
        }

        @named
        public saveCompletionAfterAssessment(): void {
            let model: Course = this,
                completionStatus = Utilities.ScormWrapper.CONSTANTS.Status.Completed,
                score = model.Assessment.ScormData.score ? model.Assessment.ScormData.score : 0,
                status = model.Assessment.ScormData.status ? model.Assessment.ScormData.status : Utilities.ScormWrapper.CONSTANTS.Status.Failed;

            model.CourseComplete = (model.Assessment.ScormData.score >= model.Assessment.PassingPercent);

            if (model.scorm.CurrentSCORM.Name === Utilities.ScormWrapper.CONSTANTS.SCORM2004.Name) {
                score = (score / 100);
            }
            if (model.scorm.setScore(score)) {
                if (!model.scorm.commit()) {
                    Utilities.consoleWarn("Warning: Failed to COMMIT the set score to scorm...");
                }
            }
            else {
                Utilities.consoleWarn("Failed to set score to SCORM.");
            }

            if (model.scorm.CurrentSCORM.Name === Utilities.ScormWrapper.CONSTANTS.SCORM12.Name) {
                completionStatus = model.CourseComplete
                    ? Utilities.ScormWrapper.CONSTANTS.Status.Passed
                    : Utilities.ScormWrapper.CONSTANTS.Status.Failed;
            }
            else if (model.scorm.CurrentSCORM.Name === Utilities.ScormWrapper.CONSTANTS.SCORM2004.Name) {
                if (model.scorm.setLessonStatus(status)) {
                    if (!model.scorm.commit()) {
                        Utilities.consoleWarn("Warning: Failed to COMMIT the set LessonStatus to scorm...");
                    }
                }
                else {
                    Utilities.consoleWarn("Failed to set LessonStatus to SCORM.");
                }
                completionStatus = model.CourseComplete
                    ? Utilities.ScormWrapper.CONSTANTS.Status.Completed
                    : Utilities.ScormWrapper.CONSTANTS.Status.Incomplete;
            }

            if (model.scorm.setCompletionStatus(completionStatus)) {
                if (!model.scorm.commit()) {
                    Utilities.consoleWarn("Warning: Failed to COMMIT the set completed to scorm...");
                }
            }
            else {
                Utilities.consoleWarn("Failed to set completed status to SCORM.");
            }
        }

        @named
        private setLessonStatusIncomplete(): void {
            let model: Course = this,
                lessonStatus: string = model.scorm.getCompletionStatus();
            Utilities.consoleTrace("Lesson Status: ", lessonStatus);
            if (!lessonStatus
                || lessonStatus === Utilities.ScormWrapper.CONSTANTS.Status.Browsed
                || lessonStatus === Utilities.ScormWrapper.CONSTANTS.Status.NotAttempted
                || lessonStatus === Utilities.ScormWrapper.CONSTANTS.Status.Unknown) {
                Utilities.consoleTrace("Setting lesson status to incomplete. Prev status: ", lessonStatus);
                if (model.scorm.setCompletionStatus(Utilities.ScormWrapper.CONSTANTS.Status.Incomplete)) {
                    if (!model.scorm.commit()) {
                        Utilities.consoleWarn("Failed to COMMIT the set completed to scorm...");
                    }
                }
                else {
                    Utilities.consoleWarn("Failed to set completed status to SCORM.");
                }
            }
            else {
                Utilities.consoleTrace("Not setting Lesson Status to incomplete as it is already: ", lessonStatus);
            }
        }

        @named
        private setLessonStatusComplete(): void {
            let model: Course = this;
            let lessonStatus: string = model.scorm.getCompletionStatus();
            Utilities.consoleTrace("Lesson Status: ", lessonStatus);
            if (Utilities.ScormWrapper.CONSTANTS.Status.Completed !== lessonStatus) {
                Utilities.consoleTrace("Setting lesson status to complete. Prev status: ", lessonStatus);
                if (model.scorm.setCompletionStatus(Utilities.ScormWrapper.CONSTANTS.Status.Completed)) {
                    if (!model.scorm.commit()) {
                        Utilities.consoleWarn("Failed to COMMIT the set completed to scorm...");
                    }
                }
                else {
                    Utilities.consoleWarn("Failed to set completed status to SCORM.");
                }
            }
            else {
                Utilities.consoleTrace("Not setting Lesson Status to complete as it is already: ", lessonStatus);
            }
        }

        @named
        public terminateScormComm(): void {
            let model: Course = this;
            model.exitScormComm();
            model.scorm.finish();
        }

        @named
        public exitScormComm(): void {
            let model: Course = this;
            if (model.scorm.CurrentSCORM.Name === Utilities.ScormWrapper.CONSTANTS.SCORM12.Name) {
                model.scorm.exit(model.CourseComplete ? model.scorm.CurrentSCORM.DefaultValues.ExitLogout : model.scorm.CurrentSCORM.DefaultValues.ExitSuspend);
            }
            if (model.scorm.CurrentSCORM.Name === Utilities.ScormWrapper.CONSTANTS.SCORM2004.Name) {
                model.scorm.exit(model.scorm.CurrentSCORM.DefaultValues.ExitNormal);
            }
        }
    }
}