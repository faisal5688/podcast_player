/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />

/// <reference path="../model/knowledge-check.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class KnowledgeCheck extends Backbone.View<Models.KnowledgeCheck> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: Backbone.ViewOptions<Models.KnowledgeCheck>) {
            super(options);

            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;

            knowledgeCheckView._template = HBTemplates['knowledge-check'];

            knowledgeCheckView.$el.addClass("knowledge-check-container");
            console.log("CuePoints")
            console.log(knowledgeCheckModel.CuePoints)
            console.log("CuePoints id " + knowledgeCheckModel.Current.audio)
            console.log(knowledgeCheckModel.getCurrentCuePoints(knowledgeCheckModel.Current.audio))
            //knowledgeCheckModel.Current.total = knowledgeCheckModel.getCurrentCuePoints(knowledgeCheckModel.Current.audio).length
            //knowledgeCheckModel.Current.index =1;
            //knowledgeCheckView.updateNextBackUI();
        }

        public events(): Backbone.EventsHash {
            return {
                'click .ck-submit-btn': 'onSubmit',
                'change .kc-option': 'onOptionChange',
                'click .ck-continue-btn': 'onContinue',
                'click .ck-try-again-btn': 'onTryAgain',
                'click .question-data .ck-close-btn': 'onContinue',

                //'click .ck-next-btn': 'onNext',
                'click .ck-next-btn': 'goNext',
                'click .ck-back-btn': 'goBack',
                'click .feedback-container .ck-close-btn': 'onClose'
            };
        }



        public render() {
            let knowledgeCheckView = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;

            knowledgeCheckView.$el.html(knowledgeCheckView._template(knowledgeCheckModel.toJSON()));

            return knowledgeCheckView;
        }

        @named
        public afterRender(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                $kc: JQuery = knowledgeCheckView.$(".knowledge-check");

            try {
                $kc.mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            }
            catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.knowledge-check': ", err.message, err.stack);
            }
        }

        private onSubmit(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this;
            knowledgeCheckView.showFeedback(knowledgeCheckView.evaluate());
        }

        @named
        private onOptionChange(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model,
                selectedOptions: JQuery = knowledgeCheckView.$('input[name=kc-option]:checked');

            if (selectedOptions.length > 0) {
                knowledgeCheckView.$(".ck-submit-btn").removeAttr("disabled").removeClass("disabled");
            }
            else {
                knowledgeCheckView.$(".ck-submit-btn").attr("disabled", "true").addClass("disabled");
            }

            if (knowledgeCheckModel.Current.type === DataStructures.KCType.MCMS) {
                if (e.currentTarget.checked) {
                    knowledgeCheckModel.UserAnswers.push(e.currentTarget.value);
                }
                else {
                    knowledgeCheckModel.UserAnswers = knowledgeCheckModel.UserAnswers.filter((item) => item !== e.currentTarget.value);
                }
            }
            else if (knowledgeCheckModel.Current.type === DataStructures.KCType.MCSS) {
                knowledgeCheckModel.UserAnswers = new Array<string>(e.currentTarget.value);
            }
            Utilities.consoleTrace("knowledgeCheckModel.UserAnswers: ", knowledgeCheckModel.UserAnswers);
        }



        private onContinue(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this;
            knowledgeCheckView.reset();
            knowledgeCheckView.$(".feedback").hide();
            knowledgeCheckView.hide();
            //knowledgeCheckModel.Current.complete=true;
            //alert("question list complete")
        }

        private onNext(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            knowledgeCheckView.reset();
            knowledgeCheckView.$(".feedback").hide();
            knowledgeCheckView.trigger(Events.EVENT_KC_NEXT, knowledgeCheckModel.Current.index);
            //knowledgeCheckView.hide();
            // setTimeout(() => {
            //     audioPlayerModel._startPlayingOnError = true;
            //     audioPlayerView.changeVideo(audioPlayerView.model.Playlist.CurrentItem);
            // }, 500);
            // setTimeout(()=>{

            // },500)
            // knowledgeCheckView.$el.hide(400, () -> {
            //     knowledgeCheckView.trigger(Events.EVENT_KC_NEXT, knowledgeCheckModel.Current);
            // });
        }

        private onTryAgain(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;

            knowledgeCheckView.$('input[name=kc-option]').prop("checked", false);
            knowledgeCheckModel.UserCorrectAnswers = new Array<string>();
            knowledgeCheckModel.UserAnswers = new Array<string>();
            knowledgeCheckView.$(".feedback").hide(200);
            knowledgeCheckView.$(".feedback-container").hide();
            knowledgeCheckView.$(".ck-submit-btn").attr("disabled", "true").addClass("disabled");
        }

        private goNext(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            knowledgeCheckView.reset();
            knowledgeCheckView.$(".feedback").hide();
            knowledgeCheckView.trigger(Events.EVENT_KC_NEXT, knowledgeCheckModel.Current);
        }

        private goBack(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            knowledgeCheckView.reset();
            knowledgeCheckView.$(".feedback").hide();
            knowledgeCheckView.trigger(Events.EVENT_KC_Back, knowledgeCheckModel.Current);
        }

        private onClose(e: any): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            knowledgeCheckView.reset();
            knowledgeCheckView.$(".feedback").hide();
            knowledgeCheckView.$(".feedback-container").hide();
            //knowledgeCheckView.trigger(Events.EVENT_KC_NEXT, knowledgeCheckModel.Current);
        }

        @named
        private evaluate(): DataStructures.KCResult {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model,
                result: DataStructures.KCResult = DataStructures.KCResult.Incorrect;

            Utilities.consoleTrace("Correct options: ", knowledgeCheckModel.Current.correct);
            Utilities.consoleTrace("Selected options: ", knowledgeCheckModel.UserAnswers);

            if (knowledgeCheckModel.Current.correct.length === knowledgeCheckModel.UserAnswers.length) {
                for (let i: number = 0; i < knowledgeCheckModel.UserAnswers.length; i++) {
                    let ans: string = knowledgeCheckModel.UserAnswers[i];
                    if ((knowledgeCheckModel.Current.correct.indexOf(ans)) >= 0) {
                        knowledgeCheckModel.UserCorrectAnswers.push(ans);
                    }
                }

                if (knowledgeCheckModel.Current.correct.length === knowledgeCheckModel.UserCorrectAnswers.length) {
                    result = DataStructures.KCResult.Correct;
                }
                else if (knowledgeCheckModel.UserCorrectAnswers.length === 0) {
                    result = DataStructures.KCResult.Incorrect;
                }
                else {
                    result = DataStructures.KCResult.Partial;
                }
            }
            return result;
        }

        private showFeedback(result: DataStructures.KCResult): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model,
                remainingAttempts: number = 0;

            knowledgeCheckView.$(".feedback").fadeIn(200);

            knowledgeCheckView.$(".feedback-container").fadeIn(200);
            knowledgeCheckView.$(".question-data .ck-close-btn").removeAttr("disabled").removeClass("disabled");



            if (DataStructures.KCFeedbackType.Generic === knowledgeCheckModel.Current.feedback.type) {

                switch (result) {
                    case DataStructures.KCResult.Correct:
                        knowledgeCheckView.$(".feedback .content").html(knowledgeCheckModel.Current.feedback.generic.correct);
                        break;
                    case DataStructures.KCResult.Incorrect:
                        knowledgeCheckModel.Current.usedattempts++;
                        knowledgeCheckView.$(".feedback .content").html(knowledgeCheckModel.Current.feedback.generic.incorrect);
                        break;
                    case DataStructures.KCResult.Partial:
                        knowledgeCheckModel.Current.usedattempts++;
                        knowledgeCheckView.$(".feedback .content").html(knowledgeCheckModel.Current.feedback.generic.partial);
                        break;
                    default:
                        break;
                }
            }
            else if (DataStructures.KCFeedbackType.Individual === knowledgeCheckModel.Current.feedback.type) {

                let selectedFeedback: DataStructures.KCIndividualFeedback = knowledgeCheckModel.Current.feedback.individual.filter((opt: DataStructures.KCIndividualFeedback) => {
                    return opt.id === knowledgeCheckModel.UserAnswers[0];
                })[0];

                knowledgeCheckView.$(".feedback .content").html(selectedFeedback.feedback);
                if (DataStructures.KCResult.Correct !== result) {
                    knowledgeCheckModel.Current.usedattempts++;
                }
            }

            if (DataStructures.KCResult.Correct === result) {
                remainingAttempts = 0;
            }
            else {
                remainingAttempts = knowledgeCheckModel.Current.attempts - knowledgeCheckModel.Current.usedattempts;
            }

            if (remainingAttempts) {
                knowledgeCheckView.$(".ck-try-again-btn").show();
                knowledgeCheckView.$(".ck-continue-btn").hide();
            }
            else {
                knowledgeCheckView.$(".ck-continue-btn").show();
                knowledgeCheckView.$(".ck-try-again-btn").hide();

                knowledgeCheckView.showCorrectAnswers(DataStructures.KCResult.Correct !== result);
            }

            if (knowledgeCheckModel.Current.index < knowledgeCheckModel.Current.total) {
                // alert("ck-continue-btn hide")
                knowledgeCheckView.$(".ck-continue-btn").hide();
                //knowledgeCheckView.$(".ck-next-btn").removeClass("disabled").show();
            } else {
                //alert("ck-continue-btn show")
                knowledgeCheckView.$(".ck-continue-btn").show();
                //knowledgeCheckView.$(".ck-next-btn").addClass("disabled").hide();
            }

            knowledgeCheckView.updateNextBackUI();
            //knowledgeCheckView.$(".ck-next-btn").removeClass("disabled").show();


        }

        private showCorrectAnswers(markIncorrect: boolean): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model,
                options: JQuery = knowledgeCheckView.$('input[name=kc-option]');

            for (let i: number = 0; i < options.length; i++) {
                let option: JQuery = $(options[i]),
                    val: string = <string>option.val();

                if ((knowledgeCheckModel.Current.correct.indexOf(val)) >= 0) {
                    option.parent().removeClass("incorrect").addClass("correct");
                }
                else {
                    option.parent().removeClass("correct incorrect");
                    if (markIncorrect) {
                        option.parent().addClass("incorrect");
                    }
                }

            }
        }

        public show(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;

            knowledgeCheckView.$el.show(200, () => {
                knowledgeCheckView.trigger(Events.EVENT_KC_SHOWN, knowledgeCheckModel.Current);
            });
        }

        public hide(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;

            knowledgeCheckView.trigger(Events.EVENT_KC_COMPLETE, knowledgeCheckModel.Current);
            knowledgeCheckView.$el.hide(200, () => {

            });
        }

        @named
        public reset(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            Utilities.consoleTrace("Reset current KC");

            knowledgeCheckView.$('input[name=kc-option]').prop("checked", false)
                .removeClass("correct incorrect");
            knowledgeCheckModel.Current.usedattempts = 0;
            knowledgeCheckModel.UserCorrectAnswers = new Array<string>();
            knowledgeCheckModel.UserAnswers = new Array<string>();
        }

        public destroy(): void {
            let knowledgeCheckView: KnowledgeCheck = this;
            knowledgeCheckView.unbind();
            knowledgeCheckView.undelegateEvents();
            knowledgeCheckView.$el.empty();
        }

        public getCurrentCuePoints(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            //knowledgeCheckModel.getCurrentCuePoints(id)
            //alert()
        }

        public setIndex(ind: number): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            //knowledgeCheckModel.setIndex(ind)
            knowledgeCheckModel.Current.index = ind;
        }

        public getIndex() {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            //knowledgeCheckModel.setIndex(ind)
            return knowledgeCheckModel.Current.index;
        }

        public setTotalActive(num: number): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            //knowledgeCheckModel.setIndex(ind)
            knowledgeCheckModel.Current.total = num;
        }

        public updateNextBackUI(): void {
            let knowledgeCheckView: KnowledgeCheck = this,
                knowledgeCheckModel: Models.KnowledgeCheck = knowledgeCheckView.model;
            //knowledgeCheckModel.setIndex(ind)


            if (knowledgeCheckModel.Current.index === 1) {
                knowledgeCheckView.$(".ck-back-btn").addClass("disabled").attr("disabled", "true")
            } else {
                knowledgeCheckView.$(".ck-back-btn").removeClass("disabled").removeAttr("disabled")
            }

            if (knowledgeCheckModel.Current.index === knowledgeCheckModel.Current.total) {
                knowledgeCheckView.$(".ck-next-btn").addClass("disabled").attr("disabled", "true")
            } else {
                knowledgeCheckView.$(".ck-next-btn").removeClass("disabled").removeAttr("disabled")
            }
        }


    }
}
