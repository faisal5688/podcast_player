/// <reference path="../view/survey-question.ts" />
/// <reference path="../model/survey-question-multi-select.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class SurveyMultiSelect extends SurveyQuestion<Models.SurveyMultiSelect> {

        constructor(options: any) {
            super(options);
            let surveyMultiView: SurveyMultiSelect = this;

            surveyMultiView._templateDerived = HBTemplates['survey-question-multi-select'];
        }

        public events(): Backbone.EventsHash {
            return _.extend({
                "change .mcms-option": "onOptionChange",
            }, super.events());
        }

        public render() {
            let surveyMultiSelectView = this,
                surveyMultiSelectModel: Models.SurveyMultiSelect = surveyMultiSelectView.model;

            super.render();
            surveyMultiSelectView.$el.html(surveyMultiSelectView._templateDerived(surveyMultiSelectModel.toJSON()));
            return surveyMultiSelectView;
        }

        public afterRender() {
            super.afterRender();
        }

        private onOptionChange(ev: any): void {
            let surveyMultiSelectView = this,
                surveyMultiSelectModel: Models.SurveyMultiSelect = surveyMultiSelectView.model,
                answer: string = surveyMultiSelectView.getSelectedOptions();

            surveyMultiSelectModel.processAnswerData(answer);
            surveyMultiSelectView.trigger(Events.EVENT_QUESTION_ANSWERED, surveyMultiSelectModel.SelectedAnswer);
        }

        private getSelectedOptions(): string {
            let surveyMultiSelectView = this,
                surveyMultiSelectModel: Models.SurveyMultiSelect = surveyMultiSelectView.model,
                selectedOptions = [];

            surveyMultiSelectView.$(".option input[type=checkbox]").each((i, elem) => {
                let isChecked = $(elem).prop("checked");
                if (isChecked) {
                    selectedOptions.push($(elem).val());
                }
            });
            surveyMultiSelectModel.Selected = false;
            if (selectedOptions.length > 0) {
                surveyMultiSelectModel.Selected = true;
            }
            return selectedOptions.join(" | ");
        }

        public destroy(): void {
            super.destroy();
        }
    }
}