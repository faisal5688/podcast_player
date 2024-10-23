/// <reference path="../../../../type-defs/videojs.d.ts" />
/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />

/// <reference path="../../modal-dialog/view/modal-dialog.ts" />
/// <reference path="../model/audio-player.ts" />

/// <reference path="../../carousel/model/carousel.ts" />


namespace HTML5AudioPlayer.Components.Views {

    export class AudioPlayer extends Backbone.View<Models.AudioPlayer> {

        private _template: (properties?: HandlebarsTemplates) => string;

        private _playlist: Playlist;
        public _myPlayer: VideoJSPlayer;
        private _currentTextTrack: any;
        private _playingonMinimize: boolean;
        private _questionlistItem: QuestionlistItem;




        private playPauseBtn: JQuery<HTMLElement> | null = null;
        private progressBar: JQuery<HTMLInputElement> | null = null;
        private currentTimeDisplay: JQuery<HTMLElement> | null = null;
        private totalTimeDisplay: JQuery<HTMLElement> | null = null;

        private _videoEventListners: {
            'timeupdate': () => void;
            'ended': () => void;
            'loadedmetadata': () => void;
            'stalled': () => void;
            'suspend': () => void;
            'error': () => void;
            'seeking': () => void;
            'seeked': () => void;
            'playing': () => void;
        };

        // This is used to store player play/pause status while opening and closing playlist on iPhone.
        private _playerPausedOnShowPlaylist: boolean;

        constructor(options: Backbone.ViewOptions<Models.AudioPlayer>) {
            super(options);

            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            audioPlayerView._currentTextTrack = null;
            audioPlayerModel._retries = 0;

            audioPlayerView._template = HBTemplates['audio-player'];

            audioPlayerView.$el.addClass("audio-player");

            audioPlayerView.playPauseBtn = $('.audio-player-template .play-pause');
            audioPlayerView.progressBar = $('.audio-player-template .progress-bar');
            audioPlayerView.currentTimeDisplay = $('.audio-player-template .current-time');
            audioPlayerView.totalTimeDisplay = $('.audio-player-template .total-time');

            // create contexted video listners
            audioPlayerView._videoEventListners = {
                'timeupdate': audioPlayerView.onAudioTimeUpdate.bind(audioPlayerView),
                'ended': audioPlayerView.onVideoEnded.bind(audioPlayerView),
                'loadedmetadata': audioPlayerView.onMetadataLoaded.bind(audioPlayerView),
                'stalled': audioPlayerView.OnStalled.bind(audioPlayerView),
                'suspend': audioPlayerView.OnSuspend.bind(audioPlayerView),
                'error': audioPlayerView.onError.bind(audioPlayerView),
                'seeking': audioPlayerView.onSeeking.bind(audioPlayerView),
                'seeked': audioPlayerView.onSeeked.bind(audioPlayerView),
                'playing': audioPlayerView.onPlaying.bind(audioPlayerView)
            };

            audioPlayerView._playlist = new Playlist({
                id: _.uniqueId("playlist"),
                className: "playlist",
                model: audioPlayerModel.Playlist
            });

            // audioPlayerView._questionlistItem = new QuestionlistItem({
            //     id: _.uniqueId("playlist"),
            //     className: "playlist",
            //     model: audioPlayerModel.Playlist
            // });
            console.log("audioPlayerModel.Playlist")
            console.log(audioPlayerModel.Playlist)


            audioPlayerView._playlist.on(Events.EVENT_SELECTION_CHANGE, audioPlayerView.onVideoChanged, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_SHOW_GLOSSARY, audioPlayerView.onShowGlossary, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_SHOW_INDEX, audioPlayerView.onShowIndex, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_SHOW_RESOURCES, audioPlayerView.onShowResource, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_PLAYLIST_CLOSED, audioPlayerView.onPlaylistClosed, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_LAUNCH_ASSESSMNET, audioPlayerView.onLaunchAssessment, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_LAUNCH_SURVEY, audioPlayerView.onLaunchSurvey, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_AUDIOPLAYPAUSE_CHANGE, audioPlayerView.togglePlayPause, audioPlayerView);
            audioPlayerModel.on("change:CuePoints", audioPlayerView.resetCuePointStatus, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_QUESTION_CLICKED, audioPlayerView.triggerQuetion, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_KCITEM_CLICKED, audioPlayerView.triggerKcItem, audioPlayerView);

            audioPlayerView._playlist.on(Events.EVENT_ITEM_TOGGLE, audioPlayerView.onItemClickedToggle, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_REFRESH, audioPlayerView.onItemClickedRefresh, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_SEEK, audioPlayerView.onItemClickedSeek, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_INIT_PLAYER, audioPlayerView.onItemInitPlayer, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_SPEEDLIST, audioPlayerView.onItemClickedSpeedList, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_CLICKED_SPEED, audioPlayerView.onItemClickedSpeed, audioPlayerView);

            audioPlayerView._playlist.on(Events.EVENT_ITEM_CC, audioPlayerView.onItemClickedCc, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_TRANSCRIPT, audioPlayerView.onItemClickedTranscript, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_BACKAUDIO, audioPlayerView.onItemClickedBackaudio, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_ITEM_NEXTAUDIO, audioPlayerView.onItemClickedNextaudio, audioPlayerView);




            // audioPlayerView._crousel = new Carousel({
            //     id: _.uniqueId("Carousel"),
            //     className: "Carousel",
            //     model: audioPlayerModel.Carousel
            // });

            // console.log("audioPlayerModel.Carousel")
            // console.log(audioPlayerModel.Carousel)

            // audioPlayerView._playlist[0]
            // audioPlayerModel.Playlist.CurrentItem.NumQuestions = 5;
        }

        @named
        public render() {
            let audioPlayerView = this,
                audioPlayerModel: Models.AudioPlayer = this.model;
            //console.log("**************")
            //console.log(audioPlayerModel.toJSON())
            audioPlayerView.$el.html(audioPlayerView._template(audioPlayerModel.toJSON()));
            let playlistContainer: JQuery = audioPlayerView.$(".playlist-container");
            if (audioPlayerModel.CourseMode !== DataStructures.CourseMode.CPE) {
                Utilities.consoleTrace("Adding no-cpe to playlist container");
                playlistContainer.addClass("no-cpe");
            }
            if (!audioPlayerModel.Playlist.Visible && !Utilities.isiPhone()) {
                playlistContainer.addClass("animate-right");
                audioPlayerView.$(".player-container").addClass("fullWidth");
            }
            playlistContainer.append(this._playlist.render().$el);

            //audioPlayerView.model.Playlist.num

            // let crouserContainer: JQuery = audioPlayerView.$(".carousel-container");
            // crouserContainer.append(this._crousel.render().$el);

            // console.log("audioPlayerModel.CuePoints")
            // console.log(audioPlayerModel.CuePoints)
            return audioPlayerView;
        }

