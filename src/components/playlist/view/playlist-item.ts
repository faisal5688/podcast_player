﻿
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
            playlistItemModel.on("change:complete", playlistItemView.reRender, playlistItemView);
            playlistItemModel.on("change:current", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:disabled", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:kccomplete", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:CurrentClicked", playlistItemView.render, playlistItemView);
            playlistItemModel.on("change:inprogress", playlistItemView.render, playlistItemView);



        }

        events(): Backbone.EventsHash {
            return {
                'click': 'onLeftClick',
                'click .play-pause': 'togglePlayPause1',
                'click .refresh': 'refreshAudio',
                'input .progress-bar': 'seekAudio',
                'click .navigatorAudioSpeedBtn': 'speedAudio',
                'a .audioSpeedContent': 'speedContentAudio'

            };
        }

        public render() {
            let playlistItemView = this,
                playlistItemModel: Models.PlaylistItem = this.model;

                console.log("playlistItemModel")
                console.log(playlistItemModel)


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

            if (playlistItemModel.CurrentClicked) {
                playlistItemView.$el.addClass("current");
                playlistItemView.$el.find(".audio-player-container").addClass("showPlayer");

            } else {
                playlistItemView.$el.removeClass("current");
                playlistItemView.$el.find(".audio-player-container").removeClass("showPlayer")
            }
            //playlistItemView.$el.removeClass("current");
            //playlistItemView.$el.find(".audio-player-container").removeClass("showPlayer")
            if (playlistItemModel.Disabled) {
                playlistItemView.$el.addClass("disabled").removeClass("enabled");
            }
            else {
                playlistItemView.$el.removeClass("disabled").addClass("enabled");
            }
            if (playlistItemModel.CurrentClicked && !playlistItemModel.Complete) {
                playlistItemView.$el.find(".item-inpogress").show()
            }
            else {
                playlistItemView.$el.find(".item-inpogress").hide()
            }

            return playlistItemView;
        }

        public afterRender(): void {
            //alert("afterRender")
            //this.reRender();
        }
        public reRender(): void {

            let playlistItemView = this,
                playlistItemModel: Models.PlaylistItem = this.model;
            playlistItemView.$el.find(".item-complete").show();
            playlistItemView.$el.find(".item-inpogress").hide()
            //playlistItemModel.Complete=true;


        }

        public renderInprogress(): void {

            let playlistItemView = this,
                playlistItemModel: Models.PlaylistItem = this.model;
            playlistItemView.$el.find(".item-inpogress").show()
            //playlistItemModel.Complete=true;


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
            //playlistItemModel.CurrentClicked = true;
            //console.log("**************************8")


            if (playlistItemModel.Current) {
                playlistItemView.$el.addClass("current");
                playlistItemView.$el.find(".audio-player-container").addClass("showPlayer")

                if(!playlistItemModel.Complete){
                    playlistItemView.$el.find(".item-inpogress").show()
                }
            }



            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED, playlistItemModel);
            playlistItemView.trigger(Events.EVENT_INIT_PLAYER, playlistItemModel);



        }
        togglePlayPause1(e: MouseEvent): void {
            e.stopPropagation();

            //console.log("togglePlayPause");
            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_TOGGLE, playlistItemModel);

        }
        refreshAudio(e: MouseEvent): void {
            e.stopPropagation();
            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_REFRESH, playlistItemModel);

        }
        seekAudio(e): void {
            e.stopPropagation();
            const input = e.target as HTMLInputElement;
            let currentTime = parseInt(input.value)
            //console.log("seekAudio")
            //alert("input "+)

            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemModel.CurrentTime = currentTime;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_SEEK, playlistItemModel);

        }

        speedAudio(e): void {
            e.stopPropagation();
            $('.audioSpeedContent').toggle();
            let playlistItemView: PlaylistItem = this,
            playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_SPEED, playlistItemModel);


        }
        speedContentAudio(e): void {
            e.stopPropagation();
            $('.audioSpeedContent').hide();
            let playlistItemView: PlaylistItem = this,
                playlistItemModel: Models.PlaylistItem = playlistItemView.model;
            playlistItemView.trigger(Events.EVENT_ITEM_CLICKED_SPEEDLIST, playlistItemModel);
        }


    }
}
