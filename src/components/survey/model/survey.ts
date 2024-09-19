namespace HTML5AudioPlayer.Components.Models {
    export class Survey extends Backbone.Model {

        get SurveyQuestions(): Models.SurveyQuestion[] { return this.get("surveyQuestions"); }
        set SurveyQuestions(value: Models.SurveyQuestion[]) { this.set("surveyQuestions", value); }

        get Answers(): Object { return this.get('answers') };
        set Answers(value: Object) { this.set('answers', value); };

        get ScormData(): DataStructures.SurveyScormData { return this.get('scormData') };
        set ScormData(value: DataStructures.SurveyScormData) { this.set('scormData', value); };

        get Questions(): any { return this.get("questions"); }

        constructor(options: any) {
            super(options);
            let model: Survey = this;
            model.Answers = {};
            model.createQuestionModel();
        }

        public createQuestionModel(): void {
            let model: Survey = this;

            model.SurveyQuestions = new Array<Models.SurveyQuestion>();

            for (let i = 0; i < model.Questions.length; i++) {
                let question = model.Questions[i],
                    questionModel: Models.SurveyQuestion = null;

                question.questionNo = (i + 1);
                switch (question.type) {
                    case DataStructures.ADType.MCSS:
                        questionModel = new Models.SurveySingleSelect(question);
                        break;
                    case DataStructures.ADType.MCMS:
                        questionModel = new Models.SurveyMultiSelect(question);
                        break;
                }
                if (questionModel) {
                    model.SurveyQuestions.push(questionModel);
                }
            }
        }

        @named
        public updateAnswers(selectedAnswer: DataStructures.SurveyQuestionResponse): void {
            let model: Survey = this;

            model.Answers[selectedAnswer.questionId] = {
                questionId: selectedAnswer.questionId,
                questionType: selectedAnswer.questionType,
                question: selectedAnswer.question,
                answer: selectedAnswer.answer
            }
            Utilities.consoleLog("Answer", model.Answers);
        }

        public getAnswerStatus(): boolean {
            let model = this,
                enable = false;

            for (let i = 0; i < model.SurveyQuestions.length; i++) {
                let question = model.SurveyQuestions[i];
                if (!question.Selected) {
                    enable = false;
                    break;
                }
                enable = question.Selected;
            }
            return enable;
        }

        public setSurveyScromData(): void {
            let model = this
            model.ScormData = {
                completed: true
            };
        }
    }
}