        @named
        public afterRender(): void {
            let audioPlayerView: AudioPlayer = this;


            audioPlayerView.initPlayer();

            audioPlayerView._playlist.afterRender();

            // audioPlayerView._crousel.afterRender();
            audioPlayerView.updateAudioDesc();

            //alert("afterRender")

            //let playlistItemView = this;
            //playlistItemModel: Models.PlaylistItem = this.model;
            //playlistItemView.$el.removeClass("current");
            // let audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            // audioPlayerView.model.Playlist.$el.removeClass("current");
        }

        public myPlayer(): VideoJSPlayer {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            return this._myPlayer;
        }

        /**
         * Video js needs the video tag to be rendered on the page before it can initialize itself,
         * initPlayer is to be called after the render function completes.
         */
        @named
        private initPlayer(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            audioPlayerView.enable(false);

            audioPlayerView._myPlayer = videojs(audioPlayerModel.AudioId,
                audioPlayerModel.PlayerOptions, audioPlayerView.onReady.bind(audioPlayerView));

            audioPlayerView._myPlayer.on('ended', audioPlayerView._videoEventListners.ended);
            audioPlayerView._myPlayer.on('loadedmetadata', audioPlayerView._videoEventListners.loadedmetadata);
            audioPlayerView._myPlayer.on('stalled', audioPlayerView._videoEventListners.stalled);
            audioPlayerView._myPlayer.on('suspend', audioPlayerView._videoEventListners.suspend);
            audioPlayerView._myPlayer.on('error', audioPlayerView._videoEventListners.error);
            audioPlayerView._myPlayer.on('playing', audioPlayerView._videoEventListners.playing);

            audioPlayerView._myPlayer.on('timeupdate', audioPlayerView._videoEventListners.timeupdate);
            audioPlayerView._myPlayer.on('seeking', audioPlayerView._videoEventListners.seeking);
            audioPlayerView._myPlayer.on('seeked', audioPlayerView._videoEventListners.seeked);

            if (!audioPlayerModel.ContinueOnFocusout) {
                $(document).on('visibilitychange', audioPlayerView.onVisibilitychange.bind(audioPlayerView));
            }
        }

        @named
        public play(): void {
            this._myPlayer.play();
        }

        @named
        public pause(): void {
            this._myPlayer.pause();

        }

        @named
        public paused(): boolean {
            return this._myPlayer.paused();
        }

        @named
        private onPlaying(): void {
            let audioPlayerView: AudioPlayer = this,
                curTime: number = audioPlayerView._myPlayer.currentTime();

            if (curTime < 0.1) {
                audioPlayerView.triggerCuepoint(DataStructures.KCWhen.Start);
            }
        }

        @named
        private onVisibilitychange(): void {
            let audioPlayerView: AudioPlayer = this;
            Utilities.consoleLog("visibilityState: ", document.visibilityState);
            if (document.visibilityState === "hidden") {
                if (audioPlayerView._myPlayer
                    && !audioPlayerView._myPlayer.paused()) {
                    Utilities.consoleLog("Pause the player.");
                    audioPlayerView._myPlayer.pause();
                    audioPlayerView._playingonMinimize = true;
                }
            }
            else {
                if (audioPlayerView._playingonMinimize
                    && audioPlayerView._myPlayer
                    && audioPlayerView._myPlayer.paused()) {
                    Utilities.consoleLog("Start the player.");
                    audioPlayerView._playingonMinimize = false;
                    try {
                        audioPlayerView._myPlayer.play();
                    } catch (error) {
                        Utilities.consoleLog(error);
                    }
                }
            }
        }

        @named
        private onError(err: MediaError) {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            Utilities.consoleError("Video ERROR: ", audioPlayerView._myPlayer.error_);
            switch (audioPlayerView._myPlayer.error_.code) {
                case MediaError.MEDIA_ERR_DECODE:
                    Utilities.consoleWarn("MEDIA_ERR_DECODE");
                    break;
                case MediaError.MEDIA_ERR_ABORTED:
                    Utilities.consoleWarn("MEDIA_ERR_ABORTED");
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    Utilities.consoleWarn("MEDIA_ERR_NETWORK");
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    Utilities.consoleWarn("MEDIA_ERR_SRC_NOT_SUPPORTED");
                    break;
                default:
                    Utilities.consoleWarn("Unknown ERROR...", audioPlayerView._myPlayer.error_.code);
                    break;
            }

            if (audioPlayerModel._retries === 3) {
                // reteies complete
                // show error message to user and add a manual retry button.
                audioPlayerModel._retries = 0;
                let modal: Models.ModalDialog = new Models.ModalDialog({
                    "heading": audioPlayerModel.Messages.failTitle,
                    "hasclose": false,
                    "hasProgressbar": false,
                    "content": audioPlayerModel.Messages.failMessage,
                    "buttons": audioPlayerModel.Messages.buttons
                }),
                    modalView: Views.ModalDialog = new Views.ModalDialog({
                        model: modal
                    });

                modalView.once(Events.EVENT_MODAL_CLOSED, function (buttonID: string) {
                    if (buttonID === "retry") {
                        audioPlayerView.enable(false, "Retrying manually.");
                        setTimeout(() => {
                            audioPlayerModel._startPlayingOnError = true;
                            audioPlayerView.changeVideo(audioPlayerView.model.Playlist.CurrentItem);
                        }, 500);
                    }
                });
                modalView.showModal();
                audioPlayerView.enable();
            }
            else {
                audioPlayerModel._retries++;
                Utilities.consoleWarn("Retrying for the video: ", audioPlayerModel.Playlist.CurrentItem.Url, " count: ", audioPlayerModel._retries);

                audioPlayerView.enable(false, "Error while loading video. Retrying...");
                // wait for half a second before retrying...
                setTimeout(() => {
                    audioPlayerModel._startPlayingOnError = true;
                    audioPlayerView.changeVideo(audioPlayerView.model.Playlist.CurrentItem);
                }, 500);
            }
        }

        @named
        private onReady(e: Event): void {
            let audioPlayerView: AudioPlayer = this;

            Utilities.consoleLog("Player Ready...");

            audioPlayerView.addScrubRestricter(audioPlayerView._myPlayer);

            audioPlayerView.addButtonsToPlayer();
            audioPlayerView.updateTexttrack();
            // audioPlayerView._myPlayer.play();
        }

        @named
        private addScrubRestricter(player: any): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                vjs: any = videojs,
                progressControl = player.controlBar.progressControl,
                VjsSeekBar = vjs.getComponent("SeekBar"),
                isModeOpen: boolean = audioPlayerModel.CourseMode === DataStructures.CourseMode.OPEN,
                videoUnBlocked: boolean = false;

