namespace HTML5AudioPlayer.Components.Models {

    export abstract class SurveyQuestion extends Backbone.Model {

        get QuestionId(): string { return this.get("id"); }
        set QuestionId(value: string) { this.set("id", value); }

        get QuestionType(): DataStructures.ADType { return this.get("type"); }
        set QuestionType(value: DataStructures.ADType) { this.set("type", value); }

        get Question(): string { return this.get("question"); }
        set Question(value: string) { this.set("question", value); }

        get Selected(): boolean { return this.get("selected"); }
        set Selected(value: boolean) { this.set("selected", value); }

        get QuestionNo(): boolean { return this.get("questionNo"); }
        set QuestionNo(value: boolean) { this.set("questionNo", value); }

        constructor(options: any) {
            super(options);
            let model = this;
        }
    }
}