/// <reference path="../model/course.ts" />

/// <reference path="../../components/audio-player/view/audio-player.ts" />
/// <reference path="../../components/knowledge-check/view/knowledge-check.ts" />
/// <reference path="../../components/assessment/view/assessment.ts" />
/// <reference path="../../components/survey/view/survey.ts" />
/// <reference path="../../components/carousel/view/carousel.ts" />




namespace HTML5AudioPlayer.Views {
    export class Course extends Backbone.View<Models.Course> {

        private _template: (properties?: HandlebarsTemplates) => string;
        public _player: Components.Views.AudioPlayer;
        private _knowledgeCheck: Components.Views.KnowledgeCheck;
        //private _knowledgeCheckList: Components.Views.KnowledgeCheckList;
        private _assessment: Components.Views.Assessment;
        private _survey: Components.Views.Survey;
        private _carousel: Components.Views.Carousel;
        private _item: Components.Models.PlaylistItem;

        constructor(options: any) {
            super(options);

            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;




            courseView._template = HBTemplates['course'];

            courseView.$el.addClass("course");

            courseView._player = new Components.Views.AudioPlayer({
                model: courseModel.PlayerModel,
            });

            courseView._carousel = new Components.Views.Carousel({
                model: courseModel.CarouselModel
            });

            // courseView._knowledgeCheckList = new Components.Views.KnowledgeCheckList({
            //     model: courseModel.KnowledgeCheck
            // });






            courseView._player.on(Events.EVENT_CUEPOINT_HIT, courseView.onCuePointHitPlaying, courseView);
            courseView._player.on(Events.EVENT_SELECTION_CHANGE, courseView.onVideoChanged, courseView);
            courseView._player.on(Events.EVENT_SHOW_GLOSSARY, courseView.onShowGlossary, courseView);
            courseView._player.on(Events.EVENT_SHOW_INDEX, courseView.onShowIndex, courseView);
            courseView._player.on(Events.EVENT_SHOW_RESOURCES, courseView.onShowResource, courseView);
            courseView._player.on(Events.EVENT_LAUNCH_ASSESSMNET, courseView.onLaunchAssessment, courseView);
            courseView._player.on(Events.EVENT_LAUNCH_SURVEY, courseView.onLaunchSurvey, courseView);
            courseView._player.on(Events.EVENT_CURRENT_QUESTION, courseView.getCurrentQuestion, courseView);
            courseView._player.on(Events.EVENT_CURRENT_KCITEM, courseView.getCurrentKcItem, courseView);

            //courseView._player.on(Events.EVENT_COMPLETE_QUESTION, courseView.markQuestionComplete, courseView);
            // courseView._player.on(Events.EVENT_AUDIOPLAYER_CHANGE, courseView.onAudioChanged, courseView);
            // courseView._player.on(Events.EVENT_AUDIOPLAYPAUSE_CHANGE, courseView.togglePlayPause, courseView);


        }

        public events(): Backbone.EventsHash {
            return {
                'click .launch-button': 'onLaunchCourse',
                'click .help-button': 'onOpenHelp',
                'click .exit-button': 'onCourseExit',

                'click .index-button': 'onShowIndex',
                'click .glossary-button': 'onShowGlossary',
                'click .resource-button': 'onShowResource',
            }
        }

        @named
        public render() {
            let courseView = this,
                courseModel: Models.Course = courseView.model;

            courseView.$el.html(courseView._template(courseModel.toJSON()));

            courseView.$("#course-body").append(courseView._player.render().$el);
            //courseView.trigger(Events.EVENT_AUDIOPLAYPAUSE_CHANGE, courseModel);



            return courseView;
        }

        @named
        public afterRender(): void {
            let courseView: Course = this;
            courseView._player.afterRender();

            courseView.$("#carousel-container").append(courseView._carousel.render().$el);
        }

        @named
        private onCuePointHitPlaying(cp: DataStructures.CuePoint, index?: number): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            Utilities.consoleTrace("Cuepoint hit: ", cp, courseView.cid);
            //alert("cp "+cp.id)
            courseView._player.enableKcItem(cp.id);
            courseModel.PlayerModel.sendDataToScorm();

        }



