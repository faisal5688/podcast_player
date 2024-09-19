/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/survey.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Survey extends Backbone.View<Models.Survey> {

        private _template: (properties?: HandlebarsTemplates) => string;
        private _surveyQuestionView: Views.SurveyQuestion[];

        constructor(options: Backbone.ViewOptions<Models.Survey>) {
            super(options);
            let surveyView: Survey = this;

            surveyView._surveyQuestionView = new Array<SurveyQuestion>();

            surveyView._template = HBTemplates['survey'];
            surveyView.$el.addClass("survey-container");
            surveyView.createQuestionView();
        }

        public events(): Backbone.EventsHash {
            return {
                'click .submit-btn': 'onSubmitClicked'
            };
        }

        public render() {
            let surveyView = this,
                surveyModel: Models.Survey = surveyView.model;

            surveyView.$el.html(surveyView._template(surveyModel.toJSON()));

            for (let i = 0; i < surveyView._surveyQuestionView.length; i++) {
                let surveyQuestion = surveyView._surveyQuestionView[i];
                surveyView.$(".survey-question-container").append(surveyQuestion.render().$el);
            }
            return surveyView;
        }

        @named
        public afterRender(): void {
            let surveyView = this;
            for (let i = 0; i < surveyView._surveyQuestionView.length; i++) {
                let surveyQuestion = surveyView._surveyQuestionView[i];
                surveyQuestion.afterRender();
            }
        }

        private onSubmitClicked(ev: any): void {
            let surveyView: Survey = this;
            if ($(ev.target).hasClass("disabled")) {
                return;
            }
            Utilities.showLoader(true);
            surveyView.setInteractionsData();
        }

        @named
        public setInteractionsData(): void {
            let surveyView: Survey = this,
                surveyModel: Models.Survey = surveyView.model,
                scorm = Utilities.ScormWrapper.Instance,
                quesNo: number = 0,
                questionslen = Object.keys(surveyModel.Answers).length;

            for (let key in surveyModel.Answers) {
                if (Object.prototype.hasOwnProperty.call(surveyModel.Answers, key)) {
                    const curObj = new Utilities.ScormInteractions(surveyModel.Answers[key]);
                    if (!curObj.QuestionType) {
                        continue;
                    }
                    scorm.setInteractionsData(curObj, "survey", quesNo, questionslen);
                    quesNo++;
                }
            }
            Utilities.showLoader(false);
            surveyView.closeSurvey();
            surveyModel.setSurveyScromData();
            surveyView.trigger(Events.EVENT_SURVEY_COMPLETED);
        }

        public showSurvey(): void {
            let surveyView: Survey = this;
            surveyView.render();
            surveyView.afterRender();
            surveyView.$el.show(200);
        }

        private createQuestionView(): void {
            let surveyView: Survey = this,
                surveyModel: Models.Survey = surveyView.model;

            for (let i = 0; i < surveyModel.SurveyQuestions.length; i++) {
                let questionModel = surveyModel.SurveyQuestions[i];
                switch (questionModel.QuestionType) {
                    case DataStructures.ADType.MCSS:
                        let singleSelectView: Views.SurveySingleSelect = new SurveySingleSelect({
                            model: questionModel
                        });
                        singleSelectView.on(Events.EVENT_QUESTION_ANSWERED, surveyView.onAnswerUpdated, surveyView);
                        surveyView._surveyQuestionView.push(singleSelectView);
                        break;

                    case DataStructures.ADType.MCMS:
                        let multiSelectView: Views.SurveyMultiSelect = new SurveyMultiSelect({
                            model: questionModel
                        });
                        multiSelectView.on(Events.EVENT_QUESTION_ANSWERED, surveyView.onAnswerUpdated, surveyView);
                        surveyView._surveyQuestionView.push(multiSelectView);
                        break;
                }
            }
        }

        private onAnswerUpdated(selectedAnswer: DataStructures.SurveyQuestionResponse): void {
            let surveyView: Survey = this,
                surveyModel: Models.Survey = surveyView.model,
                enable: boolean = true;

            // Use surveyModel.getAnswerStatus() to questions validation.
            surveyModel.updateAnswers(selectedAnswer);
            surveyView.enableSubmit(enable);
        }

        private enableSubmit(status: boolean): void {
            let surveyView: Survey = this;
            if (status) {
                surveyView.$(".submit-btn").removeClass("disabled");
            }
            else {
                surveyView.$(".submit-btn").addClass("disabled");
            }
        }

        private closeSurvey(): void {
            let surveyView: Survey = this;
            surveyView.$el.hide(200, () => {
                surveyView.destroy();
            });
        }

        public destroy(): void {
            let surveyView: Survey = this;
            for (let i = 0; i < surveyView._surveyQuestionView.length; i++) {
                let surveyQuestion = surveyView._surveyQuestionView[i];
                surveyQuestion.destroy();
            }
            surveyView.unbind();
            surveyView.undelegateEvents();
            surveyView.$el.empty();
        }
    }
}