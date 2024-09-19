/// <reference path="../model/survey-question.ts" />

namespace HTML5AudioPlayer.Components.Models {
    export class SurveyMultiSelect extends SurveyQuestion {

        get SelectedAnswer(): DataStructures.SurveyQuestionResponse { return this.get("selectedAnswer"); }
        set SelectedAnswer(value: DataStructures.SurveyQuestionResponse) { this.set("selectedAnswer", value); }

        constructor(options: any) {
            super(options);
        }

        public processAnswerData(answer: string): void {
            let model = this,
                answerObj: DataStructures.SurveyQuestionResponse = {
                    questionId: model.QuestionId,
                    questionType: model.QuestionType,
                    question: model.Question,
                    answer: answer
                }
            model.SelectedAnswer = answerObj;
        }
    }
}