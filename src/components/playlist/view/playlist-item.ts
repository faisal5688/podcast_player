
namespace HTML5AudioPlayer.Components.Views {

    export class PlaylistItem extends Backbone.View<Models.PlaylistItem> {

        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: any) {
            super(options);

            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = this.model;

            playlistItemView._template = HBTemplates['playlist-item'];

            //alert(playlistItemModel)
           // playlistItemModel.on("change:numQuestions", playlistItemView.render, playlistItemModel);
            playlistItemModel.on("change:complete", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:current", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:disabled", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:kccomplete", playlistItemView.render, playlistItemView);


        }

        events(): Backbone.EventsHash {
            return {
                'click': 'onLeftClick',
                'click .play-pause': 'togglePlayPause1',
                'click .refresh': 'refreshAudio',
                'input .progress-bar': 'seekAudio',
            };
        }

        public render() {
            let playlistItemView = this,
                playlistItemModel: Models.PlaylistItem = this.model;


            playlistItemView.$el.html(playlistItemView._template(playlistItemModel.toJSON()));
            // if (playlistItemModel.Current) {
            //     playlistItemView.$el.addClass("current");
            //     playlistItemView.$el.find(".audio-player-container").addClass("showPlayer")
            // }
            // else {
            //     playlistItemView.$el.removeClass("current");
            //     playlistItemView.$el.find(".audio-player-container").removeClass("showPlayer")
            // }
            // if (playlistItemModel.Current) {
            // }
            playlistItemView.$el.removeClass("current");
            playlistItemView.$el.find(".audio-player-container").removeClass("showPlayer")
            if (playlistItemModel.Disabled) {
                playlistItemView.$el.addClass("disabled").removeClass("enabled");
            }
            else {
                playlistItemView.$el.removeClass("disabled").addClass("enabled");
            }
            return playlistItemView;
        }

        public afterRender(): void {

         }



        @named
        private onLeftClick(e: MouseEvent): void {
            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            Utilities.consoleTrace("Item clicked: ", playlistItemModel.Id);

            if (playlistItemModel.Disabled) {
                return;
            }

            //let audioPlayerView: AudioPlayer = this,
            //videoPlayerViewmodel:Models.AudioPlayer = audioPlayerView.model;
            playlistItemModel.Current = (!playlistItemModel.IsAssessment && !playlistItemModel.IsSurvey);

            if (playlistItemModel.Current) {
                playlistItemView.$el.addClass("current");
                playlistItemView.$el.find(".audio-player-container").addClass("showPlayer")
            }
            //let audioPlayerView: AudioPlayer = this;

            // audioPlayerView.initPlayer();


            //let playlistContainer: JQuery = playlistItemView.$(".audio-player");

            // // Compile the Handlebars template
            // var source = $(".video-container").html();
            // var template = Handlebars.compile(source);
            // // Render the template with the data
            // var html = template(playlistItemModel);
            // playlistContainer.html(html);




            //const audioSrc = $target.data('src');



            // // Remove the existing audio player controls (if any)
            // if (this.activePlayer) {
            //     this.activePlayer.remove();
            // }
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED, playlistItemModel);
            playlistItemView.trigger(Events.EVENT_INIT_PLAYER, playlistItemModel);
            // setTimeout(() => {
            //     playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_TOGGLE,playlistItemModel);
            // }, 500);


        }
        togglePlayPause1(e: MouseEvent): void {
            e.stopPropagation();

            //console.log("togglePlayPause");
           let playlistItemView: PlaylistItem = this,
               playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_TOGGLE,playlistItemModel);

        }
        refreshAudio(e: MouseEvent): void {
            e.stopPropagation();
            let playlistItemView: PlaylistItem = this,
               playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_REFRESH,playlistItemModel);

        }
        seekAudio(e): void {
            e.stopPropagation();
            const input = e.target as HTMLInputElement;
            let currentTime = parseInt(input.value)
            //console.log("seekAudio")
            //alert("input "+)

            let playlistItemView: PlaylistItem = this,
               playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemModel.CurrentTime=currentTime;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_SEEK,playlistItemModel);

        }
    }
}
