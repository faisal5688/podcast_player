/// <reference path="../model/playlist.ts" />
/// <reference path="../model/playlist-item.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Playlist extends Backbone.View<Models.Playlist> {

        private _template: (properties?: HandlebarsTemplates) => string;

        private _playlistItems: PlaylistItem[];
        private _playlistQuestions: QuestionlistItem[];

        constructor(options: Backbone.ViewOptions<Models.Playlist>) {
            super(options);

            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = this.model;


            playlistView._template = HBTemplates['playlist'];

            playlistView._playlistItems = new Array<PlaylistItem>();
            playlistView._playlistQuestions = new Array<QuestionlistItem>();

            for (let i = 0; i < playlistModel.PlaylistItems.length; i++) {
                //console.log(playlistModel.PlaylistItems[i].IsAssessment)
                let playlistItemView = new PlaylistItem({
                    id: _.uniqueId("playlist-item"),
                    className: "playlist-item",
                    model: playlistModel.PlaylistItems[i]
                });
                if (playlistModel.PlaylistItems[i].HiddenInPlaylist) {
                    playlistItemView.$el.addClass("hide");
                }
                // if(!playlistModel.isKcComplete() && playlistModel.PlaylistItems[i].IsAssessment){
                //     //playlistModel.QuestionlistItems[i].Disabled=false;
                //     alert("false")
                // }else{
                //     alert("true")
                //     //playlistModel.QuestionlistItems[i].Disabled=true;
                // }
                playlistView._playlistItems.push(playlistItemView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED, playlistView.onItemClicked, playlistView);
                playlistItemView.on(Events.EVENT_INIT_PLAYER, playlistView.onInitPlayer, playlistView);

                playlistItemView.on(Events.EVENT_ITEM_CLICKED_TOGGLE, playlistView.togglePlayPause, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_REFRESH, playlistView.refreshAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_SEEK, playlistView.seekAudio, playlistView);

            }

            for (let i = 0; i < playlistModel.QuestionlistItems.length; i++) {
                playlistView.model.enableKc(playlistModel.QuestionlistItems[i].Id);
                playlistView.model.completeKc(playlistModel.QuestionlistItems[i].Id);
                //playlistView.model.getNumQuestions(playlistModel.QuestionlistItems[i].Id,i)
                let QuestionlistItemView = new QuestionlistItem({
                    id: _.uniqueId("questionlist-item"),
                    className: "questionlist-item",
                    model: playlistModel.QuestionlistItems[i]
                });
                //if (playlistModel.QuestionlistItems[i].HasQuestion) {
                    //playlistModel.PlaylistItems[i].NumQuestions = 0;
                    playlistView._playlistQuestions.push(QuestionlistItemView);
                    QuestionlistItemView.on(Events.EVENT_ITEM_CLICKED, playlistView.onQuesClicked, playlistView);
               // }
            }
        }

        public events(): Backbone.EventsHash {
            return {
                'click .close-button': 'onClosePlaylist',
                'click .index-button': 'onShowIndex',
                'click .glossary-button': 'onShowGlossary',
                // 'click .resource-button': 'onShowResource',

                // 'click .play-pause': 'togglePlayPause',
                // 'click .refresh': 'refreshAudio',
                // 'input .progress-bar': 'seekAudio',
            };
        }

        render() {
            let playlistView = this,
                playlistModel: Models.Playlist = this.model;

            playlistView.$el.html(playlistView._template(playlistView.model.toJSON()));

            let playlistInner: JQuery = playlistView.$el.find(".playlist-inner");

            for (let i = 0; i < playlistView._playlistItems.length; i++) {
                let playlistItem: PlaylistItem = playlistView._playlistItems[i];

                playlistInner.append(playlistItem.render().$el);
            }

            let questionlistInner: JQuery = playlistView.$el.find(".questionlist-inner");
            for (let i = 0; i < playlistView._playlistQuestions.length; i++) {
                let playlistQuestionItem: QuestionlistItem = playlistView._playlistQuestions[i];

                questionlistInner.append(playlistQuestionItem.render().$el);
            }


            return playlistView;
        }

        @named
        afterRender(): void {
            let playlistView: Playlist = this;

            for (let i = 0; i < playlistView._playlistItems.length; i++) {
                playlistView._playlistItems[i].afterRender();
            }

            try {
                playlistView.$(".playlist-inner").mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            } catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.playlist-inner': ", err.message, err.stack);
            }
        }

        public next(flag?: boolean): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                sormPreviousData = playlistModel.ScormPreviousData,
                curIndex: number = parseInt(playlistModel.CurrentItem.Index),
                nextItem = playlistView.getNextItem(curIndex, flag);

            if (nextItem) {
                if (nextItem.Complete && nextItem.IsAssessment) {
                    if (sormPreviousData.survey && sormPreviousData.survey.completed) {
                        playlistView.onItemClicked(nextItem);
                    } else {
                        nextItem = playlistView.getNextItem(curIndex, true);
                        playlistView.onItemClicked(nextItem);
                    }
                }
                else if (nextItem.Complete && nextItem.IsSurvey) {
                    if (sormPreviousData.survey && sormPreviousData.survey.completed) {
                        nextItem = playlistView.getNextItem(curIndex, true);
                        playlistView.onItemClicked(nextItem);
                    } else {
                        playlistView.onItemClicked(nextItem);
                    }
                }
                else {
                    playlistView.onItemClicked(nextItem);
                }
            }
        }

        public onQuesClicked(item: Models.PlaylistItem): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;
            //let knowledge : KnowledgeCheck =this;
               // alert(item.Id)

               //item.Complete=true;
            playlistView.trigger(Events.EVENT_QUESTION_CLICKED,item);


        }

        public onItemClicked(item: Models.PlaylistItem): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;


            // playlistView.$('.play-pause').on('click', playlistView.togglePlayPause.bind(playlistView));
            // playlistView.$('.refresh').on('click', playlistView.refreshAudio.bind(playlistView));
            // playlistView.$('.progress-bar').on('input', playlistView.seekAudio.bind(playlistView));

            //playlistModel.
            //playlistItemView.$el.addClass("hide");


            if (playlistModel.CurrentItem.id === item.Id) {
                return;
            }

            if (item.IsAssessment) {
                playlistView.trigger(Events.EVENT_LAUNCH_ASSESSMNET);
                return;
            }

            if (item.IsSurvey) {
                playlistView.trigger(Events.EVENT_LAUNCH_SURVEY);
                return;
            }

            playlistModel.CurrentItem.Current = false;
            playlistModel.CurrentItem = item;
            playlistModel.CurrentItem.Current = true;
            playlistModel.CurrentItem.Disabled = false;
            playlistModel.CurrentListItem=item.Index;
            //playlistModel.CurrentItem.NumQuestions= playlistModel.CurrentItem.
            //alert(playlistModel.isKcComplete())
           // alert(playlistModel.isLastAudio())

            playlistView.trigger(Events.EVENT_SELECTION_CHANGE, item);
            //playlistView.trigger(Events.EVENT_AUDIOPLAYER_CHANGE, item);
            //playlistView.trigger(Events.EVENT_AUDIOPLAYPAUSE_CHANGE, item);



        }

        // public onItemClickedToggle(item: Models.PlaylistItem): void {
        //     alert("onItemClickedToggle");
        // }

        // public onItemClickedRefresh(item: Models.PlaylistItem): void {
        //     alert("onItemClickedRefresh")
        // }
        // public onItemClickedSeek(item: Models.PlaylistItem): void {
        //     alert("onItemClickedSeek")
        // }

        private getNextItem(index: number, increment?: boolean): Models.PlaylistItem {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                curIndex = increment ? (index + 2) : index + 1;

            for (let i = 0; i < playlistModel.PlaylistItems.length; i++) {
                let item = playlistModel.PlaylistItems[i],
                    itemIndex = parseInt(item.Index);
                if (itemIndex === curIndex) {
                    return item;
                }
            }
        }

        public toggle(): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                playlistContainer: JQuery = playlistView.$el.parent();

            if (playlistModel.Visible) {
                playlistContainer.one(Events.CSS_ANIMATION_END, function () {
                    playlistContainer.removeClass("to-animate-right").addClass("animate-right");
                    playlistView.trigger(Events.EVENT_PLAYLIST_ANIMATION_END);
                })
                    .addClass("to-animate-right");
            } else {
                playlistContainer.one(Events.CSS_ANIMATION_END, function () {
                    playlistContainer.removeClass("to-animate-left").removeClass("animate-right");
                    playlistView.trigger(Events.EVENT_PLAYLIST_ANIMATION_END);
                })
                    .addClass("to-animate-left");
            }
            playlistModel.Visible = !playlistModel.Visible;
        }

        onClosePlaylist(): void {
            let playlistView: Playlist = this;

            // playlistView.$el.parent().removeClass("animateRight");
            // playlistView.$el.parent().addClass("animateLeft");
            playlistView.trigger(Events.EVENT_PLAYLIST_CLOSED);
        }

        onShowGlossary(): void {
            let playlistView: Playlist = this;
            //  playlistView.$(".glossary-button").addClass("animateButton");
            playlistView.trigger(Events.EVENT_SHOW_GLOSSARY);
        }

        onShowIndex(): void {
            let playlistView: Playlist = this;
            // playlistView.$(".index-button").addClass("animateButton");
            playlistView.trigger(Events.EVENT_SHOW_INDEX);
        }

        onShowResource(): void {
            let playlistView: Playlist = this;
            // playlistView.$(".index-button").addClass("animateButton");
            playlistView.trigger(Events.EVENT_SHOW_RESOURCES);
        }

        enableNext(curVidId: string): void {
            let playlistView: Playlist = this;
            playlistView.model.enableNext(curVidId);
            playlistView.enableNextKc(curVidId)
        }

        enableNextKc(curVidId: string): void {
            let playlistView: Playlist = this;
            playlistView.model.enableNextKc(curVidId);

        }

        onInitPlayer():void{
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_INIT_PLAYER);
        }

        togglePlayPause(): void {
            // e.stopPropagation();
            console.log("togglePlayPause")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_TOGGLE);
        }

        refreshAudio(): void {

            console.log("refreshAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_REFRESH);
            alert("refreshAudio")
        }
        seekAudio(time:any): void {
            console.log("seekAudio")
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                playlistContainer: JQuery = playlistView.$el.parent();

            //playlistModel.CurrentItem.CurrentTime=time;
            playlistView.trigger(Events.EVENT_ITEM_SEEK);
            // alert("seekAudio")
        }
    }
}