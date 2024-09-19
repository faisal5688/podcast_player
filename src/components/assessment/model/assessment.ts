/// <reference path="../../playlist/model/playlist.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class Assessment extends Backbone.Model {


        get PassingPercent(): number {
            return this.get("passingPercent");
        }
        set PassingPercent(value: number) {
            this.set("passingPercent", value);
        }


        get assessmentResultText(): string {
            return this.get("assessmentResultText");
        }
        set assessmentResultText(value: string) {
            this.set("assessmentResultText", value);
        }

        get CuePointDelta(): number {
            return this.get("cuepointdelta");
        }
        set CuePointDelta(value: number) {
            this.set("cuepointdelta", value);
        }

        get UserAnswers(): string[] {
            return this.get("UserAnswers");
        }
        set UserAnswers(value: string[]) {
            this.set("UserAnswers", value);
        }

        get UserCorrectAnswers(): string[] {
            return this.get("UserCorrectAnswers");
        }
        set UserCorrectAnswers(value: string[]) {
            this.set("UserCorrectAnswers", value);
        }

        get startPage(): DataStructures.startPage {
            return this.get("startPage");
        }
        set startPage(value: DataStructures.startPage) {
            this.set("startPage", value);
        }

        get resultPage(): DataStructures.resultPage {
            return this.get("resultPage");
        }
        set resultPage(value: DataStructures.resultPage) {
            this.set("resultPage", value);
        }

        get AssessmentData(): DataStructures.AssessmentData {
            return this.get("assessment");
        }
        set AssessmentData(value: DataStructures.AssessmentData) {
            this.set("assessment", value);
        }

        get DisplayQuestions(): DataStructures.AQData[] {
            return this.get("DisplayQuestions");
        }
        set DisplayQuestions(value: DataStructures.AQData[]) {
            this.set("DisplayQuestions", value);
        }

        get currentQuestionData(): DataStructures.AQBody {
            return this.get("currentQuestionData");
        }
        set currentQuestionData(value: DataStructures.AQBody) {
            this.set("currentQuestionData", value);
        }

        get currentMCQData(): DataStructures.MCQData {
            return this.get("currentMCQData");
        }
        set currentMCQData(value: DataStructures.MCQData) {
            this.set("currentMCQData", value);
        }

        get NumOfQuestionToDisplay(): number {
            return this.get("NumOfQuestionToDisplay");
        }
        set NumOfQuestionToDisplay(value: number) {
            this.set("NumOfQuestionToDisplay", value);
        }

        get NumCurrentQuestionDisplay(): number {
            return this.get("NumCurrentQuestionDisplay");
        }
        set NumCurrentQuestionDisplay(value: number) {
            this.set("NumCurrentQuestionDisplay", value);
        }

        get ScormData(): DataStructures.AssessmentScormData {
            return this.get("scormData");
        }
        set ScormData(value: DataStructures.AssessmentScormData) {
            this.set("scormData", value);
        }
        get HasAssessment(): boolean {
            return this.get("hasAssessment");
        }
        set HasAssessment(value: boolean) {
            this.set("hasAssessment", value);
        }

        get HasBackButton(): boolean {
            return this.get("hasBackButton");
        }
        set HasBackButton(value: boolean) {
            this.set("hasBackButton", value);
        }

        get RandomQuesNum(): any {
            return this.get("randomQuesNum");
        }
        set RandomQuesNum(value: any) {
            this.set("randomQuesNum", value);
        }

        constructor(options: any) {
            super(options);
            let model: Assessment = this;
            model.set("APP_MODE", APP_MODE);
            model.currentQuestionData = null;
            model.currentMCQData = null;
            model.RandomQuesNum = [];
            model.UserAnswers = new Array<string>();
            model.UserCorrectAnswers = new Array<string>();
            model.assessmentResultText = null;
            model.ScormData = model.ScormData || new DataStructures.AssessmentScormData();
        }

        @named
        public initAssessment(): void {
            let model: Assessment = this;
            model.DisplayQuestions = new Array<DataStructures.AQData>();
            model.NumOfQuestionToDisplay = 0;
            model.NumCurrentQuestionDisplay = 0;
            model.RandomQuesNum = [];
            for (let i = 0; i < model.AssessmentData.module[0].pool.bank.length; i++) {
                const curBank = model.AssessmentData.module[0].pool.bank[i];
                if (curBank.isRandomize == "true") {
                    model.getRandomNumberBetween(curBank.numQuesToDisplay, (curBank.question.length + 1));
                }
                for (let j = 0; j < parseInt(curBank.numQuesToDisplay); j++) {
                    let question: any;
                    if (curBank.isRandomize == "true") {
                        question = curBank.question[model.RandomQuesNum[j]];
                    } else {
                        question = curBank.question[j];
                    }
                    // question.body.MCQ.randomizeOptions
                    //Utilities.consoleLog("questions " + question)
                    model.randomArrayShuffle(question.body.MCQ.choices.choice)
                    model.DisplayQuestions.push(question);
                }
            }
            //model.randomArrayShuffle(model.DisplayQuestions);
            model.NumOfQuestionToDisplay = model.DisplayQuestions.length;
            // Utilities.consoleLog("DisplayQuestions ", model.DisplayQuestions);
            // Utilities.consoleLog("upadteLogic ", model.DisplayQuestions);

        }

        public getRandomNumberBetween(genNumbers, maxNumbers): void {
            let model: Assessment = this;
            model.RandomQuesNum = [];
            while (model.RandomQuesNum.length < genNumbers) {
                var r = Math.floor(Math.random() * (maxNumbers - 1));
                if (model.RandomQuesNum.indexOf(r) === -1) model.RandomQuesNum.push(r);
            }

            Utilities.consoleLog("model.RandomQuesNum ", model.RandomQuesNum);
        }


        public randomArrayShuffle(array): void {
            var currentIndex = array.length,
                temporaryValue, randomIndex;
            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        }

        public setCurrentQuestion(index: number): void {
            let model: Assessment = this;
            model.NumCurrentQuestionDisplay++;
            model.currentQuestionData = model.DisplayQuestions[index].body;
            model.currentMCQData = model.currentQuestionData.MCQ;
        }
    }
}