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
        private captions = []; // Define captions array globally




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
            'muted': () => void;
            'ratechange': () => void;
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
                'playing': audioPlayerView.onPlaying.bind(audioPlayerView),
                'muted': audioPlayerView.onMuted.bind(audioPlayerView),
                'ratechange': audioPlayerView.onRateChange.bind(audioPlayerView)
            };

            audioPlayerView._playlist = new Playlist({
                id: _.uniqueId("playlist"),
                className: "playlist",
                model: audioPlayerModel.Playlist
            });

            audioPlayerView._playlist.on(Events.EVENT_SELECTION_CHANGE, audioPlayerView.onAudioChanged, audioPlayerView);
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
            audioPlayerView._playlist.on(Events.EVENT_ITEM_ONOFFAUDIO, audioPlayerView.onItemClickedOnoffaudio, audioPlayerView);
            audioPlayerView._playlist.on(Events.EVENT_CREATEWAVEFORM, audioPlayerView.onCreatewaveform, audioPlayerView);

            audioPlayerView._playlist.on(Events.EVENT_NextBack_CHANGE, audioPlayerView.onNextBackChanged, audioPlayerView);
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
            return audioPlayerView;
        }

        @named
        public afterRender(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.initPlayer();
            audioPlayerView._playlist.afterRender();
            audioPlayerView.updateAudioDesc();

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
            audioPlayerView._myPlayer.on('ratechange', audioPlayerView._videoEventListners.ratechange);

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

            //audioPlayerView.updateTexttrack()
        }

        @named
        private onRateChange(): void {
            let videoPlayerView: AudioPlayer = this;

            let val = videoPlayerView._myPlayer.playbackRate();
            sessionStorage.setItem('playbackRate', val.toString());
            $('.navigatorAudioSpeedBtn').text(val.toString() + 'x');
            Utilities.consoleLog("RateChange!", val);
        }

        @named
        private onMuted(state: Boolean): void {
            let audioPlayerView: AudioPlayer = this;
            //audioPlayerView._myPlayer.muted()
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
                            audioPlayerView.changeAudio(audioPlayerView.model.Playlist.CurrentItem);
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
                    audioPlayerView.changeAudio(audioPlayerView.model.Playlist.CurrentItem);
                }, 500);
            }
        }

        @named
        private onReady(e: Event): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            Utilities.consoleLog("Player Ready...");

            audioPlayerView.addScrubRestricter(audioPlayerView._myPlayer);

            audioPlayerView.addButtonsToPlayer();
            console.log("updateTexttrack 1");
            audioPlayerView.updateTexttrack();
            audioPlayerView.loadCaptions(audioPlayerModel.Subtitle); // Replace 'captions.vtt' with your VTT file path

        }


        // Function to load and parse the .vtt file
        @named
        private async loadCaptions(url): Promise<void> {
            try {
                const response = await fetch(url);
                const vttText = await response.text();
                //console.log("vttText")
                //console.log(vttText)
                this.parseVTT(vttText);
            } catch (error) {
                console.error('Error loading captions:', error);
            }
        };

        // Parse VTT file and store cues
        @named
        private parseVTT(vttText: string): void {
            const lines = vttText.split('\n');
            this.captions = [];
            let cue: { start: number; end: number; text: string } | null = null;

            lines.forEach((line) => {
                // Check if the line contains the cue timing information
                if (line.includes('-->')) {
                    const [start, end] = line.split(' --> ');
                    cue = { start: this.timeToSeconds(start), end: this.timeToSeconds(end), text: '' };
                } else if (line.trim() === '') {
                    // If cue is not null, push it to captions
                    if (cue) {
                        this.captions.push(cue);
                        cue = null; // Reset cue after adding
                    }
                } else {
                    // Ensure cue is defined before trying to access cue.text

                    if (cue) {
                        cue.text += line.trim() + ' ';
                        //console.log("cue.text")
                        //console.log(cue.text)
                    }
                }
            });

            // Check if there's a cue that hasn't been pushed after the last line
            if (cue) {
                this.captions.push(cue);
            }
        }


        // Convert time format to seconds
        @named
        private timeToSeconds(time) {
            const [hours, minutes, seconds] = time.split(':');
            return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
        };

        // Update captions based on current video time
        @named
        private updateCaptions(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            //console.log("**************************************************************")
            //console.log(audioPlayerView._myPlayer.currentTime())
            let customCCDiv = document.getElementById('cc_text_inner');
            let _currentTime = audioPlayerView._myPlayer.currentTime()

            let currentCaption = this.captions.find(
                (cue) => _currentTime >= cue.start && _currentTime <= cue.end
            );
            //console.log("currentCaption :")
            // console.log(currentCaption)
            if (currentCaption && audioPlayerModel.CaptionsEnabled) {
                // console.log()
                customCCDiv.textContent = currentCaption.text;
                $(".cc_text_main .cc_text_inner").html(currentCaption.text)
                //console.log("customCCDiv.textContent "+audioPlayerModel.CaptionsEnabled)
                //console.log(customCCDiv.textContent)
                customCCDiv.style.display = 'block';
                $(".cc_text_main").show()
                $(".cc_text_inner").show()
            } else {
                //$(".cc_text_main").hide()
                customCCDiv.style.display = 'none';
            }
        };

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
                    audioPlayerView.restartAudio();
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
                    if (audioPlayerModel.CaptionsEnabled) {
                        $(".cc_text_btn").addClass("captions-enabled").removeClass("captions-disabled");
                    } else {
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

            //console.log(audioPlayerView._myPlayer.textTracks())
            let textTrackDisplay: JQuery = audioPlayerView.$(".vjs-text-track-display");
            $(".cc_text_main .cc_text_inner").html(textTrackDisplay.text())

            //if (Utilities.isiOS() || Utilities.isiPad()) {

            //}
            let textTracks = audioPlayerView._myPlayer.textTracks();
            // console.log("Text Tracks:", textTracks[0].id);
            if (textTracks && textTracks[0] && textTracks[0].id == "") {
                audioPlayerView.updateCaptions();
            }
            audioPlayerView.updateProgress(audioPlayerView._myPlayer)
            if (videoChanged) {
                Utilities.consoleTrace("Got time update after video changed, don't do anything.");
                return;
            }

            if (audioPlayerView._myPlayer.seeking()) {
                Utilities.consoleTrace("Audio is seeking, not updating max time. Current Value: " + audioPlayerModel.maxVisitedTime);
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

                }
                curObj.t = parseFloat(audioPlayerModel.maxVisitedTime.toFixed(2));

                curObj.n = audioPlayerModel.CuePoints.length;

                audioPlayerModel.ScormPreviousData[audioPlayerModel.Playlist.CurrentItem.Id] = curObj;

                if (curObj.c
                    || ((audioPlayerModel.maxVisitedTime - audioPlayerModel.lastUpdateTime) >= audioPlayerModel.UpdateInterval)) {
                    audioPlayerModel.lastUpdateTime = audioPlayerModel.maxVisitedTime;
                    audioPlayerModel.sendDataToScorm();
                }
            }

            audioPlayerView.showWaveform();
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

            let CurrentItem = audioPlayerModel.Playlist.KnowledgeCheckItems.filter((val) => {
                return val.attributes.id === vidId;
            })[0];

            let CurrentCueItem = audioPlayerModel.CuePoints.filter((val) => {
                return val.id === vidId;
            })[0];


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
            // console.log(vidId)
            //console.log("CurrentItem")
            // console.log(CurrentItem)
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
            audioPlayerModel.Playlist.enableAssessment();
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
            audioPlayerView.trigger(Events.EVENT_CURRENT_QUESTION, item);

        };
        private triggerKcItem(item: Models.PlaylistItem) {
            let audioPlayerView: AudioPlayer = this;
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
                            //alert(cp.id)
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

        private triggerAllCuepoint(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                cp: DataStructures.CuePoint = null,
                delta: number = 0;

            if (audioPlayerModel.CuePoints) {
                for (let i: number = 0; i < audioPlayerModel.CuePoints.length; i++) {
                    cp = audioPlayerModel.CuePoints[i];
                    //delta = Math.abs(currentTime - cp.time);
                    //if ((cp.time === currentTime) || (delta <= audioPlayerModel.CuePointDelta)) {
                        if (!cp.triggered) {
                            cp.triggered = true;
                            cp.visited = true;
                            //alert(cp.id)
                            Utilities.consoleTrace("Already Triggered cue point event for: ", cp.id);
                            //Utilities.consoleTrace("Trigger cue point event for: ", cp.id, audioPlayerView.cid, currentTime);
                            audioPlayerView.trigger(Events.EVENT_CUEPOINT_HIT, cp);
                            //alert("CP")
                        }
                        else {
                            Utilities.consoleTrace("Already Triggered cue point event for: ", cp.id);
                        }
                       // break;
                    //}
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
                audioPlayerModel: Models.AudioPlayer = this.model,
                playList = audioPlayerModel.Playlist.PlaylistItems,
                sormPreviousData = audioPlayerModel.ScormPreviousData,
                lastPlayListItem = playList[playList.length - 1],
                curIndex: number = parseInt(audioPlayerModel.Playlist.CurrentItem.Index),
                nextItem = audioPlayerView._playlist.getNextItem(curIndex);

            audioPlayerView._myPlayer.off('ratechange', audioPlayerView._videoEventListners.ratechange);


            audioPlayerView.enable(false);
            audioPlayerModel.supposedCurrentTime = 0;

            audioPlayerView.openMicroPoll();
            if (audioPlayerModel.hasEndKC()) {
                //audioPlayerView.enable();
                audioPlayerView.triggerCuepoint(DataStructures.KCWhen.End);
                //audioPlayerView.resetCuePointStatus();
            }
            audioPlayerView.triggerAllCuepoint();

            audioPlayerModel.Playlist.CurrentItem.CurrentClicked = true;
            audioPlayerModel.Playlist.CurrentItem.Complete = true;
            audioPlayerView.enableNext();
            if (audioPlayerModel.AutoAdvanceToNext) {
                if (nextItem.Id != "assessment" && nextItem.Id != "survey") {
                    audioPlayerView.next();
                    audioPlayerView.createWaveform();
                    setTimeout(function () {
                        audioPlayerView.play();
                        $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).parent().addClass("current");
                        $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).addClass("showPlayer");
                        $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
                        //$(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index)-1).find('.play-pause').trigger("click")
                    }, 500)
                }

            }
            audioPlayerView.enable();
            audioPlayerModel.Playlist.enableAssessment();
            $('.audio-player-template .play-pause').text('Play').addClass("play").removeClass("pause");
            //audioPlayerView.endWaveform();
            audioPlayerView.showWaveform()
        }

        private onLaunchAssessment(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.trigger(Events.EVENT_LAUNCH_ASSESSMNET);
        }

        private onLaunchSurvey(): void {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView.trigger(Events.EVENT_LAUNCH_SURVEY);
        }

        private onLaunchFeedback(): void {
            let audioPlayerView: AudioPlayer = this;
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
        private onAudioChanged(item: Models.PlaylistItem): void {
            let audioPlayerView: AudioPlayer = this,
            audioPlayerModel: Models.AudioPlayer = this.model;
            Utilities.consoleLog("Audio Changed to: " + item.Id);

            audioPlayerView.enable(false);

            // if Audio is playing, pause the Audio and make any changes only after Audio is paused
            audioPlayerView._myPlayer.off('ratechange', audioPlayerView._videoEventListners.ratechange);
            if (audioPlayerView._myPlayer.paused()) {
                Utilities.consoleTrace("Player paused, safe to change the Audio.");
                audioPlayerView.changeAudio(item);
            }
            else {
                Utilities.consoleTrace("Player not paused, first pause the Audio and then change the Audio.");
                audioPlayerView._myPlayer.one('pause', function (): void {
                    audioPlayerView.changeAudio(item);
                });
            }
            audioPlayerView.pause();
            let storedRate = sessionStorage.getItem('playbackRate');
            if (storedRate) {
                audioPlayerView._myPlayer.playbackRate(Number(storedRate));
            }

            if (audioPlayerView._myPlayer.muted()) {
                audioPlayerView._myPlayer.muted(true);
                $(".audio_on_off").removeClass('audio_on').addClass('audio_off');
            } else {
                audioPlayerView._myPlayer.muted(false);
                $(".audio_on_off").removeClass('audio_off').addClass('audio_on');

            }

            // setTimeout(function () {

            //     audioPlayerView.play();
            //     $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).parent().addClass("current");
            //     $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).addClass("showPlayer");
            //     $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
            //     //$(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index)-1).find('.play-pause').trigger("click")
            // }, 500)
            Utilities.consoleLog("VideoChanged!", storedRate);
        }

        @named
        private onNextBackChanged(){
            let audioPlayerView: AudioPlayer = this,
            audioPlayerModel: Models.AudioPlayer = this.model;
            setTimeout(function () {

                audioPlayerView.play();
                $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).parent().addClass("current");
                $(".audio-player-container").eq(parseInt(audioPlayerModel.Playlist.CurrentItem.Index) - 1).addClass("showPlayer");
                $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");

            }, 500)
        }

        @named
        private changeAudio(item: Models.PlaylistItem): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = this.model,
                updatingSameAudio: boolean = (audioPlayerModel._prevItemId === audioPlayerModel.Playlist.CurrentItem.Id);

            audioPlayerView._myPlayer.src(item.Url);
            item.NumQuestions = audioPlayerModel.CuePoints.length;
            //audioPlayerView._audioPlayer  = audioPlayerView._myPlayer;
            Utilities.consoleTrace("Prev Item: ", audioPlayerModel._prevItemId,
                ", Current Item: ", item.Id);

            // only if not updating to current Audio.

            if (!updatingSameAudio) {
                Utilities.consoleTrace("Changed to: ", item);
                audioPlayerModel._prevItemId = item.Id;
                //audioPlayerModel.Poster = item.PreviewImage;
                //audioPlayerView._myPlayer.poster(audioPlayerModel.Poster);
                audioPlayerView.updateAudioDesc();



                audioPlayerModel.maxVisitedTime = item.CurrentTime;
                audioPlayerModel.lastUpdateTime = audioPlayerModel.maxVisitedTime;
                // save to scorm.
                audioPlayerModel.ScormPreviousData.cv = item.Id;
                //audioPlayerModel.ScormPreviousData.feedback = "liked"
                let scorm: Utilities.ScormWrapper = Utilities.ScormWrapper.Instance,
                    scormData: string = JSON.stringify(audioPlayerModel.ScormPreviousData);
                Utilities.consoleTrace("Updating current Audio to scorm: ", scormData);
                if (scorm.setLessonLocation(scormData)) {
                    if (!scorm.commit()) {
                        Utilities.consoleWarn("Warning: Failed to COMMIT the set value to scorm. value: ", scormData);
                    }
                }
                else {
                    Utilities.consoleWarn("Failed to set value to scorm. Value: ", scormData);
                }
                audioPlayerView.trigger(Events.EVENT_SELECTION_CHANGE, item);
                console.log("updateTexttrack 2");
                //alert(item.Subtitle)

                // audioPlayerView.updateTexttrack();
                // Replace 'captions.vtt' with your VTT file path
                //audioPlayerView.updateTexttrack();
                if (Utilities.isiOS() || Utilities.isiPad()) {
                    audioPlayerView.loadCaptions(item.Subtitle);
                    $(".cc_text_main").hide();
                    audioPlayerModel.CaptionsEnabled = false;
                    audioPlayerView.$(".vjs-control-bar .vjs-icon-toggle-captions").removeClass("hide");
                    audioPlayerView.$(".vjs-control-bar .vjs-icon-tumblr").addClass("hide");
                }else{
                    audioPlayerView.updateTexttrack();
                }
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
                if (audioPlayerView._currentTextTrack) {
                    //audioPlayerView._currentTextTrack.removeEventListener('cuechange', audioPlayerView.onCueChange);
                    audioPlayerView._currentTextTrack.off('cuechange', audioPlayerView.onCueChange);
                } else {
                    console.error('Text track is not available.');
                }
                audioPlayerView._myPlayer.removeRemoteTextTrack(audioPlayerView._currentTextTrack);
            }

            if (audioPlayerModel.Playlist.CurrentItem.Subtitle) {
                audioPlayerModel.Subtitle = audioPlayerModel.Playlist.CurrentItem.Subtitle;
                Utilities.consoleTrace("Updating Subtitle to:", audioPlayerModel.Subtitle);
                const textTrack = audioPlayerView._myPlayer.addRemoteTextTrack({
                    kind: "captions",
                    mode: (audioPlayerModel.CaptionsEnabled ? "showing" : "hidden"),
                    srclang: "en",
                    label: "English",
                    src: audioPlayerModel.Subtitle,
                    default: audioPlayerModel.CaptionsEnabled
                }, true);
                textTracks = audioPlayerView._myPlayer.textTracks();
                if (textTrack) {
                    textTracks = audioPlayerView._myPlayer.textTracks();
                    if (textTracks && textTracks.length > 0) {
                        audioPlayerView._currentTextTrack = textTracks[0];
                        if (audioPlayerView._currentTextTrack) {
                            audioPlayerView._currentTextTrack.on('cuechange', audioPlayerView.onCueChange.bind(audioPlayerView));
                            //audioPlayerView._currentTextTrack.addEventListener('cuechange', audioPlayerView.onCueChange.bind(audioPlayerView));
                        } else {
                            console.error('Text track is not available.');
                        }
                    } else {
                        console.error('No text tracks found.');
                    }
                } else {
                    console.error('Failed to add remote text track.');
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
            Utilities.consoleTrace("Show Captions: ", audioPlayerModel.CaptionsEnabled);
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
                textTrackDisplay: JQuery = audioPlayerView.$(".vjs-text-track-display"),

                cueText: string = textTrackDisplay.text(),
                newMode: string = (audioPlayerModel.CaptionsEnabled ? "showing" : "hidden");
            $(".cc_text_main .cc_text_inner").html(textTrackDisplay.text())

            if (newMode !== audioPlayerView._currentTextTrack.mode) {
                audioPlayerView._currentTextTrack.mode = newMode;
            }

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
                audioElement: JQuery = audioPlayerView.$(".video-js .vjs-tech"),
                width: number = audioContainer.width(),
                videoWidth: number = audioPlayerView._myPlayer.videoWidth(),
                height: number = audioContainer.height(),
                videoHeight: number = audioPlayerView._myPlayer.videoHeight();

            audioPlayerModel.duration = audioPlayerView._myPlayer.duration();
            audioPlayerModel.Playlist.CurrentItem.NumQuestions = audioPlayerModel.CuePoints.length;
            audioPlayerView._myPlayer.on('ratechange', audioPlayerView._videoEventListners.ratechange);
            let storedRate = sessionStorage.getItem('playbackRate');
            if (storedRate) {
                audioPlayerView._myPlayer.playbackRate(Number(storedRate));
            }
            Utilities.consoleLog("MetaDataLoaded!", storedRate);
            //audioPlayerView._myPlayer.textTracks()

            console.log('Loaded metadata');
            var tracks = audioPlayerView._myPlayer.textTracks();
            console.log('Text tracks after metadata loaded:', tracks);

            Utilities.consoleTrace(
                "Container Width: ", width,
                " Container Height: ", height,
                " Video Width: ", videoWidth,
                " Video Height: ", videoHeight
            );

            if (videoWidth < 1000) {
                audioElement.css({
                    "max-width": videoWidth,
                    "max-height": videoHeight
                }).addClass("center-align");
            }
            else {
                audioElement.css({
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
                Utilities.consoleTrace("Audio seeking started for the first time, don't do anything.");
            }
            else {
                Utilities.consoleTrace("Audio seeking started...");

                audioPlayerView.enable(false, "Please wait, Audio is seeking...");
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
        private restartAudio() {
            let audioPlayerView: AudioPlayer = this;
            audioPlayerView._myPlayer.currentTime(0);
            audioPlayerView.resetCuePointStatus();
            audioPlayerView.resetMicroPollStatus();
            audioPlayerView._myPlayer.play();

            $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
            audioPlayerView._myPlayer.off('ratechange', audioPlayerView._videoEventListners.ratechange);
            audioPlayerView._myPlayer.on('ratechange', audioPlayerView._videoEventListners.ratechange);
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
                    $("#uiBlocker .loading-text").html("Please wait Audio is loading...");
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
            //alert()
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





        @named
        private onItemClickedToggle(): void {
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            //audioPlayerModel.Playlist.$el.hide();

            if (audioPlayerView._myPlayer.paused()) {
                audioPlayerView._myPlayer.play();
                $('.audio-player-template .play-pause').text('Pause').addClass("pause").removeClass("play");
                console.log("show waveform");
                audioPlayerView.createWaveform();
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
            audioPlayerView.restartAudio()
        }

        @named
        private onItemClickedCc(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            //audioPlayerView.updateTexttrack();
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
            //alert("Back")
        }
        @named
        private onItemClickedNextaudio(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            // audioPlayerView.showTranscript();
            //alert("next")
        }

        @named
        private onItemClickedOnoffaudio(): void {
            //alert("onItemClickedRefresh")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            if (audioPlayerView._myPlayer.muted()) {
                audioPlayerView._myPlayer.muted(false);
                $(".audio_on_off").removeClass('audio_off').addClass('audio_on');
            } else {
                audioPlayerView._myPlayer.muted(true);
                $(".audio_on_off").removeClass('audio_on').addClass('audio_off');

            }
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
            //$(".audio_on_off").removeClass('audio_off').addClass('audio_on');


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
            //audioPlayerView._myPlayer.muted(false);
            // if (audioPlayerView._myPlayer.muted()) {
            //     audioPlayerView._myPlayer.muted(true);
            //     $(".audio_on_off").removeClass('audio_on').addClass('audio_off');
            // } else {
            //     audioPlayerView._myPlayer.muted(false);
            //     $(".audio_on_off").removeClass('audio_off').addClass('audio_on');

            // }
            audioPlayerView.createWaveform();
        }

        private onItemClickedSpeedList(): void {
            //alert("onItemClickedSpeedList")
        }

        private onItemClickedSpeed(): void {

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

        private onCreatewaveform(): void {
            //alert("onCreatewaveform");
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;

            setTimeout(function () {
                $('.audio-player-template .progress-bar').val(0);
                audioPlayerView.onItemInitPlayer();
                audioPlayerView.updateProgress(audioPlayerView._myPlayer)
            }, 200)
        }

        private createWaveform(): void {
            //alert("createWaveform")
            let audioPlayerView: AudioPlayer = this,
                audioPlayerModel: Models.AudioPlayer = audioPlayerView.model;
            const waveform = $(".playlist-item.current .waveform");
            const numberOfBars = 20; // Number of bars you want
            //console.log("***************createWaveform****************************")
            // Generate bars dynamically
            waveform.html("");
            for (let i = 0; i < numberOfBars; i++) {
                waveform.append('<div class="bar"></div>');
            }

        }

        private showWaveform(): void {
            const bars = $(".playlist-item.current .bar");
            bars.each(function () {
                const randomHeight = Math.random() * 60 + 5; // Between 10px and 100px
                $(this).css("height", randomHeight + "px");
            });
        }

        private endWaveform(): void {
            const bars = $(".playlist-item.current .bar");
            bars.css("height", "5px");
        }

    }
}
