/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/assessment.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Assessment extends Backbone.View<Models.Assessment> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: Backbone.ViewOptions<Models.Assessment>) {
            super(options);

            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model;

            assessmentView._template = HBTemplates['assessment'];

            assessmentView.$el.addClass("assessment-container");



        }

        public events(): Backbone.EventsHash {
            return {
                'click .start-btn': 'onStart',
                'click .ck-submit-btn': 'onSubmit',
                'click .ck-back-btn': 'onBack',
                'change .ck-option': 'onAssessmentOptionChange',
                'click .showRemedialShow': 'showRemedialClicked',
                'click .showRemedialHide': 'hideRemedialClicked',
                'click .closeBtn': 'closeClicked',
                'click .assessmentCloseBtn': 'assessmentCloseClicked',

            };
        }

        public render() {
            let assessmentView = this,
                assessmentModel: Models.Assessment = assessmentView.model,
                checkVisitedSateOnBack: any;
            assessmentView.$el.html(assessmentView._template(assessmentModel.toJSON()));
            if (!assessmentModel.HasBackButton) {
                assessmentView.$(".ck-back-btn").hide();
            }
            if (assessmentModel.NumCurrentQuestionDisplay <= 1) {
                assessmentView.$(".ck-back-btn").attr("disabled", "true").addClass("disabled");
            }
            assessmentView.$(".resultCloseBtn").show();
            if (assessmentModel.currentMCQData.category === DataStructures.ADType.MCSS) {
                checkVisitedSateOnBack = parseInt(assessmentModel.UserAnswers[assessmentModel.NumCurrentQuestionDisplay - 1])
                if (!isNaN(checkVisitedSateOnBack)) {
                    let selectedOptions = assessmentView.$('input[name=ck-option]');
                    let radioButtonAtIndex = selectedOptions[checkVisitedSateOnBack] as HTMLInputElement;
                    if (radioButtonAtIndex) {
                        radioButtonAtIndex.checked = true;
                    };
                    assessmentView.$(".ck-submit-btn").removeAttr("disabled").removeClass("disabled");
                }
            }
            return assessmentView;
        }

        public formatIndex(index) {
            return index + 1;
        }

        @named
        public afterRender(): void {
            let assessmentView: Assessment = this,
                $assessmentContent: JQuery = assessmentView.$(".assessment"),
                assessmentModel: Models.Assessment = assessmentView.model;

            try {
                $assessmentContent.mCustomScrollbar({
                    theme: "kpmg-blue"
                });

                assessmentView.$(".showRemedial").mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            } catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.assessment': ", err.message, err.stack);
            }

        }

        private onStart(e: any): void {
            let assessmentView: Assessment = this;
            assessmentView.$(".startAssessment").hide();
            assessmentView.$(".assessment").fadeIn(200);
        }

        private onBack(e: any): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model,
                selectedOptions: JQuery = assessmentView.$('input[name=ck-option]:checked');
            Utilities.consoleLog('assessmentModel.NumCurrentQuestionDisplay', assessmentModel.NumCurrentQuestionDisplay)
            assessmentModel.NumCurrentQuestionDisplay = assessmentModel.NumCurrentQuestionDisplay - 2;
            if (assessmentModel.NumCurrentQuestionDisplay < assessmentModel.NumOfQuestionToDisplay) {
                assessmentModel.setCurrentQuestion(assessmentModel.NumCurrentQuestionDisplay);
                assessmentView.render();
                assessmentView.show();
                assessmentView.$(".startAssessment").hide();
                assessmentView.$(".assessment").show();
                if (assessmentModel.NumCurrentQuestionDisplay > 1) {
                    assessmentView.$(".ck-back-btn").removeAttr("disabled").removeClass("disabled");
                } else {
                    assessmentView.$(".ck-back-btn").attr("disabled", "true").addClass("disabled");
                }
            }
        }

        private onSubmit(e: any): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model,
                selectedOptions: JQuery = assessmentView.$('input[name=ck-option]:checked');
            Utilities.consoleLog('assessmentModel.NumCurrentQuestionDisplay', assessmentModel.NumCurrentQuestionDisplay)
            if (assessmentModel.NumCurrentQuestionDisplay < assessmentModel.NumOfQuestionToDisplay) {
                assessmentModel.setCurrentQuestion(assessmentModel.NumCurrentQuestionDisplay);
                assessmentView.render();
                assessmentView.show();
                assessmentView.$(".startAssessment").hide();
                assessmentView.$(".assessment").show();
                if (assessmentModel.NumCurrentQuestionDisplay > 1) {
                    assessmentView.$(".ck-back-btn").removeAttr("disabled").removeClass("disabled");
                } else {
                    assessmentView.$(".ck-back-btn").attr("disabled", "true").addClass("disabled");
                }
            } else {
                assessmentView.$(".assessmentResultPage").show();
                assessmentView.$(".assessment").hide();
                assessmentView.showResultScreen();
            }

        }

        @named
        private onAssessmentOptionChange(e: any): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model,
                selectedOptions: JQuery = assessmentView.$('input[name=ck-option]:checked');

            if (selectedOptions.length > 0) {
                assessmentView.$(".ck-submit-btn").removeAttr("disabled").removeClass("disabled");
            } else {
                assessmentView.$(".ck-submit-btn").attr("disabled", "true").addClass("disabled");
            }


            if (assessmentModel.currentMCQData.category === DataStructures.ADType.MCMS) {
                if (e.currentTarget.checked) {
                    assessmentModel.UserAnswers.push(e.currentTarget.value);
                } else {
                    assessmentModel.UserAnswers = assessmentModel.UserAnswers.filter((item) => item !== e.currentTarget.value);
                }
            } else if (assessmentModel.currentMCQData.category === DataStructures.ADType.MCSS) {

                if (e.currentTarget.checked) {
                    assessmentModel.UserAnswers[assessmentModel.NumCurrentQuestionDisplay - 1] = e.currentTarget.value;
                } else {
                    assessmentModel.UserAnswers = assessmentModel.UserAnswers.filter((item) => item !== e.currentTarget.value);
                }
            }
            Utilities.consoleTrace("assessmentModel.UserAnswers: ", assessmentModel.UserAnswers);
        }
        private showResultScreen(): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model;
            let resultCounter = 0;
            for (let i = 0; i < assessmentModel.UserAnswers.length; i++) {
                const userAnser = assessmentModel.UserAnswers[i];
                const currentQuestionData = assessmentModel.DisplayQuestions[i].body;
                const currentMCQData = currentQuestionData.MCQ;
                if (currentMCQData.choices.choice[parseInt(userAnser)].correct == '1') {
                    resultCounter++;
                }
            }
            assessmentModel.ScormData.score = Math.round(resultCounter / assessmentModel.NumOfQuestionToDisplay * 100);
            assessmentView.$("#assessmentUserStatus").html("");
            assessmentView.$("#assessmentUserScore").html(assessmentModel.ScormData.score.toString());
            Utilities.consoleLog("resultCounter", resultCounter);
            Utilities.consoleLog("userPercent", assessmentModel.ScormData.score);
            if (assessmentModel.ScormData.score >= assessmentModel.PassingPercent) {
                assessmentModel.ScormData.status = "passed";
                assessmentView.$("#assessmentUserStatus").html(assessmentModel.resultPage.PassText.scoreLabel);
                assessmentView.$(".resultText").html(assessmentModel.resultPage.PassText.congratsText);
            } else {
                assessmentModel.ScormData.status = "failed";
                assessmentView.$("#assessmentUserStatus").html(assessmentModel.resultPage.FailText.scoreLabel);
                assessmentView.$(".resultText").html(assessmentModel.resultPage.FailText.FailSubTitle);
                assessmentView.$(".infoText").html(assessmentModel.resultPage.FailText.infoText);
            }

            if (assessmentModel.resultPage.linkText) {
                assessmentView.$(".linkText").html(assessmentModel.resultPage.linkText);
            }
            assessmentView.$("#remedialContent").html(assessmentView.getRemedialContent());
            assessmentView.trigger(Events.EVENT_ASSESSMENT_STATUS, assessmentModel.currentQuestionData);

        }

        private getRemedialContent() {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model,
                remedialStr = "";
            for (var r = 0; r < assessmentModel.UserAnswers.length; r++) {
                const userAnser = assessmentModel.UserAnswers[r],
                    currentQuestionData = assessmentModel.DisplayQuestions[r].body,
                    currentMCQData = currentQuestionData.MCQ;
                remedialStr += "<div  class='questContainer'><span class='textSpacing'><B>Question " + (r + 1) + " : </B>";
                remedialStr += currentQuestionData.question + "</span>";
                remedialStr += "<span class='textSpacing'><B>Your Answer: </B>";
                remedialStr += currentMCQData.choices.choice[parseInt(userAnser)]["cdata-section"] + "</span>";
                remedialStr += "<span class='textSpacing'><B>Result: </B>";
                if (currentMCQData.choices.choice[parseInt(userAnser)].correct == '1') {
                    remedialStr += "Correct </span></div>";
                } else {
                    remedialStr += "Incorrect </span></div>";
                }
            }
            return remedialStr;
        }

        private showRemedialClicked(e: any): void {
            let assessmentView: Assessment = this;
            assessmentView.$("#remedialContent").show();
            assessmentView.$(".showRemedialHide").show();
            assessmentView.$(".showRemedialShow").hide();
            assessmentView.$(".assessmentResultPage").addClass("detailed_feedback");
            assessmentView.$(".showRemedial").mCustomScrollbar({
                theme: "kpmg-blue"
            });
            assessmentView.$(".closeBtn").hide();

        }
        private hideRemedialClicked(e: any): void {
            let assessmentView: Assessment = this;
            assessmentView.$("#remedialContent").hide();
            assessmentView.$(".showRemedialHide").hide();
            assessmentView.$(".showRemedialShow").show();
            assessmentView.$(".closeBtn").show();
            assessmentView.$(".assessmentResultPage").removeClass("detailed_feedback");
        }

        private closeClicked(e: any): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model;

            assessmentModel.UserAnswers = []
            assessmentView.$el.fadeOut(200, () => {
                assessmentView.trigger(Events.EVENT_ASSESSMENT_COMPLETE, assessmentModel.currentQuestionData);
            });
        }
        private assessmentCloseClicked(e: any): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model;
            //alert(assessmentModel.resultPage.AssessmentCloseText);
            assessmentModel.UserAnswers = []
            assessmentView.trigger(Events.EVENT_ASSESSMENT_CLOSE, assessmentModel.currentQuestionData);
            // assessmentView.$el.hide(200, () => {
            //     assessmentView.trigger(Events.EVENT_ASSESSMENT_COMPLETE, assessmentModel.currentQuestionData);
            // });
        }



        public show(): void {
            let assessmentView: Assessment = this;
            assessmentView.$el.fadeIn(200);
        }

        public destroy(): void {
            let assessmentView: Assessment = this;
            assessmentView.unbind();
            assessmentView.undelegateEvents();
            assessmentView.$el.empty();
        }

        public checkAssessmentComplete(): void {
            let assessmentView: Assessment = this,
                assessmentModel: Models.Assessment = assessmentView.model;
            if (assessmentModel.ScormData) {
                if (assessmentModel.ScormData.score >= assessmentModel.PassingPercent) {
                    assessmentView.$(".start-btn").hide();
                    assessmentView.$(".content").html(
                        assessmentModel.startPage.successText
                        + " " + assessmentModel.ScormData.score + "%.");
                    assessmentView.$(".resultCloseBtn").show();

                }
            }
        }
    }
}