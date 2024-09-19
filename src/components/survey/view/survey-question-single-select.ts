/// <reference path="../view/survey-question.ts" />
/// <reference path="../model/survey-question-single-select.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class SurveySingleSelect extends SurveyQuestion<Models.SurveySingleSelect> {

        constructor(options: any) {
            super(options);
            let surveySingleSelectView: SurveySingleSelect = this;

            surveySingleSelectView._templateDerived = HBTemplates['survey-question-single-select'];
        }

        public events(): Backbone.EventsHash {
            return _.extend({
                "change .mcss-option": "onOptionChange",
            }, super.events());
        }

        public render() {
            let surveySingleSelectView = this,
                surveySingleSelectModel: Models.SurveySingleSelect = surveySingleSelectView.model;

            super.render();
            surveySingleSelectView.$el.html(surveySingleSelectView._templateDerived(surveySingleSelectModel.toJSON()));
            return surveySingleSelectView;
        }

        public afterRender() {
            super.afterRender();
        }

        private onOptionChange(ev: any): void {
            let surveySingleSelectView = this,
                surveySingleSelectModel: Models.SurveySingleSelect = surveySingleSelectView.model,
                answerText = ev.target.value;

            surveySingleSelectModel.processAnswerData(answerText);
            surveySingleSelectView.trigger(Events.EVENT_QUESTION_ANSWERED, surveySingleSelectModel.SelectedAnswer);
        }

        public destroy(): void {
            super.destroy();
        }
    }
}