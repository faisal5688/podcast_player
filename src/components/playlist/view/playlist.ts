/// <reference path="../model/playlist.ts" />
/// <reference path="../model/playlist-item.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Playlist extends Backbone.View<Models.Playlist> {

        private _template: (properties?: HandlebarsTemplates) => string;

        private _playlistItems: PlaylistItem[];
        private _knowledgeCheckItems: KnowledgeCheckItem[];

        // <<< ADDED: orientation-change state flags
        private _orientationBound: boolean = false;
        private _lastOrientation: string;
        private _isRendered: boolean = false;
        // <<< END ADDED

        constructor(options: Backbone.ViewOptions<Models.Playlist>) {
            super(options);

            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = this.model;


            playlistView._template = HBTemplates['playlist'];

            playlistView._playlistItems = new Array<PlaylistItem>();
            playlistView._knowledgeCheckItems = new Array<KnowledgeCheckItem>();

            // playlistView._KnowledgeCheckList = new KnowledgeCheckList({
            //     id: _.uniqueId("KnowledgeCheckList"),
            //     className: "KnowledgeCheckList",
            //     model: COURSE_MODEL.KnowledgeCheck
            // });

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
                // if(playlistModel.isKcComplete() && playlistModel.PlaylistItems[i].IsAssessment){
                //     //playlistView._playlistItems.Disabled=false;
                //     //alert("false")
                //     playlistModel.PlaylistItems[i].Disabled =false;
                // }
                playlistModel.PlaylistItems[i].CurrentClicked = false;
                playlistModel.PlaylistItems[i].Totalitems = playlistModel.PlaylistItems.length;
                playlistView._playlistItems.push(playlistItemView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED, playlistView.onItemClicked, playlistView);


                playlistItemView.on(Events.EVENT_INIT_PLAYER, playlistView.onInitPlayer, playlistView);

                playlistItemView.on(Events.EVENT_ITEM_CLICKED_TOGGLE, playlistView.togglePlayPause, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_REFRESH, playlistView.refreshAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_SEEK, playlistView.seekAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_SPEEDLIST, playlistView.speedListAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_SPEED, playlistView.speedClickAudio, playlistView);

                playlistItemView.on(Events.EVENT_ITEM_CLICKED_CC, playlistView.ccAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_TRANSCRIPT, playlistView.transcriptAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_BACKAUDIO, playlistView.backAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_NEXTAUDIO, playlistView.nextAudio, playlistView);
                playlistItemView.on(Events.EVENT_ITEM_CLICKED_ONOFFAUDIO, playlistView.onoffAudio, playlistView);
                playlistItemView.on(Events.EVENT_NEXTBACK_CLICK, playlistView.onNextBackClicked, playlistView);

                //playlistItemView.on(Events.EVENT_ITEM_CLICKED_ONOFFAUDIO, playlistView.autoAdvanceAudio, playlistView);

                playlistModel.enableAssessment();
                //playlistItemView.afterRender()

            }

            //alert(COURSE_MODEL.KnowledgeCheck.CuePoints)
            for (let i = 0; i < playlistModel.KnowledgeCheckItems.length; i++) {
                //playlistModel.KnowledgeCheckItems[i].Disabled=true;
                playlistView.model.enableKcList(playlistModel.KnowledgeCheckItems[i].Id);
                let KnowledgeCheckItemsView = new KnowledgeCheckItem({
                    id: _.uniqueId("knowledge-check-item"),
                    className: "knowledge-check-item",
                    model: playlistModel.KnowledgeCheckItems[i]
                });

                playlistView._knowledgeCheckItems.push(KnowledgeCheckItemsView);
                KnowledgeCheckItemsView.on(Events.EVENT_KCITEM_CLICKED, playlistView.onKcItemClicked, playlistView);
            }

            // <<< ADDED: bind orientation listener exactly once (was previously inside render())
            playlistView.bindOrientationChange();
            // <<< END ADDED
        }

        // <<< ADDED: register the orientation listener only once
        private bindOrientationChange(): void {
            let playlistView: Playlist = this;

            if (playlistView._orientationBound) { return; }
            playlistView._orientationBound = true;

            Utilities.onOrientationChange((orientation: string) => {
                Utilities.consoleLog("Orientation changed to: " + orientation);

                if (!Utilities.isMobile()) { return; }
                if (playlistView._lastOrientation === orientation) { return; }
                playlistView._lastOrientation = orientation;

                // Defer so the browser has finished reflowing the viewport
                _.defer(() => {
                    if (!playlistView._isRendered) { return; }
                    playlistView.reflowForOrientation(orientation);
                });
            });
        }

        // <<< ADDED: minimal DOM re-layout instead of full re-render
        // (keeps video.js instance / waveforms / handlers intact)
        private reflowForOrientation(orientation: string): void {
            let playlistView: Playlist = this;

            // Only the assessment item changes container between orientations
            let assessmentItem = _.find(
                playlistView._playlistItems,
                (i) => i.model.Id === "assessment"
            );

            if (assessmentItem) {
                let $target: JQuery = (Utilities.isMobile() && orientation === "Portrait")
                    ? playlistView.$(".knowledge-checklist-list")
                    : playlistView.$(".playlist-list");

                if (assessmentItem.$el.parent()[0] !== $target[0]) {
                    $target.append(assessmentItem.$el);
                }
            }

            // Refresh custom scrollbars after DOM moved
            try { playlistView.$(".playlist-inner").mCustomScrollbar("update"); } catch (e) { }
            try { playlistView.$(".knowledge-check-list-inner").mCustomScrollbar("update"); } catch (e) { }
        }
        // <<< END ADDED

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

            let playlistInner: JQuery = playlistView.$el.find(".playlist-list");

            for (let i = 0; i < playlistView._playlistItems.length; i++) {
                let playlistItem: PlaylistItem = playlistView._playlistItems[i];
                //assessment
                console.log("Utilities.isiPhone() --- " + Utilities.isiPhone())
                console.log("isMobile --  " + Utilities.isMobile())
                console.log("Utilities.readDeviceOrientation()" + Utilities.readDeviceOrientation())

                // if (playlistItem.model.Id != "assessment") {
                //     playlistInner.append(playlistItem.render().$el);
                // }


                playlistInner.append(playlistItem.render().$el);
            }

            // <<< REMOVED: this block was adding a new listener on every render()
            // Utilities.onOrientationChange((orientation) => {
            //     Utilities.consoleLog("Orientation changed to: " + orientation);
            //     if (Utilities.isMobile()) {
            //         // re-init mobile layout / re-render playlist
            //     }
            // });
            // <<< END REMOVED


            let KnowledgeCheckLisInner: JQuery = playlistView.$el.find(".knowledge-checklist-list");
            for (let i = 0; i < playlistView._knowledgeCheckItems.length; i++) {
                let knowledgeCheckItem: KnowledgeCheckItem = playlistView._knowledgeCheckItems[i];

                KnowledgeCheckLisInner.append(knowledgeCheckItem.render().$el);
            }

            for (let i = 0; i < playlistView._playlistItems.length; i++) {
                let playlistItem: PlaylistItem = playlistView._playlistItems[i];
                if (playlistItem.model.Id == "assessment") {
                    playlistItem.$el.addClass("assessment");
                    if (Utilities.isMobile() && Utilities.readDeviceOrientation() === "Portrait") {
                        KnowledgeCheckLisInner.append(playlistItem.render().$el);
                        setTimeout(function () {
                            //$(".audio-player").height(1000)
                            // $(".audio-player").css(
                            //     "height",
                            //     "calc(100% + " + $(".carousel-container").height() + "px)"
                            // );
                            // $(".audio-player").height(
                            //     $(".audio-player").height()
                            // );
                            $(".audio-player").height(
                                $(".playlist-container").height() + $(".carousel-container").height()
                            );
                        }, 50)
                    } else {
                        playlistInner.append(playlistItem.render().$el);
                    }

                }


            }


            //alert("playlistModel.ScormPreviousData.cv "+playlistModel.ScormPreviousData.cv)
            console.log("model.supposedCurrentTime ")
            console.log(playlistModel.ScormPreviousData)
            //console.log(playlistModel.ScormPreviousData[playlistModel.ScormPreviousData.cv].t)
            if (playlistModel.ScormPreviousData[playlistModel.ScormPreviousData.cv] && (playlistModel.ScormPreviousData[playlistModel.ScormPreviousData.cv].t > 0 && playlistModel.ScormPreviousData[playlistModel.ScormPreviousData.cv].c == 0)) {
                //alert("bookmarking");
                //console.log(playlistView._playlistItems)
                // let curEl = parseInt(playlistModel.CurrentItem.Index) - 1;
                // playlistView._playlistItems[curEl].$el.addClass("current");
                // playlistView._playlistItems[curEl].$el.find(".audio-player-container").addClass("showPlayer");
                // playlistView._playlistItems[curEl].$el.find(".waveform").show();
                // setTimeout(function () {

                // }, 500);

                // alert("1")

                //playlistModel.CurrentItem.$el.addClass("current");
                //$('.audio-player-template .progress-bar').val(0);
                //('.audio-player-template .current-time').text(currentTime);
                //('.audio-player-template .total-time').text(totalTime);

            }

            //playlistView.onItemClicked(curEl);

            // <<< ADDED: mark view as rendered and remember current orientation
            playlistView._isRendered = true;
            playlistView._lastOrientation = Utilities.readDeviceOrientation();
            // <<< END ADDED

            return playlistView;
        }

        @named
        afterRender(): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;

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

            try {
                playlistView.$(".knowledge-check-list-inner").mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            } catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.playlist-inner': ", err.message, err.stack);
            }

            try {
                playlistView.$(".speaker-container").mCustomScrollbar({
                    theme: "kpmg-blue"
                });
            } catch (err) {
                Utilities.consoleError("Failed to apply scrollbar to '.playlist-inner': ", err.message, err.stack);
            }

            let audioPlayerView = videojs("video-instance")
            this.loadAudioPlaylist(audioPlayerView, playlistModel.PlaylistItems);
            audioPlayerView.on('playlistloaded', (() => {
                this.renderPlayerlistTime();
            }));



        }

        private renderPlayerlistTime() {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;
            for (let i = 0; i < playlistView._playlistItems.length; i++) {
                let playlistItem: PlaylistItem = playlistView._playlistItems[i];

                playlistItem.$el.find(".left-content .duration").html(playlistItem.model.Duration);
            }

            playlistModel.CurrentItem.Inprogress = true;

            let curEl = parseInt(playlistModel.CurrentItem.Index) - 1;
            // playlistView._playlistItems[curEl].$el.addClass("current");
            // playlistView._playlistItems[curEl].$el.find(".audio-player-container").addClass("showPlayer");
            // playlistView._playlistItems[curEl].$el.find(".waveform").show();
            // playlistView._playlistItems[curEl].$el.find(".waveform").show();
            playlistView.enable();
            setTimeout(function () {
                playlistView._playlistItems[curEl].$el.trigger("click")
                // playlistView.trigger(Events.EVENT_SELECTION_CHANGE, playlistModel.CurrentItem);
                //playlistView.trigger(Events.EVENT_CREATEWAVEFORM);
                setTimeout(function () {
                    playlistView.trigger(Events.EVENT_SELECTION_CHANGE, playlistModel.CurrentItem);
                    playlistView.trigger(Events.EVENT_CREATEWAVEFORM);
                    //alert("1")
                    playlistView.enable(false);
                }, 200);
            }, 100);

        }
        @named
        public enable(enable: boolean = true, message?: string): void {

            if (enable) {
                $("#uiBlocker").hide();
            }
            else {
                if (message) {
                    $("#uiBlocker .loading-text").html(message);
                }
                else {
                    $("#uiBlocker .loading-text").html("Please wait Audio is loading...");
                }
                $("#uiBlocker").show();
            }
        }

        private loadAudioPlaylist(player, playlist: Models.PlaylistItem[]) {
            const durations = [];
            let loadedCount = 0;

            playlist.forEach((track, index) => {
                // <<< CHANGED: was `!track.url` (lowercase) — the property is `Url`
                if (!track.Url) {
                    console.warn(`Track at index ${index} is missing a URL.`);
                    durations[index] = 0;
                    loadedCount++;
                    this.checkIfAllLoaded(player, playlist, durations, loadedCount);
                    return;
                }

                const audio = new Audio();
                audio.src = track.Url;

                audio.addEventListener('loadedmetadata', () => {
                    durations[index] = audio.duration;
                    ////console.log(`Metadata Loaded: ${track.Title}, Duration: ${audio.duration.toFixed(2)}s`);

                    loadedCount++;
                    this.checkIfAllLoaded(player, playlist, durations, loadedCount);
                });

                audio.addEventListener('error', () => {
                    console.error(`Error loading track: ${track.Title}`);
                    durations[index] = 0;
                    loadedCount++;
                    this.checkIfAllLoaded(player, playlist, durations, loadedCount);
                });
            });
        }

        private checkIfAllLoaded(player, playlist: Models.PlaylistItem[], durations, loadedCount) {
            if (loadedCount === playlist.length) {
                playlist.forEach((track, index) => {
                    track.Duration = durations[index]
                        ? `${this.formatTime(durations[index]) + ' min'}`
                        : '00:00';
                });
                player.trigger('playlistloaded', playlist);
            }
        }

        public formatTime(seconds: number): string {
            ////console.log("************* formatTime ********************")
            const minutes = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return minutes + ':' + (sec < 10 ? '0' : '') + sec;
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
                    setTimeout(function () {
                        //audioPlayerView.play();
                    }, 500)
                }
            }
        }




        public onQuesClicked(item: Models.PlaylistItem): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;
            //let knowledge : KnowledgeCheck =this;
            // alert(item.Id)

            //item.Complete=true;
            playlistView.trigger(Events.EVENT_QUESTION_CLICKED, item);


        }

        public onKcItemClicked(item: Models.PlaylistItem): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;
            //let knowledge : KnowledgeCheck =this;
            //alert(item.Id)

            //item.Complete=true;
            playlistView.trigger(Events.EVENT_KCITEM_CLICKED, item);


        }



        public onItemClicked(item: Models.PlaylistItem): void {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;

            if (playlistModel.CurrentItem.id === item.Id) {
                return;
            }

            if (item.IsAssessment) {
                playlistView.trigger(Events.EVENT_LAUNCH_ASSESSMNET);
                try {
                    playlistModel.isKClistComplete()
                } catch (error) { }
                return;
            }

            if (item.IsSurvey) {
                playlistView.trigger(Events.EVENT_LAUNCH_SURVEY);
                return;
            }
            //playlistModel.setCurrentClicked(item.Id);
            playlistModel.CurrentItem.CurrentClicked = false;
            playlistModel.CurrentItem.Current = false;
            playlistModel.CurrentItem = item;
            playlistModel.CurrentItem.Current = true;
            playlistModel.CurrentItem.CurrentClicked = true;
            playlistModel.CurrentItem.Disabled = false;
            playlistModel.CurrentListItem = item.Index;
            playlistModel.CurrentItem.Inprogress = true;


            playlistView.trigger(Events.EVENT_SELECTION_CHANGE, item);
            playlistView.trigger(Events.EVENT_NextBack_CHANGE);

        }

        /**
         * onNextBackClicked
         */
        public onNextBackClicked() {
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model;
            playlistView.trigger(Events.EVENT_NextBack_CHANGE);

        }

        public getNextItem(index: number, increment?: boolean): Models.PlaylistItem {
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

        onoffAudio(): void {
            //console.log("onoffAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_ONOFFAUDIO);

        }

        onClosePlaylist(): void {
            let playlistView: Playlist = this;


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
            //playlistView.enableNextKc(curVidId)

        }

        // enableNextKc(curVidId: string): void {
        //     let playlistView: Playlist = this;
        //     playlistView.model.enableNextKc(curVidId);

        // }

        onInitPlayer(): void {
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_INIT_PLAYER);
            // alert("initplayer")

        }

        togglePlayPause(): void {
            // e.stopPropagation();
            //console.log("togglePlayPause")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_TOGGLE);
        }

        refreshAudio(): void {
            //console.log("refreshAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_REFRESH);

        }

        ccAudio(): void {
            //console.log("ccAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_CC);

        }
        transcriptAudio(): void {
            //console.log("transcriptAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_TRANSCRIPT);

        }
        backAudio(): void {
            console.log("transcriptAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_BACKAUDIO);

        }
        nextAudio(): void {
            //console.log("transcriptAudio")
            let playlistView: Playlist = this;
            playlistView.trigger(Events.EVENT_ITEM_NEXTAUDIO);

        }


        seekAudio(time: any): void {
            //console.log("seekAudio")
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                playlistContainer: JQuery = playlistView.$el.parent();

            //playlistModel.CurrentItem.CurrentTime=time;
            playlistView.trigger(Events.EVENT_ITEM_SEEK);
            // alert("seekAudio")
        }

        speedListAudio(): void {
            //console.log("speedListAudio")
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                playlistContainer: JQuery = playlistView.$el.parent();

            //playlistModel.CurrentItem.CurrentTime=time;
            playlistView.trigger(Events.EVENT_ITEM_SPEEDLIST);

        }

        speedClickAudio(): void {
            //console.log("speedClickAudio")
            let playlistView: Playlist = this,
                playlistModel: Models.Playlist = playlistView.model,
                playlistContainer: JQuery = playlistView.$el.parent();
            //playlistModel.CurrentItem.CurrentTime=time;
            playlistView.trigger(Events.EVENT_ITEM_CLICKED_SPEED);


        }


    }
}