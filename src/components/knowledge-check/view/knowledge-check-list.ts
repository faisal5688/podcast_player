/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />

/// <reference path="../model/knowledge-check-list.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class KnowledgeCheckList extends Backbone.View<Models.KnowledgeCheckList> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: Backbone.ViewOptions<Models.KnowledgeCheckList>) {
            super(options);

            let knowledgeCheckListView: KnowledgeCheckList = this,
                knowledgeCheckListModel: Models.KnowledgeCheckList = knowledgeCheckListView.model;

            knowledgeCheckListView._template = HBTemplates['knowledge-check-list'];

        }

        public events(): Backbone.EventsHash {
            return {

            };
        }

        public render() {
            let knowledgeCheckListView = this,
                knowledgeCheckListModel: Models.KnowledgeCheckList = knowledgeCheckListView.model;
                console.log("knowledgeCheckListModel")
                console.log(knowledgeCheckListModel)

           //knowledgeCheckListView.$el.html(knowledgeCheckListView._template(knowledgeCheckListView.model.toJSON()));
          // knowledgeCheckListView.$el.html(knowledgeCheckListView._template(knowledgeCheckListView.model.toJSON()));

            return knowledgeCheckListView;
        }

        @named
        public afterRender(): void {
            let knowledgeCheckListView: KnowledgeCheckList = this,
                $kc: JQuery = knowledgeCheckListView.$(".knowledge-check");

            try {
                $kc.mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            }
            catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.knowledge-check': ", err.message, err.stack);
            }
        }








    }
}
