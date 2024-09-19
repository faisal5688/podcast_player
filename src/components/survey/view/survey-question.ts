
/// <reference path="../model/survey-question.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export abstract class SurveyQuestion<TModel extends Models.SurveyQuestion = Models.SurveyQuestion> extends Backbone.View<TModel> {

        private _template: (properties?: HandlebarsTemplates) => string;
        protected _templateDerived: (properties?: HandlebarsTemplates) => string;

        constructor(options: any) {
            super(options);
            let surveyQuestionView: SurveyQuestion = this,
                surveyQuestionModel: Models.SurveyQuestion = surveyQuestionView.model;

            surveyQuestionView._template = HBTemplates['survey-question'];
            surveyQuestionView.$el.addClass("survey-question " + surveyQuestionModel.QuestionType)
        }

        public events(): Backbone.EventsHash {
            return {
                // "click .submit-btn": 'onSubmitClicked',
            };
        }

        public render() {
            let surveyQuestionView = this,
                surveyQuestionModel: Models.SurveyQuestion = surveyQuestionView.model;

            surveyQuestionView.$el.html(surveyQuestionView._template(surveyQuestionModel.toJSON()));
            return surveyQuestionView;
        }

        public afterRender() { }

        public destroy(): void {
            let surveyQuestionView: SurveyQuestion = this,
                surveyQuestionModel: Models.SurveyQuestion = surveyQuestionView.model;
            surveyQuestionModel.Selected = null;
            surveyQuestionView.undelegateEvents();
            surveyQuestionView.remove();
        }
    }
}