            // Seek video only on mouse up and not on mouse down.
            // Update the default function but do call the default as well.
            VjsSeekBar.prototype.defaulthandleMouseUp = VjsSeekBar.prototype.handleMouseUp;
            VjsSeekBar.prototype.handleMouseUp = function (evt) {
                let newTime = this.calculateDistance(evt) * this.player_.duration();

                // Don't let video end while scrubbing.
                if (newTime === this.player_.duration()) {
                    newTime = newTime - 0.1;
                }

                videoUnBlocked = (HTML5AudioPlayer.UNLOCK_AUDIOS || isModeOpen);
                // Allow seeking based on max visited time.
                if (videoUnBlocked || (newTime < audioPlayerModel.maxVisitedTime)) {
                    Utilities.consoleTrace("Seeking video to new time: " + newTime);
                    this.player_.currentTime(newTime);
                }
                else if (videoUnBlocked || (newTime > audioPlayerModel.maxVisitedTime)) {
                    let currentTime = this.player_.currentTime(),
                        delta = Math.abs(currentTime - audioPlayerModel.maxVisitedTime);

                    if (delta > audioPlayerModel.UpdateInterval) {
                        Utilities.consoleTrace("Seeking video to max time: " + audioPlayerModel.maxVisitedTime);
                        this.player_.currentTime(audioPlayerModel.maxVisitedTime);
                    }
                    else {
                        Utilities.consoleTrace("Not Seeking video to max time as (current time - max time) delta is small: " + delta);
                    }
                }

                this.defaulthandleMouseUp.call(this, evt);
            };

            let restrictedSeekBar = vjs.extend(VjsSeekBar, {
                constructor: function (player, options) {
                    VjsSeekBar.call(this, player, options);
                },
                handleMouseMove: function (e) { }
            });

            vjs.registerComponent("restrictedSeekBar", restrictedSeekBar);
            progressControl.addChild("restrictedSeekBar", {});
        }

        @named
        private addButtonsToPlayer(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            audioPlayerView.addPlayerButton(audioPlayerView._myPlayer, "replayButton", "Rewind",
                function (): void {
                    audioPlayerView.restartVideo();
                },
                function () {
                    return "vjs-icon-replay vjs-control vjs-button";
                });

            audioPlayerView.addPlayerButton(audioPlayerView._myPlayer, "transcriptButton", "Transcript",
                function (): void {
                    audioPlayerView.showTranscript();
                },
                function () {
                    return "vjs-icon-tumblr vjs-control vjs-button";
                });

            audioPlayerView.addPlayerButton(audioPlayerView._myPlayer, "toggleCaptionsButton", "Captions",
                function (): void {
                    audioPlayerView.toggleCaptions();
                },
                function () {
                    //alert(audioPlayerModel.CaptionsEnabled)
                    if(audioPlayerModel.CaptionsEnabled){
                        $(".cc_text_btn").addClass("captions-enabled").removeClass("captions-disabled");
                    }else{
                        $(".cc_text_btn").addClass("captions-disabled").removeClass("captions-enabled");
                    }
                    return "vjs-icon-toggle-captions vjs-control vjs-button " + (audioPlayerModel.CaptionsEnabled ? "captions-enabled" : "captions-disabled");
                });

            audioPlayerView.addPlayerButton(audioPlayerView._myPlayer, "playlistButton", "Show/Hide Playlist",
                function (): void {
                    audioPlayerView.togglePlaylist();
                },
                function () {
                    return "vjs-icon-chapters vjs-control vjs-button";
                });
        }

        @named
        private addPlayerButton(player: VideoJSPlayer, conponentName: string, controlText: string, clickCallback: () => void, buildCSSClass: () => void, options?: any): any {

            let vjs: any = videojs,
                controlbar = player.getChild("controlBar"),
                VjsButton = vjs.getComponent("Button");

            let btnSettings: any = {
                constructor: function (player, options) {
                    VjsButton.call(this, player, options);
                    this.controlText(controlText);
                },
                buildCSSClass: buildCSSClass
            };

            if (clickCallback) {
                btnSettings.handleClick = clickCallback;
            }

            if (options) {
                btnSettings = _.extend(btnSettings, options);
            }

            let customBtn = vjs.extend(VjsButton, btnSettings);
            vjs.registerComponent(conponentName, customBtn);
            controlbar.addChild(conponentName, {});
            return customBtn;
        }

        @named
        private onAudioTimeUpdate(e: Event): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                videoChanged: boolean = (audioPlayerModel._prevItemId !== audioPlayerModel.Playlist.CurrentItem.Id),
                currentTime = audioPlayerView._myPlayer.currentTime();

            //console.log("onAudioTimeUpdate")
            audioPlayerView.updateProgress(audioPlayerView._myPlayer)
            if (videoChanged) {
                Utilities.consoleTrace("Got time update after video changed, don't do anything.");
                return;
            }

            if (audioPlayerView._myPlayer.seeking()) {
                Utilities.consoleTrace("Video is seeking, not updating max time. Current Value: " + audioPlayerModel.maxVisitedTime);
                return;
            }

            audioPlayerModel.supposedCurrentTime = currentTime;

            // choose the larger value as max.
            audioPlayerModel.maxVisitedTime = (audioPlayerModel.maxVisitedTime < audioPlayerModel.supposedCurrentTime
                ? audioPlayerModel.supposedCurrentTime
                : audioPlayerModel.maxVisitedTime);

            audioPlayerModel.Playlist.CurrentItem.CurrentTime = audioPlayerModel.maxVisitedTime;
            audioPlayerView.triggerCuepoint(currentTime);
            audioPlayerView.openMicroPoll(false, currentTime);

