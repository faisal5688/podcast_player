namespace HTML5AudioPlayer.Components.Views {

    export class KnowledgeCheckItem extends Backbone.View<Models.KnowledgeCheckItem> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: any) {
            super(options);

            let KnowledgeCheckItemView: KnowledgeCheckItem = this,
                KnowledgeCheckItemModel: Models.KnowledgeCheckItem = this.model;

            KnowledgeCheckItemView._template = HBTemplates['knowledge-check-item'];
            KnowledgeCheckItemModel.on("change:numQuestions", KnowledgeCheckItemView.render, KnowledgeCheckItemView);
            KnowledgeCheckItemModel.on("change:complete", KnowledgeCheckItemView.render, KnowledgeCheckItemView);
            KnowledgeCheckItemModel.on("change:current", KnowledgeCheckItemView.render, KnowledgeCheckItemView);
            KnowledgeCheckItemModel.on("change:disabled", KnowledgeCheckItemView.render, KnowledgeCheckItemView);
            KnowledgeCheckItemModel.on("change:kccomplete", KnowledgeCheckItemView.itemRender, KnowledgeCheckItemView);
        }

        events(): Backbone.EventsHash {
            return {
                'click': 'onKcItemClick'
            };
        }

        public render() {
            let KnowledgeCheckItemView = this,
                KnowledgeCheckItemModel: Models.KnowledgeCheckItem = this.model;
            console.log("KnowledgeCheckItemModel")
            console.log(KnowledgeCheckItemModel)


            KnowledgeCheckItemView.$el.html(KnowledgeCheckItemView._template(KnowledgeCheckItemModel.toJSON()));
            // if (KnowledgeCheckItemModel.Current) {
            //     KnowledgeCheckItemView.$el.addClass("current");
            // }
            // else {
            //     KnowledgeCheckItemView.$el.removeClass("current");
            // }
            //alert("KnowledgeCheckItemModel "+" "+KnowledgeCheckItemModel.Disabled)
            if (KnowledgeCheckItemModel.Disabled) {
                KnowledgeCheckItemView.$el.addClass("disabled").removeClass("enabled");
            }
            else {
                KnowledgeCheckItemView.$el.removeClass("disabled").addClass("enabled");
            }
            // if(KnowledgeCheckItemModel.Complete){
            //     KnowledgeCheckItemView.$el.removeClass("disabled").addClass("enabled");
            // }
            //KnowledgeCheckItemView.$el.addClass("disabled").removeClass("enabled");
            if (KnowledgeCheckItemModel.Complete) {
                KnowledgeCheckItemView.$el.find(".item-complete").show()
                KnowledgeCheckItemView.$el.addClass("kc-complete")
            }else {
                KnowledgeCheckItemView.$el.find(".item-complete").hide()
                KnowledgeCheckItemView.$el.removeClass("kc-complete")
            }

            // if (KnowledgeCheckItemModel.Enable) {
            //     KnowledgeCheckItemView.$el.find(".item-complete").show()
            // }
            return KnowledgeCheckItemView;
        }

        public afterRender(): void {

        }

        public itemRender(): void {

            let KnowledgeCheckItemView = this,
                KnowledgeCheckItemModel: Models.KnowledgeCheckItem = this.model;
            KnowledgeCheckItemView.$el.find(".item-complete").show()
            //playlistItemModel.Complete=true;


        }

        @named
        private onKcItemClick(e: MouseEvent): void {
            let KnowledgeCheckItemView: KnowledgeCheckItem = this,
                KnowledgeCheckItemModel: Models.KnowledgeCheckItem = KnowledgeCheckItemView.model;
            Utilities.consoleTrace("Question clicked: ", KnowledgeCheckItemModel.Id);

            if (KnowledgeCheckItemModel.Disabled) {
                return;
            }

            KnowledgeCheckItemView.trigger(Events.EVENT_KCITEM_CLICKED, KnowledgeCheckItemModel);


        }
        togglePlayPause1(e: MouseEvent): void {
            e.stopPropagation();
            //console.log("togglePlayPause");
            //    let KnowledgeCheckItemView: KnowledgeCheckItem = this,
            //        KnowledgeCheckItemModel: Models.KnowledgeCheckItem = KnowledgeCheckItemView.model;
            //     KnowledgeCheckItemView.trigger("EVENT_ITEM_CLICKED_TOGGLE_1",KnowledgeCheckItemModel);

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