        @named
        private onCuePointHitList(cp: DataStructures.CuePoint, index?: any): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            Utilities.consoleTrace("Cuepoint hit: ", cp, courseView.cid);
            courseView._player.pause();
            if ((courseModel.CourseMode === DataStructures.CourseMode.CPE) &&
                courseModel.KnowledgeCheck.Enabled) {
                courseModel.KnowledgeCheck.setCurrentKC(cp.id);
                courseView._knowledgeCheck = new Components.Views.KnowledgeCheck({
                    model: courseModel.KnowledgeCheck,
                    el: "#knowledge-check-container"
                });
                //if(index){
                courseView._knowledgeCheck.setIndex(index)
                //alert(courseView._player.markKcKCItemComplete)
                //alert(courseView.kcItemActiveList())
                courseView._knowledgeCheck.setTotalActive(courseView._player.kcItemActiveList())
                courseView._knowledgeCheck.render();
                courseView._knowledgeCheck.once(Events.EVENT_KC_SHOWN, courseView.onListKCShown, courseView);
                courseView._knowledgeCheck.once(Events.EVENT_KC_COMPLETE, courseView.onListKCComplete, courseView);
                courseView._knowledgeCheck.once(Events.EVENT_KC_NEXT, courseView.onListKCNext, courseView);
                courseView._knowledgeCheck.once(Events.EVENT_KC_Back, courseView.onListKCBack, courseView);
                courseView._knowledgeCheck.show();
            }
        }

        private getCurrentKcItem(item: Components.Models.PlaylistItem): void {
            //alert("getCurrentQuestion "+item.Id);

            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            courseView._item = item;
            console.log(courseView._item.Index)
            courseView.onCuePointHitList(courseModel.KnowledgeCheck.getCurrentCuePointsById(courseView._item.Id)[0],courseView._item.Index);
        }

        private onListKCNext(kc: DataStructures.KCData, increment?: any) {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model,
                curIndex: number = increment ? (kc.index + 2) : kc.index + 1,
                curKcId:string = "kc-00"+curIndex;
                console.log(kc)
                kc = courseView._knowledgeCheck.model.KnowledgeChecks[courseView._knowledgeCheck.getIndex()-1];
                courseView._player.markKcKCItemComplete(kc.id);
                courseView.onCuePointHitList(courseModel.KnowledgeCheck.getCurrentCuePointsById(curKcId)[0],curIndex);

        }




        private onListKCBack(kc: DataStructures.KCData, increment?: boolean) {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model,
                curIndex: number = increment ? (kc.index + 2) : kc.index - 1;
            //courseView.onCuePointHit(courseModel.KnowledgeCheck.getCurrentCuePoints(courseView._item.Id)[curIndex - 1], curIndex);

        }
        @named
        private onListKCShown(kc: DataStructures.KCData): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            if (courseModel.CourseMode === DataStructures.CourseMode.CPE && courseModel.KnowledgeCheck.Enabled) {
                courseView._knowledgeCheck.afterRender();
            }
        }

        @named
        private onListKCComplete(kc: DataStructures.KCData,curIndex?:Number): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model,
                curKcId:string = "kc-00"+curIndex;
                kc = courseView._knowledgeCheck.model.KnowledgeChecks[courseView._knowledgeCheck.getIndex()-1];

            console.log("******************"+kc.id)
            courseView._player.markKcKCItemComplete(kc.id);

            //courseModel.ScormPreviousData.CuePoints =courseModel.KnowledgeCheck.CuePoints
            courseModel.PlayerModel.sendDataToScorm();

            //kcItemActiveList
            courseView._knowledgeCheck.destroy();
        }











        @named
        private onCuePointHit(cp: DataStructures.CuePoint, index?: number): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            Utilities.consoleTrace("Cuepoint hit: ", cp, courseView.cid);
            courseView._player.pause();
            if ((courseModel.CourseMode === DataStructures.CourseMode.CPE) &&
                courseModel.KnowledgeCheck.Enabled) {
                courseModel.KnowledgeCheck.setCurrentKC(cp.id);
                courseView._knowledgeCheck = new Components.Views.KnowledgeCheck({
                    model: courseModel.KnowledgeCheck,
                    el: "#knowledge-check-container"
                });
                //if(index){
                courseView._knowledgeCheck.setIndex(index)
                //}
                courseView._knowledgeCheck.render();
                courseView._knowledgeCheck.once(Events.EVENT_KC_SHOWN, courseView.onKCShown, courseView);
                courseView._knowledgeCheck.once(Events.EVENT_KC_COMPLETE, courseView.onKCComplete, courseView);
                courseView._knowledgeCheck.once(Events.EVENT_KC_NEXT, courseView.onKCNext, courseView);
                courseView._knowledgeCheck.show();
            }
        }






        private getCurrentQuestion(item: Components.Models.PlaylistItem): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            courseView._item = item;
            //console.log(courseView._item)

            courseView.onCuePointHit(courseModel.KnowledgeCheck.getCurrentCuePoints(courseView._item.Id)[0], 1);
        }

        private onKCNext(kc: DataStructures.KCData, increment?: boolean) {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model,
                curIndex: number = increment ? (kc.index + 2) : kc.index + 1;

            //courseView._knowledgeCheck.getIndex()

            //alert(curIndex)
            //alert(courseModel.KnowledgeCheck.getCurrentCuePoints(courseView._item.Id).length)
            //alert(courseView._item.Id)

            courseView.onCuePointHit(courseModel.KnowledgeCheck.getCurrentCuePoints(courseView._item.Id)[curIndex - 1], curIndex);

            //courseView._knowledgeCheck.setIndex(2)
            //courseView._item=item;
            // courseView.onCuePointHit(courseModel.KnowledgeCheck.getCurrentCuePoints(courseView._item.Id)[0]);
        }



        @named
        private onKCShown(kc: DataStructures.KCData): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            if (courseModel.CourseMode === DataStructures.CourseMode.CPE && courseModel.KnowledgeCheck.Enabled) {
                courseView._knowledgeCheck.afterRender();
            }
        }

        @named
        private onKCComplete(kc: DataStructures.KCData): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            // if ("end" === kc.time) {
            //     // mark current video complete and send completion status to scorm
            //     courseView._player.markCurrentVideoComplete();
            //     courseView._player.enableNext();
            //     if (courseModel.PlayerModel.AutoAdvanceToNext) {
            //         courseView._player.next();
            //     }

            //     courseModel.PlayerModel.sendDataToScorm();
            // }
            // else {
            //     //courseView._player.play();
            // }

            courseView._player.markKcComplete(courseView._item.Id);
            //courseView._item.Kccomplete=true;
            //console.log("courseView._item")
            //console.log(courseView._item)
            courseModel.PlayerModel.sendDataToScorm();
            courseView._knowledgeCheck.destroy();
        }

        @named
        // private markQuestionComplete(): void {
        //     alert("markQuestionComplete")
        // }~




        @named
        private onShowGlossary(): void {
            Utilities.openPdf(this.model.GlossaryPDF);
        }

        @named
        private onShowIndex(): void {
            Utilities.openPdf(this.model.IndexPDF);
        }

        @named
        private onShowResource(): void {
            Utilities.openPdf(this.model.ResourcePDF);
        }

        @named
        private onAudioChanged(): void {
            console.log("*******************************course onAudioChanged*****************************");
            //alert()
            // let courseView: Course = this,
            //     courseModel: Models.Course = courseView.model;
            // courseView._audioPlayer.audioPlayer = courseView._player;
            // courseView._audioPlayer.afterRender(courseView._player);
            // courseView._player.play();


        }

        @named
        private togglePlayPause(): void {
            console.log("*******************************course togglePlayPause*****************************");

        }
        @named
        private onVideoChanged(item: Components.Models.PlaylistItem): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            if (courseModel.CourseMode === DataStructures.CourseMode.CPE && courseModel.KnowledgeCheck.Enabled) {
                courseModel.PlayerModel.CuePoints = courseModel.KnowledgeCheck.getCuePoints(item.Id);
            }
        }

        @named
        private onLaunchCourse(): void {
            let courseView: Course = this,
                launcher = courseView.$(".launch-holder");

            launcher.one(Events.CSS_ANIMATION_END, function (evt) {
                launcher.remove();
            }).addClass("to-hide");
        }

        @named
        private onCourseExit(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            if (courseModel.ExitPopup) {
                let modal: Components.Models.ModalDialog = new Components.Models.ModalDialog({
                    "heading": courseModel.ExitPopup.heading,
                    "hasclose": false,
                    "hasProgressbar": false,
                    "content": courseModel.ExitPopup.content,
                    "buttons": courseModel.ExitPopup.buttons
                }),
                    modalView: Components.Views.ModalDialog = new Components.Views.ModalDialog({
                        model: modal
                    }),
                    wasPlaying = false;

                if (!courseView._player.paused()) {
                    courseView._player.pause();
                    wasPlaying = true;
                }

                modalView.once(Events.EVENT_MODAL_CLOSED, function (buttonID: string) {
                    if (buttonID === "ok") {
                        try {
                            if (window.top)
                                window.top.close();
                            else
                                window.close();
                        }
                        catch (err) {
                            Utilities.consoleWarn("Failed to close the window. Error:", err);
                        }
                    }
                    else {
                        if (wasPlaying) {
                            courseView._player.play();
                        }
                    }
                });
                modalView.showModal();
            }
            else {
                try {
                    window.close();
                }
                catch (err) {
                    Utilities.consoleWarn("Failed to close the window. Error:", err);
                }
            }
        }

        private onOpenHelp(): void {
            Utilities.openPdf(this.model.Help.url);
        }

        private onLaunchAssessment(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;

            if (!courseModel.Assessment) {
                // no assessment available.
                return;
            }
            courseView._player.enable();
            courseView._assessment = new Components.Views.Assessment({
                model: courseModel.Assessment,
                el: "#assessment-container"
            });
            courseView._assessment.model.initAssessment();
            courseView._assessment.model.setCurrentQuestion(0);
            courseView._assessment.render();
            courseView._assessment.once(Events.EVENT_ASSESSMENT_COMPLETE, courseView.markAssessmentComplete, courseView);
            courseView._assessment.once(Events.EVENT_ASSESSMENT_STATUS, courseView.updateAssessmentStatus, courseView);
            courseView._assessment.on(Events.EVENT_ASSESSMENT_CLOSE, courseView.assessmentClose, courseView);
            courseView._assessment.show();
            courseView._assessment.checkAssessmentComplete();
            courseView._player.pause();
        }

        @named
        private onLaunchSurvey(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;

            if (!courseModel.Survey) {
                // no survey available.
                return;
            }
            courseView._player.enable();
            courseView._survey = new Components.Views.Survey({
                model: courseModel.Survey,
                el: "#survey-container"
            });
            courseView._survey.showSurvey();
            courseView._survey.once(Events.EVENT_SURVEY_COMPLETED, courseView.onSurveyCompleted, courseView);
            courseView._player.pause();
        }

        @named
        private onSurveyCompleted(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            courseModel.ScormPreviousData.survey = courseModel.Survey.ScormData;
            courseView._player.markSurveyCompleted();
            courseModel.PlayerModel.sendDataToScorm();
            courseView._survey.destroy();
        }

        @named
        private markAssessmentComplete(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            courseView._player.markAssessmentComplete();
            courseModel.ScormPreviousData.assessment = courseModel.Assessment.ScormData;
            courseModel.PlayerModel.sendDataToScorm();
            courseModel.saveCompletionAfterAssessment();
            courseView._player.assessmentCompleted();
            courseView._assessment.destroy();
        }

        @named
        private updateAssessmentStatus(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            courseView._player.markAssessmentComplete();
            courseModel.ScormPreviousData.assessment = courseModel.Assessment.ScormData;
            courseModel.PlayerModel.sendDataToScorm();
            courseModel.saveCompletionAfterAssessment();
        }

        @named
        private assessmentClose(): void {
            let courseView: Course = this,
                courseModel: Models.Course = courseView.model;
            if (courseModel.ExitPopup) {
                let modal: Components.Models.ModalDialog = new Components.Models.ModalDialog({
                    "heading": courseModel.ExitPopup.heading,
                    "hasclose": false,
                    "hasProgressbar": false,
                    "content": courseView._assessment.model.resultPage.AssessmentCloseText,
                    "buttons": courseModel.ExitPopup.buttons
                }),
                    modalView: Components.Views.ModalDialog = new Components.Views.ModalDialog({
                        model: modal
                    }),
                    wasPlaying = false;

                if (!courseView._player.paused()) {
                    //courseView._player.pause();
                    // wasPlaying = true;
                }

                modalView.once(Events.EVENT_MODAL_CLOSED, function (buttonID: string) {
                    if (buttonID === "ok") {
                        try {
                            //window.close();
                            courseView._assessment.$el.hide(200, () => {
                                courseView.markAssessmentComplete();
                            });
                        } catch (err) {
                            Utilities.consoleWarn("Failed to close the window. Error:", err);
                        }
                    } else {
                        // if (wasPlaying) {
                        //     courseView._player.play();
                        // }
                    }
                });
                modalView.showModal();
            } else {
                try {
                    // window.close();
                } catch (err) {
                    Utilities.consoleWarn("Failed to close the window. Error:", err);
                }
            }
        }
    }
}