            // save in SCORM structure
            let curObj: DataStructures.AudioScormData = audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id];

            if (!curObj) {
                curObj = new DataStructures.AudioScormData();
                curObj.c = 0;
                curObj.t = 0;
                curObj.k = 0;
                curObj.n = 0;
            }

            if (0 === curObj.c) {
                //if (!audioPlayerModel.hasEndKC()) {
                if (audioPlayerModel.maxVisitedTime > (audioPlayerView._myPlayer.duration() - audioPlayerModel.CompletionDelta)) {
                    audioPlayerModel.maxVisitedTime = audioPlayerView._myPlayer.duration();
                    curObj.c = 1;
                    //audioPlayerModel.Playlist.CurrentItem.Complete = true;
                    //audioPlayerModel.Playlist.enableAssessment();
                    //alert(4)
                    //audioPlayerModel.Playlist.QuestionlistItems[0].Complete=true;

                }
                //}
                curObj.t = parseFloat(audioPlayerModel.maxVisitedTime.toFixed(2));

                curObj.n = audioPlayerModel.CuePoints.length;

                audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id] = curObj;

                if (curObj.c
                    || ((audioPlayerModel.maxVisitedTime - audioPlayerModel.lastUpdateTime) >= audioPlayerModel.UpdateInterval)) {
                    audioPlayerModel.lastUpdateTime = audioPlayerModel.maxVisitedTime;
                    audioPlayerModel.sendDataToScorm();
                }
            }
        }


        @named
        public markCurrentVideoComplete(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            let curObj: DataStructures.AudioScormData = audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id];

            if (!curObj) {
                curObj = new DataStructures.AudioScormData();
                curObj.c = 0;
                curObj.t = 0;
                curObj.k = 0;
                curObj.n = 0;
            }

            audioPlayerModel.maxVisitedTime = audioPlayerView._myPlayer.duration();
            curObj.c = 1;
            audioPlayerModel.Playlist.CurrentItem.Complete = true;
            audioPlayerModel.Playlist.enableAssessment();
            //alert(3)
            //audioPlayerModel.Playlist.CurrentQuesItem.Complete = true;
            curObj.t = parseFloat(audioPlayerModel.maxVisitedTime.toFixed(2));
            audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id] = curObj;

            curObj.n = audioPlayerModel.CuePoints.length;
        }

        // public enableAssessment():void{
        //     let audioPlayerView: AudioPlayer = this,
        //         audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
        //     let assessmentItem = audioPlayerModel.Playlist.PlaylistItems.filter((val) => {
        //         return val.IsAssessment;
        //     })[0];
        //     if(audioPlayerModel.Playlist.isItemComplete() && audioPlayerModel.Playlist.isKcComplete()){
        //         assessmentItem.Disabled=false;
        //     }else{
        //         assessmentItem.Disabled=true;
        //     }
        // }

        public kcItemActiveList(): number {
            let audioPlayerView: AudioPlayer = this,
            audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            return audioPlayerModel.Playlist.kcItemActiveList();
        }

        public enableKcItem(vidId?: string): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            let CurrentItem = audioPlayerModel.Playlist.KnowledgeCheckItems.filter((val) => {
                return val.Id === vidId;
            })[0];
            let curObj: DataStructures.KcScormData = audioPlayerModel.ScormPreviousData[CurrentItem.Id];
            if (!curObj) {
                curObj = new DataStructures.KcScormData();
                curObj.c = 0;
                curObj.e = 0;
            }

            curObj.e = 1;
            audioPlayerModel.ScormPreviousData[CurrentItem.Id] = curObj;
            CurrentItem.Disabled = false;
            //alert()
            //audioPlayerModel.Playlist.completeKc(vidId);
            //audioPlayerModel.Playlist.enableAssessment();
        }

        public checkCurKcComplete(vidId?: string): Boolean {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

                let CurrentItem = audioPlayerModel.Playlist.KnowledgeCheckItems.filter((val) => {
                    return val.attributes.id === vidId;
                })[0];
            return CurrentItem.Complete;

        }

        public markKcKCItemComplete(vidId?: string): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            console.log(vidId)
            //console.log(audioPlayerModel.Playlist.KnowledgeCheckItems)
            //console.log(audioPlayerModel.CuePoints)
            let CurrentItem = audioPlayerModel.Playlist.KnowledgeCheckItems.filter((val) => {
                return val.attributes.id === vidId;
            })[0];

            let CurrentCueItem = audioPlayerModel.CuePoints.filter((val) => {
                return val.id === vidId;
            })[0];
            //console.log("markKcKCItemComplete CurrentItem")
           // console.log(CurrentItem.Kccomplete)
            //CurrentCueItem.completed = true;
            console.log("****************************************************")
            console.log(CurrentItem)

            CurrentItem.Complete = true;

            let curObj: DataStructures.KcScormData = audioPlayerModel.ScormPreviousData[CurrentItem.Id];
            if (!curObj) {
                curObj = new DataStructures.KcScormData();
                curObj.c = 0;
                curObj.e = 0;
            }

            curObj.c = 1;
            audioPlayerModel.ScormPreviousData[CurrentItem.Id] = curObj;
            audioPlayerModel.Playlist.enableAssessment();

        }

        public markKcComplete(vidId?: string): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            let CurrentItem = audioPlayerModel.Playlist.PlaylistItems.filter((val) => {
                return val.Id === vidId;
            })[0];
            console.log(vidId)

            console.log("CurrentItem")
            console.log(CurrentItem)



            let curObj: DataStructures.AudioScormData = audioPlayerModel.ScormPreviousData[CurrentItem.Id];

            if (!curObj) {
                curObj = new DataStructures.AudioScormData();
                curObj.c = 0;
                curObj.t = 0;
                curObj.k = 0;
                curObj.n = 0;
            }

            curObj.k = 1;
            CurrentItem.Kccomplete = true;
            audioPlayerModel.Playlist.completeKc(vidId);
            audioPlayerModel.Playlist.enableAssessment();
            //alert(vidId)
        }

        @named
        public markAssessmentComplete(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                asd: DataStructures.AssessmentScormData = audioPlayerModel.ScormPreviousData.assessment;
            if (asd) {
                let playList = audioPlayerModel.Playlist.PlaylistItems.filter((val) => {
                    return val.IsAssessment;
                })[0];
                if (asd.score >= audioPlayerModel.PassingPercent) {
                    playList.Complete = true;
                    playList.Disabled = false;
                } else {
                    playList.Disabled = false;
                }
            }
        }

        public assessmentCompleted(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                playList = audioPlayerModel.Playlist.PlaylistItems,
                sormPreviousData = audioPlayerModel.ScormPreviousData,
                lastPlayListItem = playList[playList.length - 1];

            if (!lastPlayListItem.IsAssessment &&
                (!(sormPreviousData.survey && sormPreviousData.survey.completed))) {
                audioPlayerView.enableNext();
                audioPlayerView.next(true);
            }
        }

        @named
        public markSurveyCompleted(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                playList = audioPlayerModel.Playlist.PlaylistItems,
                lastPlayListItem = playList[playList.length - 1];

            for (let i = 0; i < playList.length; i++) {
                const playlistItem = playList[i];
                if (playlistItem.IsSurvey) {
                    playlistItem.Complete = true;
                }
            }
            if (!lastPlayListItem.IsSurvey) {
                audioPlayerView.enableNext();
                audioPlayerView.next();
            }
        }

        @named

        private triggerQuetion(item: Models.PlaylistItem) {
            let audioPlayerView: AudioPlayer = this;
            // audioPlayerModel: Models.AudioPlayer = this.model,
            //cp: DataStructures.CuePoint = null,
            //delta: number = 0;

            // alert()
            //cp = audioPlayerModel.CuePoints[0];
            //Utilities.consoleTrace("cp",cp)
            //audioPlayerView.trigger(Events.EVENT_CUEPOINT_HIT, cp);
            //alert("cp")
            audioPlayerView.trigger(Events.EVENT_CURRENT_QUESTION, item);

        };
        private triggerKcItem(item: Models.PlaylistItem) {
            let audioPlayerView: AudioPlayer = this;
            // audioPlayerModel: Models.AudioPlayer = this.model,
            //cp: DataStructures.CuePoint = null,
            //delta: number = 0;

            // alert()
            //cp = audioPlayerModel.CuePoints[0];
            //Utilities.consoleTrace("cp",cp)
            //audioPlayerView.trigger(Events.EVENT_CUEPOINT_HIT, cp);
            //alert("cp")
            audioPlayerView.trigger(Events.EVENT_CURRENT_KCITEM, item);

        };


        @named
        private triggerCuepoint(currentTime: number): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                cp: DataStructures.CuePoint = null,
                delta: number = 0;

            if (audioPlayerModel.CuePoints) {
                for (let i: number = 0; i < audioPlayerModel.CuePoints.length; i++) {
                    cp = audioPlayerModel.CuePoints[i];

                    delta = Math.abs(currentTime - cp.time);

                    if ((cp.time === currentTime) || (delta <= audioPlayerModel.CuePointDelta)) {
                        if (!cp.triggered) {
                            cp.triggered = true;
                            cp.visited = true;
                           // alert(cp.id)
                            Utilities.consoleTrace("Trigger cue point event for: ", cp.id, audioPlayerView.cid, currentTime);
                            audioPlayerView.trigger(Events.EVENT_CUEPOINT_HIT, cp);
                            //alert("CP")
                        }
                        else {
                            Utilities.consoleTrace("Already Triggered cue point event for: ", cp.id);
                        }
                        break;
                    }
                }
            }
        }

        @named
        private resetCuePointStatus(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                currentTime: number = audioPlayerView._myPlayer.currentTime();

            Utilities.consoleTrace("resetting CuePoints ", audioPlayerModel.CuePoints, currentTime);
            if (audioPlayerModel.CuePoints) {
                for (let i = 0; i < audioPlayerModel.CuePoints.length; i++) {
                    let cp: DataStructures.CuePoint = audioPlayerModel.CuePoints[i];
                    if ((currentTime <= cp.time) || (cp.time === DataStructures.KCWhen.End)) {
                        cp.triggered = false;
                        //cp.visited = true;
                    }

                    // let curObj: DataStructures.AudioScormData = audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id];

                    // if ((curObj.k == 1)) {
                    //     cp.visited = true;
                    // }
                }
            }
        }

        /**
         * Opens the micropoll in a pop-up window.
         * @param atEnd default: value true. Pass false if micropoll is to be opened while playing the video
         * @param currentTime current play time of the video. Not required if atEnd is true.
         */
        @named
        private openMicroPoll(atEnd: boolean = true, currentTime: number = -1): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                microPoll: DataStructures.MicroPoll = audioPlayerModel.Playlist.CurrentItem.MicroPolls.filter((mp) => {
                    if (atEnd) {
                        return mp.time === "end";
                    }

                    if (mp.time === "end") {
                        return false;
                    }

                    let time = parseInt(mp.time),
                        delta: number = Math.abs(currentTime - time);
                    return ((time === currentTime) || (delta <= 0.4));
                })[0];

            // open Micropoll if available and not yet opened
            if (microPoll && !microPoll.opened) {
                microPoll.opened = true;
                if (!atEnd && microPoll.pause) {
                    audioPlayerView.pause();
                }
                Utilities.consoleTrace("Opening Poll: ", microPoll.id);
                Utilities.openPopupWindow(microPoll.url);
            }
        }

        @named
        private resetMicroPollStatus(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                currentTime: number = audioPlayerView._myPlayer.currentTime(),
                mps: DataStructures.MicroPoll[] = audioPlayerModel.Playlist.CurrentItem.MicroPolls;

            // do not reset staus if re-polling not enabled.
            if (!audioPlayerModel.RePollOnSeek) {
                return;
            }

            Utilities.consoleTrace("resetting MicroPolls ", JSON.stringify(mps));
            for (let i = 0; i < mps.length; i++) {
                let mp: DataStructures.MicroPoll = mps[i];
                if (mp.time === "end") {
                    mp.opened = false;
                    return;
                }
                let time = parseInt(mp.time);
                if (currentTime <= time) {
                    mp.opened = false;
                }
            }
        }

        @named
        private onVideoEnded(e: Event): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            audioPlayerView.enable(false);
            audioPlayerModel.supposedCurrentTime = 0;

            audioPlayerView.openMicroPoll();

            // if (audioPlayerModel.hasEndKC()) {
            //     audioPlayerView.enable();
            //     audioPlayerView.triggerCuepoint(DataStructures.KCWhen.End);
            //     audioPlayerView.resetCuePointStatus();
            // }
            // else {
            //     audioPlayerView.enableNext();
            //     if (audioPlayerModel.AutoAdvanceToNext) {
            //         audioPlayerView.next();
            //     }
            //     audioPlayerView.enable();
            // }

            if (audioPlayerModel.hasEndKC()) {
                //audioPlayerView.enable();
                audioPlayerView.triggerCuepoint(DataStructures.KCWhen.End);
                //audioPlayerView.resetCuePointStatus();
            }

            audioPlayerModel.Playlist.CurrentItem.CurrentClicked = true;
            audioPlayerModel.Playlist.CurrentItem.Complete = true;

            audioPlayerView.enableNext();
            if (audioPlayerModel.AutoAdvanceToNext) {
                audioPlayerView.next();
            }
            audioPlayerView.enable();
            audioPlayerModel.Playlist.enableAssessment();
            $('.audio-player-template .play-pause').text('Play').addClass("play").removeClass("pause");
            //alert(1)
        }

        private onLaunchAssessment(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.trigger(Events.EVENT_LAUNCH_ASSESSMNET);
        }

        private onLaunchSurvey(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.trigger(Events.EVENT_LAUNCH_SURVEY);
        }

        @named
        private OnStalled(evt: any): void {
            Utilities.consoleTrace("The browser is trying to get media data, but data is not available. Waiting for the connection.");
        }

        @named
        private OnSuspend(evt: any): void {
            Utilities.consoleTrace("Audio is suspended, waiting...");
        }

        @named
        private getNumberQuestion(item: Models.PlaylistItem): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            item.NumQuestions = audioPlayerModel.CuePoints.length;
        }

        @named
        private onVideoChanged(item: Models.PlaylistItem): void {
            //alert("onVideoChanged 1")
            let audioPlayerView: AudioPlayer = this;

            Utilities.consoleLog("Video Changed to: " + item.Id);

            audioPlayerView.enable(false);

            // if video is playing, pause the video and make any changes only after video is paused
            if (audioPlayerView._myPlayer.paused()) {
                Utilities.consoleTrace("Player paused, safe to change the video.");
                audioPlayerView.changeVideo(item);
            }
            else {
                Utilities.consoleTrace("Player not paused, first pause the video and then change the video.");
                audioPlayerView._myPlayer.one('pause', function (): void {
                    audioPlayerView.changeVideo(item);
                });
            }
            audioPlayerView.pause();
        }

        @named
        private changeVideo(item: Models.PlaylistItem): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                updatingSameVideo: boolean = (audioPlayerModel._prevItemId === audioPlayerModel.Playlist.CurrentItem.Id);

            audioPlayerView._myPlayer.src(item.Url);
            item.NumQuestions = audioPlayerModel.CuePoints.length;
            //audioPlayerView._audioPlayer  = audioPlayerView._myPlayer;
            Utilities.consoleTrace("Prev Item: ", audioPlayerModel._prevItemId,
                ", Current Item: ", item.Id);

            // only if not updating to current video.
            if (!updatingSameVideo) {
                Utilities.consoleTrace("Changed to: ", item);
                audioPlayerModel._prevItemId = item.Id;
                //audioPlayerModel.Poster = item.PreviewImage;
                //audioPlayerView._myPlayer.poster(audioPlayerModel.Poster);
                audioPlayerView.updateAudioDesc();
                audioPlayerView.updateTexttrack();

                audioPlayerModel.maxVisitedTime = item.CurrentTime;
                audioPlayerModel.lastUpdateTime = audioPlayerModel.maxVisitedTime;
                // save to scorm.
                audioPlayerModel.ScormPreviousData.cv = item.Id;
                audioPlayerModel.ScormPreviousData.feedback = "liked"
                let scorm: Utilities.ScormWrapper = Utilities.ScormWrapper.Instance,
                    scormData: string = JSON.stringify(audioPlayerModel.ScormPreviousData);
                Utilities.consoleTrace("Updating current video to scorm: ", scormData);
                if (scorm.setLessonLocation(scormData)) {
                    if (!scorm.commit()) {
                        Utilities.consoleWarn("Warning: Failed to COMMIT the set value to scorm. value: ", scormData);
                    }
                }
                else {
                    Utilities.consoleWarn("Failed to set value to scorm. Value: ", scormData);
                }
                audioPlayerView.trigger(Events.EVENT_SELECTION_CHANGE, item);
                //audioPlayerView.trigger(Events.EVENT_AUDIOPLAYER_CHANGE, item);

            }
        }

        @named
        private updateAudioDesc(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model;

            if (audioPlayerModel.Playlist.CurrentItem.Description) {
                audioPlayerView.$(".player-container").removeClass("no-description");
                audioPlayerView.$(".description .desc-title").html(audioPlayerModel.Playlist.CurrentItem.Title);

                let $descText: JQuery = audioPlayerView.$(".description .desc-text");
                try {
                    $descText.mCustomScrollbar("destroy");
                }
                catch (err) {
                    Utilities.consoleLog("Failed to destroy scrollbar for '.description .desc-text': ", err.message, err.stack);
                }

                $descText.html(audioPlayerModel.Playlist.CurrentItem.Description);
                try {

                    $descText.mCustomScrollbar({
                        theme: "kpmg-blue"
                    });
                }
                catch (err) {
                    Utilities.consoleLog("Failed to apply scrollbar to '.description .desc-text': ", err.message, err.stack);
                }
            }
            else {
                Utilities.consoleTrace("No description for audio: ", audioPlayerModel.Playlist.CurrentItem.Id);
                audioPlayerView.$(".player-container").addClass("no-description");
            }
        }

        @named
        private updateTexttrack(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                textTracks: TextTrackList = null;

            if (audioPlayerView._currentTextTrack) {
                audioPlayerView._currentTextTrack.off('cuechange');
                audioPlayerView._myPlayer.removeRemoteTextTrack(audioPlayerView._currentTextTrack);
            }

            if (audioPlayerModel.Playlist.CurrentItem.Subtitle) {
                audioPlayerModel.Subtitle = audioPlayerModel.Playlist.CurrentItem.Subtitle;
                Utilities.consoleTrace("Updating Subtitle to:", audioPlayerModel.Subtitle);
                audioPlayerView._myPlayer.addRemoteTextTrack({
                    kind: "captions",
                    mode: (audioPlayerModel.CaptionsEnabled ? "showing" : "hidden"),
                    srclang: "en",
                    label: "English",
                    src: audioPlayerModel.Subtitle,
                    default: audioPlayerModel.CaptionsEnabled
                }, true);
                textTracks = audioPlayerView._myPlayer.textTracks();
                if (textTracks && textTracks.length > 0) {
                    audioPlayerView._currentTextTrack = textTracks[0];
                    audioPlayerView._currentTextTrack.on('cuechange', audioPlayerView.onCueChange.bind(audioPlayerView));
                }
                audioPlayerView.$(".vjs-control-bar .vjs-icon-toggle-captions").removeClass("hide");
                audioPlayerView.$(".vjs-control-bar .vjs-icon-tumblr").addClass("hide");
            }
            else {
                Utilities.consoleTrace("Subtitle not required.");
                audioPlayerView.$(".vjs-control-bar .vjs-icon-toggle-captions").addClass("hide");
            }

            if (audioPlayerModel.Playlist.CurrentItem.Transcript) {
                Utilities.consoleTrace("Updating Transcript to:", audioPlayerModel.Playlist.CurrentItem.Transcript);
                audioPlayerView.$(".vjs-control-bar .vjs-icon-tumblr").removeClass("hide");
            }
            else {
                Utilities.consoleTrace("Transcript not required.");
                audioPlayerView.$(".vjs-control-bar .vjs-icon-tumblr").addClass("hide");
            }
        }

        @named
        private toggleCaptions(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                captionBtn: JQuery = audioPlayerView.$(".vjs-control-bar .vjs-icon-toggle-captions");


            audioPlayerModel.CaptionsEnabled = !audioPlayerModel.CaptionsEnabled;
            //alert(audioPlayerModel.CaptionsEnabled)
            Utilities.consoleTrace("Show Captions: ", audioPlayerModel.CaptionsEnabled);
            //alert(audioPlayerModel.CaptionsEnabled)
            if (audioPlayerModel.CaptionsEnabled) {
                if (audioPlayerView._currentTextTrack) {
                    $(".cc_text_main").show();
                    audioPlayerView._currentTextTrack.mode = "showing";
                }
                captionBtn.addClass("captions-enabled").removeClass("captions-disabled");
                $(".cc_text_btn").addClass("captions-enabled").removeClass("captions-disabled");

            }
            else {
                if (audioPlayerView._currentTextTrack) {
                    $(".cc_text_main").hide();
                    audioPlayerView._currentTextTrack.mode = "hidden";
                }

                captionBtn.removeClass("captions-enabled").addClass("captions-disabled");
                $(".cc_text_btn").removeClass("captions-enabled").addClass("captions-disabled");
            }
        }

        @named
        private onCueChange(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                //textTrackDisplay: JQuery = audioPlayerView.$(".cc_text_inner"),
                textTrackDisplay: JQuery = audioPlayerView.$(".vjs-text-track-display"),

                cueText: string = textTrackDisplay.text(),
                newMode: string = (audioPlayerModel.CaptionsEnabled ? "showing" : "hidden");

                //console
                //alert(newMode)
                $(".cc_text_main .cc_text_inner").html(textTrackDisplay.text())

            if (newMode !== audioPlayerView._currentTextTrack.mode) {
                audioPlayerView._currentTextTrack.mode = newMode;
            }

            // if(audioPlayerView._currentTextTrack.mode=="showing"){
            //     $(".cc_text_main").show();
            // }else{
            //     $(".cc_text_main").hide();
            // }

            if (cueText.trim()) {
                textTrackDisplay.removeClass("empty-captions");
            }
            else {
                textTrackDisplay.addClass("empty-captions");
            }
        }

        @named
        public onMetadataLoaded(e: Event): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                audioContainer: JQuery = audioPlayerView.$(".audio-container"),
                videoElement: JQuery = audioPlayerView.$(".video-js .vjs-tech"),
                width: number = audioContainer.width(),
                videoWidth: number = audioPlayerView._myPlayer.videoWidth(),
                height: number = audioContainer.height(),
                videoHeight: number = audioPlayerView._myPlayer.videoHeight();

            audioPlayerModel.duration = audioPlayerView._myPlayer.duration();
            audioPlayerModel.Playlist.CurrentItem.NumQuestions = audioPlayerModel.CuePoints.length;


            Utilities.consoleTrace(
                "Container Width: ", width,
                " Container Height: ", height,
                " Video Width: ", videoWidth,
                " Video Height: ", videoHeight
            );

            if (videoWidth < 1000) {
                videoElement.css({
                    "max-width": videoWidth,
                    "max-height": videoHeight
                }).addClass("center-align");
            }
            else {
                videoElement.css({
                    "max-width": '',
                    "max-height": ''
                }).addClass("center-align");
            }

            audioPlayerModel.maxVisitedTime = audioPlayerModel.Playlist.CurrentItem.CurrentTime;
            Utilities.consoleTrace("Metadata loaded. AudioID: ", audioPlayerModel.Playlist.CurrentItem.id,
                " Audio Duration: " + audioPlayerModel.duration,
                " CurrentTime: " + audioPlayerModel.Playlist.CurrentItem.CurrentTime,
                " maxVisitedTime: " + audioPlayerModel.maxVisitedTime
            );

            if (audioPlayerModel.maxVisitedTime > 0) {
                if (audioPlayerModel.maxVisitedTime > audioPlayerModel.duration) {
                    audioPlayerModel.maxVisitedTime = audioPlayerModel.duration;
                }
                if (parseFloat(audioPlayerModel.maxVisitedTime.toFixed(2)) === parseFloat(audioPlayerModel.duration.toFixed(2))) {
                    Utilities.consoleTrace("For audioId: " + audioPlayerModel.Playlist.CurrentItem.Id, ". Max watched time is same as duration. Setting current time as 0.");
                    audioPlayerView._myPlayer.currentTime(0);
                    audioPlayerView.enable();
                }
                else if (Utilities.isiOS()) {
                    // iPad detected, wait for user to start playing and then seek
                    Utilities.consoleTrace("iOs detected, waiting for user to start playing, and then seek to: " + audioPlayerModel.maxVisitedTime);

                    audioPlayerView._myPlayer.one('play', function (): void {
                        audioPlayerView._myPlayer.currentTime(audioPlayerModel.maxVisitedTime);
                    });

                    audioPlayerView.enable();
                }
                else {
                    Utilities.consoleTrace("Seeking to time: " + audioPlayerModel.maxVisitedTime);
                    audioPlayerModel.seekingFirstTime = true;
                    audioPlayerView.enable(false);
                    audioPlayerView._myPlayer.currentTime(audioPlayerModel.maxVisitedTime);
                }
            }
            else {
                Utilities.consoleTrace("Max watched time is 0. not starting video.");
                audioPlayerView.enable();
            }
        }

        @named
        private onSeeking(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            if (audioPlayerModel.seekingFirstTime) {
                Utilities.consoleTrace("Video seeking started for the first time, don't do anything.");
            }
            else {
                Utilities.consoleTrace("Video seeking started...");

                audioPlayerView.enable(false, "Please wait, video is seeking...");
            }
        }

        @named
        private onSeeked(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            if (audioPlayerModel.seekingFirstTime) {
                audioPlayerModel.seekingFirstTime = false;
                Utilities.consoleTrace("First Time Seeked to: " + audioPlayerView._myPlayer.currentTime());
                if (audioPlayerModel.CaptionsEnabled && audioPlayerView._currentTextTrack) {
                    audioPlayerView.onCueChange();
                }
                // not staritng the video automatically as per client request.
                //audioPlayerView._myPlayer.play();
                if (audioPlayerModel._startPlayingOnError) {
                    audioPlayerModel._startPlayingOnError = false;
                    Utilities.consoleTrace("Start playing as seeked after Error.");
                    // seeked after error, start playing
                    audioPlayerView._myPlayer.play();
                }
            }
            else {
                Utilities.consoleTrace("Video seeking done.");
            }
            audioPlayerView.resetCuePointStatus();
            audioPlayerView.resetMicroPollStatus();
            audioPlayerView.enable();
        }





        @named
        private restartVideo() {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView._myPlayer.currentTime(0);
            audioPlayerView.resetCuePointStatus();
            audioPlayerView.resetMicroPollStatus();
            audioPlayerView._myPlayer.play();
            $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
        }

        @named
        private showTranscript(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            if (audioPlayerModel.Playlist.CurrentItem.Transcript) {
                Utilities.openPdf(audioPlayerModel.Playlist.CurrentItem.Transcript);
            }
        }

        @named
        private togglePlaylist(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                playerContainer: JQuery = audioPlayerView.$(".player-container"),
                visible: boolean = audioPlayerModel.Playlist.Visible;

            if (Utilities.isiPad()) {
                if (Utilities.readDeviceOrientation() === "Portrait") {
                    audioPlayerView._playlist.once(Events.EVENT_PLAYLIST_ANIMATION_END, function () {
                        playerContainer.off(Events.CSS_ANIMATION_END);
                        if (playerContainer.hasClass("to-full-width")) {
                            playerContainer.removeClass("to-full-width").addClass("fullWidth");
                        }
                        if (playerContainer.hasClass("to-small-width")) {
                            playerContainer.removeClass("to-small-width fullWidth");
                        }
                    });
                }
            }
            if (visible) {
                if (Utilities.isiPhone()) {
                    audioPlayerView._playerPausedOnShowPlaylist = audioPlayerView._myPlayer.paused();
                    if (!audioPlayerView._playerPausedOnShowPlaylist) {
                        audioPlayerView.pause();
                    }
                }
                else {
                    playerContainer.one(Events.CSS_ANIMATION_END, function (evt) {
                        playerContainer.removeClass("to-full-width").addClass("fullWidth");
                    })
                        .removeClass("fullWidth")
                        .addClass("to-full-width");
                }
            }
            else {
                if (!Utilities.isiPhone()) {
                    playerContainer.one(Events.CSS_ANIMATION_END, function (evt) {
                        playerContainer.removeClass("to-small-width");
                    })
                        .removeClass("fullWidth")
                        .addClass("to-small-width");
                }
            }
            audioPlayerView._playlist.toggle();
        }

        @named
        private onPlaylistClosed(): void {
            let audioPlayerView: AudioPlayer = this,
                playerContainer: JQuery = audioPlayerView.$(".player-container");

            if (Utilities.isiPhone()) {
                Utilities.consoleTrace("This is iPhone... start playing...");
                if (!audioPlayerView._playerPausedOnShowPlaylist) {
                    audioPlayerView.play();
                }
            }
            audioPlayerView._playlist.toggle();
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
                    $("#uiBlocker .loading-text").html("Please wait video is loading...");
                }
                $("#uiBlocker").show();
            }
        }

        @named
        private onShowGlossary(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.pause();
            audioPlayerView.trigger(Events.EVENT_SHOW_GLOSSARY);
        }

        @named
        private onShowIndex(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.pause();
            audioPlayerView.trigger(Events.EVENT_SHOW_INDEX);
        }

        @named
        private onShowResource(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.pause();
            audioPlayerView.trigger(Events.EVENT_SHOW_RESOURCES);
        }

        @named
        public enableNext(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            audioPlayerView._playlist.enableNext(audioPlayerModel.Playlist.CurrentItem.Id);
        }

        @named
        public next(flag?: boolean): void {
            let audioPlayerView: AudioPlayer = this;

            audioPlayerView._playlist.next(flag);

        }


        @named
        public togglePlayPause(): void {
            let audioPlayerView: AudioPlayer = this;
            if (audioPlayerView._myPlayer.paused()) {
                audioPlayerView._myPlayer.play();
                $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");

            } else {
                audioPlayerView._myPlayer.pause();
                $('.audio-player-template .play-pause').text('Play').addClass("play").removeClass("pause");

            }
        }


        @named
        public updateProgress(player: any): void {
            // event.stopPropagation();
            let audioPlayerView: AudioPlayer = this;
            if (player && this.progressBar && this.currentTimeDisplay) {
                const currentTime = this.formatTime(player.currentTime());
                const totalTime = this.formatTime(player.duration());
                const progress = (player.currentTime() / player.duration()) * 100;
                $('.audio-player-template .progress-bar').val(progress.toString());
                $('.audio-player-template .current-time').text(currentTime);
                $('.audio-player-template .total-time').text(totalTime);
                // console.log(this.currentTimeDisplay)



            }
        }

        @named
        public formatTime(seconds: number): string {
            //console.log("************* formatTime ********************")
            const minutes = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return minutes + ':' + (sec < 10 ? '0' : '') + sec;
        }

        // @named
        // public onAudioEnd(event:Event): void {
        //     event.stopPropagation();
        //     if (this.playPauseBtn && this.progressBar && this.currentTimeDisplay) {
        //         this.playPauseBtn.text('Play');
        //         this.progressBar.val('0');
        //         this.currentTimeDisplay.text('00:00');
        //     }
        // }



        @named
        private onItemClickedToggle(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            //audioPlayerModel.Playlist.$el.hide();
            if (audioPlayerView._myPlayer.paused()) {
                audioPlayerView._myPlayer.play();
                $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
            } else {
                audioPlayerView._myPlayer.pause();
                $('.audio-player-template .play-pause').text('Play').addClass("play").removeClass("pause");
            }
        }

        @named
        private onItemClickedRefresh(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            audioPlayerView.restartVideo()
        }

        @named
        private onItemClickedCc(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            audioPlayerView.toggleCaptions();
        }

        @named
        private onItemClickedTranscript(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            audioPlayerView.showTranscript();
        }
        @named
        private onItemClickedBackaudio(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
           // audioPlayerView.showTranscript();
           alert("Back")
        }
        @named
        private onItemClickedNextaudio(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
           // audioPlayerView.showTranscript();
           alert("next")
        }

       // transcript_btn

        @named
        private onItemClickedSeek(event: MouseEvent): void {
            //alert("onItemClickedSeek")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
                isModeOpen: boolean = audioPlayerModel.CourseMode === DataStructures.CourseMode.OPEN,
                videoUnBlocked: boolean = false;

            const seekTo = audioPlayerView._myPlayer.duration() * (audioPlayerModel.Playlist.CurrentItem.CurrentTime / 100);


            videoUnBlocked = (HTML5AudioPlayer.UNLOCK_AUDIOS || isModeOpen);
            // Allow seeking based on max visited time.
            if (videoUnBlocked || (seekTo < audioPlayerModel.maxVisitedTime)) {
                Utilities.consoleTrace("Seeking video to new time: " + seekTo);
                audioPlayerView._myPlayer.currentTime(seekTo);
            }
            else if (videoUnBlocked || (seekTo > audioPlayerModel.maxVisitedTime)) {
                let currentTime = audioPlayerView._myPlayer.currentTime(),
                    delta = Math.abs(currentTime - audioPlayerModel.maxVisitedTime);

                if (delta > audioPlayerModel.UpdateInterval) {
                    Utilities.consoleTrace("Seeking video to max time: " + audioPlayerModel.maxVisitedTime);
                    audioPlayerView._myPlayer.currentTime(audioPlayerModel.maxVisitedTime);
                }
                else {
                    Utilities.consoleTrace("Not Seeking video to max time as (current time - max time) delta is small: " + delta);
                }
            }
            //const input = event.target as HTMLInputElement;
            // audioPlayerView._myPlayer.currentTime(seekTo);
            //alert(audioPlayerModel.Playlist.CurrentItem.CurrentTime)
        }
        @named
        private onItemInitPlayer(): void {
            //alert("onItemInitPlayer")
            let audioPlayerView: AudioPlayer = this;
            if (audioPlayerView._myPlayer.currentTime() <= 0) {
                const currentTime = this.formatTime(audioPlayerView._myPlayer.currentTime());
                const totalTime = this.formatTime(audioPlayerView._myPlayer.duration());
                //const progress = (audioPlayerView._myPlayer.currentTime() / audioPlayerView._myPlayer.duration()) * 100;
                $('.audio-player-template .progress-bar').val(0);
                $('.audio-player-template .current-time').text(currentTime);
                $('.audio-player-template .total-time').text(totalTime);

            }
            audioPlayerView._myPlayer.paused()

        }

        private onItemClickedSpeedList(): void {
            //alert("onItemClickedSpeedList")
        }

        private onItemClickedSpeed(): void {
            // alert("onItemClickedSpeed");
            // $('.audioSpeedContent').toggle();
            $('.audioSpeedContent').empty()
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            audioPlayerModel.optionsList.playbackRates.forEach(function (speed) {
                var speedOption = $('<a href="#" data-speed="' + speed + '">' + speed + 'x</a>');
                $('.audioSpeedContent').append(speedOption);
            });
            $('.audioSpeedContent a').click(function (event) {
                event.preventDefault();
                var speed = $(this).data('speed');
                // NavigatorController.saveSpeed = speed;
                //alert("speed "+speed)
                audioPlayerView._myPlayer.playbackRate(speed)
                $('.navigatorAudioSpeedBtn').text(speed + 'x');
                $('.audioSpeedContent').toggle();

            });
        }

    }
}
