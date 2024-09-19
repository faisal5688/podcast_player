namespace HTML5AudioPlayer.Components.Views {

    export class QuestionlistItem extends Backbone.View<Models.QuestionlistItem> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: any) {
            super(options);

            let questionlistItemView: QuestionlistItem = this,
                questionlistItemModel: Models.QuestionlistItem = this.model;

            questionlistItemView._template = HBTemplates['queslist-item'];

           questionlistItemModel.on("change:numQuestions", questionlistItemView.render, questionlistItemView);
           questionlistItemModel.on("change:complete", questionlistItemView.render, questionlistItemView);
           questionlistItemModel.on("change:current", questionlistItemView.render, questionlistItemView);
           questionlistItemModel.on("change:disabled", questionlistItemView.render, questionlistItemView);
           questionlistItemModel.on("change:kccomplete", questionlistItemView.render, questionlistItemView);


        }

        events(): Backbone.EventsHash {
            return {
                'click': 'onQuestionClick'
            };
        }

        public render() {
            let questionlistItemView = this,
                questionlistItemModel: Models.QuestionlistItem = this.model;
            questionlistItemView.$el.html(questionlistItemView._template(questionlistItemModel.toJSON()));
            // if (questionlistItemModel.Current) {
            //     questionlistItemView.$el.addClass("current");
            // }
            // else {
            //     questionlistItemView.$el.removeClass("current");
            // }
            //alert("questionlistItemModel "+" "+questionlistItemModel.Disabled)
            if (questionlistItemModel.Disabled) {
                questionlistItemView.$el.addClass("disabled").removeClass("enabled");
            }
            else {
                questionlistItemView.$el.removeClass("disabled").addClass("enabled");
            }
            // if(questionlistItemModel.Complete){
            //     questionlistItemView.$el.removeClass("disabled").addClass("enabled");
            // }
            //questionlistItemView.$el.addClass("disabled").removeClass("enabled");
            return questionlistItemView;
        }

        public afterRender(): void {

         }



        @named
        private onQuestionClick(e: MouseEvent): void {
            let questionlistItemView: QuestionlistItem = this,
                questionlistItemModel: Models.QuestionlistItem = questionlistItemView.model;
            Utilities.consoleTrace("Question clicked: ", questionlistItemModel.Id);



            if (questionlistItemModel.Disabled) {
                return;
            }

            questionlistItemView.trigger(Events.EVENT_ITEM_CLICKED, questionlistItemModel);


        }
        togglePlayPause1(e: MouseEvent): void {
            e.stopPropagation();
            //console.log("togglePlayPause");
        //    let questionlistItemView: QuestionlistItem = this,
        //        questionlistItemModel: Models.QuestionlistItem = questionlistItemView.model;
        //     questionlistItemView.trigger("EVENT_ITEM_CLICKED_TOGGLE_1",questionlistItemModel);

        }
        refreshAudio(e: MouseEvent): void {
            e.stopPropagation();
            console.log("refreshAudio")

        }
        seekAudio(e: MouseEvent): void {
            e.stopPropagation();


        }
    }
}
