/// <reference path="../../playlist/model/playlist.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class AudioPlayer extends Backbone.Model {

        get PlayerOptions(): VideoJSOptions { return this.get("options"); }
        set PlayerOptions(value: VideoJSOptions) { this.set("options", value); }

        get Playlist(): Playlist { return this.get("playlist"); }
        set Playlist(value: Playlist) { this.set("playlist", value); }

        get KnowledgeCheckItems(): KnowledgeCheckItem { return this.get("KnowledgeCheckItems"); }
        set KnowledgeCheckItems(value: KnowledgeCheckItem) { this.set("KnowledgeCheckItems", value); }


        get AudioId(): string { return this.get("audioid"); }
        set AudioId(value: string) { this.set("audioid", value); }

        get Messages(): DataStructures.VideoMessages { return this.get("messages"); }
        set Messages(value: DataStructures.VideoMessages) { this.set("messages", value); }


        get optionsList(): DataStructures.options { return this.get("options"); }
        // get Poster(): string { return this.get("poster"); }
        // set Poster(value: string) { this.set("poster", value); }

        get Subtitle(): string { return this.get("Subtitle"); }
        set Subtitle(value: string) { this.set("Subtitle", value); }

        get UpdateInterval(): number { return this.get("progressinterval"); }
        set UpdateInterval(value: number) { this.set("progressinterval", value); }

        get CompletionDelta(): number { return this.get("completiondelta"); }
        set CompletionDelta(value: number) { this.set("completiondelta", value); }

        get CourseMode(): DataStructures.CourseMode { return this.get("coursemode"); }
        set CourseMode(value: DataStructures.CourseMode) { this.set("coursemode", value); }

        get ScormPreviousData(): any { return this.get("ScormPreviousData"); }
        set ScormPreviousData(value: any) { this.set("ScormPreviousData", value); }

        get CuePoints(): DataStructures.CuePoint[] { return this.get("CuePoints"); }
        set CuePoints(value: DataStructures.CuePoint[]) { this.set("CuePoints", value); }

        get CuePointDelta(): number { return this.get("cuepointdelta"); }
        set CuePointDelta(value: number) { this.set("cuepointdelta", value); }

        get AutoAdvanceToNext(): boolean { return this.get("AutoAdvanceToNext"); }
        set AutoAdvanceToNext(value: boolean) { this.set("AutoAdvanceToNext", value); }

        get RePollOnSeek(): boolean { return this.get("rePollOnSeek"); }
        set RePollOnSeek(value: boolean) { this.set("rePollOnSeek", value); }

        get CaptionsEnabled(): boolean { return this.get("captionsEnabled"); }
        set CaptionsEnabled(value: boolean) { this.set("captionsEnabled", value); }

        get ContinueOnFocusout(): boolean { return this.get("continueOnFocusout"); }
        get PassingPercent(): number { return this.get("passingPercent"); }




        public supposedCurrentTime: number;
        public maxVisitedTime: number;
        public lastUpdateTime: number;
        public bufferedPercent: number;
        public duration: number;
        public seekingFirstTime: boolean;
        public _startPlayingOnError: boolean;
        public _prevItemId: string;
        public _retries: number;
        public numQuestions: number;



        constructor(options: any, kcdata?: any) {
            super(options);

            let model: AudioPlayer = this;

            model.supposedCurrentTime = 0;
            model.maxVisitedTime = 0;
            model.lastUpdateTime = 0;
            model.bufferedPercent = 0;
            model.seekingFirstTime = false;
            model.CuePoints = null;
            model.AudioId = "video-instance";

            model.CaptionsEnabled = model.CaptionsEnabled ?? !options.HideCaptionsOnLaunch;
            model.CaptionsEnabled = model.CaptionsEnabled ?? true;

            model.CompletionDelta = model.CompletionDelta ?? 0;

            // use the default value for update interval if not provided.
            model.UpdateInterval = model.UpdateInterval ?? DataStructures.Defaults.UpdateInterval;

            model.PlayerOptions = model.PlayerOptions ?? {};
            model.parseScormData(options, kcdata);

            model.Playlist = new Playlist({
                audioData: options.playlist,
                playlistStartIndex: options.playlistStartIndex,
                visible: (Utilities.isiPhone() ? true : !options.HidePlaylist),
                HideGlossaryBtn: options.HideGlossaryBtn,
                HideIndexBtn: options.HideIndexBtn,
                IndexBtnText: options.IndexBtnText,
                ShowResourceBtn: options.ShowResourceBtn,
                GlossaryBtnText: options.GlossaryBtnText,
                ResourceBtnText: options.ResourceBtnText,
                ScormPreviousData: model.ScormPreviousData,
                kcdata: kcdata,
                Titles:options.titles
            });


            model.Playlist.CourseMode = model.CourseMode;
            model.PlayerOptions.src = model.Playlist.CurrentItem.Url;
            //model.Playlist.CuePoints = model.CuePoints;

            // TEMP Change for Video Autoplay
            model.PlayerOptions.muted = false;
            model.PlayerOptions.autoplay = false;

            //model.Poster = model.Playlist.CurrentItem.PreviewImage;
            model.Subtitle = model.Playlist.CurrentItem.Subtitle;


            // set prev same as current.
            model._prevItemId = model.Playlist.CurrentItem.Id;


            //model.Carousel
            //alert(options)

            // model.Carousel = new Carousel({
            //     slideData: options.carouselData
            // });
        }

        @named
        public hasEndKC(): boolean {
            let model: AudioPlayer = this,
                result: boolean = false;
            if (model.CuePoints) {
                let cp: DataStructures.CuePoint = model.CuePoints.filter((curCP) => {
                    return curCP.time === DataStructures.KCWhen.End;
                })[0];

                result = !!cp;
            }
            return result;
        }

        @named
        private parseScormData(options: any, kcdata?: any): void {
            let model: AudioPlayer = this,
                playlistItems: DataStructures.AudioData[] = options.playlist,
                KnowledgeCheckItem: DataStructures.KCData[] = kcdata,
                //cuePoint : DataStructures.KCData[]=kcdata,
                prevVidComplete: boolean = true;

            if (model.ScormPreviousData) {
                Utilities.consoleTrace("Applying SCORM Data: ", model.ScormPreviousData);
                model.ScormPreviousData.cv = model.ScormPreviousData.cv || playlistItems[0].id;
                //model.ScormPreviousData.feedback = "liked"
                if(model.ScormPreviousData.feedback){
                    model.ScormPreviousData.feedback=model.ScormPreviousData.feedback;
                }
                for (let i: number = 0; i < KnowledgeCheckItem.length; i++) {
                    let curKcItemData = KnowledgeCheckItem[i],
                        curKcItemScormData: DataStructures.KcScormData = model.ScormPreviousData[curKcItemData.id];
                    if (curKcItemScormData) {
                        curKcItemData.complete = curKcItemScormData.c ? true : false;
                        curKcItemData.disabled = curKcItemScormData.e ? true : false;
                    }
                    else {
                        curKcItemData.complete = false;
                        curKcItemData.disabled = false;
                    }
                    //KnowledgeCheckItem[i].complete=true
                }
                //KnowledgeCheckItem[0].complete=true
                for (let i: number = 0; i < playlistItems.length; i++) {
                    let curVidData: DataStructures.AudioData = playlistItems[i],
                        curVidScormData: DataStructures.AudioScormData = model.ScormPreviousData[curVidData.id];

                    if (curVidData.isAssessment) {
                        let asd: DataStructures.AssessmentScormData = model.ScormPreviousData.assessment;
                        curVidData.complete = false;

                        if (asd) {
                            if (asd.score >= model.PassingPercent) {
                                curVidData.complete = true;
                            }
                        }
                    }
                    else if (curVidData.isSurvey) {
                        curVidData.complete = model.ScormPreviousData.survey ? model.ScormPreviousData.survey.completed : false;
                    }
                    else {

                        if (curVidScormData) {
                            curVidData.currenttime = +curVidScormData.t || 0;
                            curVidData.complete = curVidScormData.c ? true : false;
                            curVidData.kccomplete = curVidScormData.k ? true : false;
                        }
                        else {
                            curVidData.currenttime = 0;
                            curVidData.complete = false;
                            curVidData.kccomplete = false;
                        }
                        //curVidData.currenttime =
                        // model.ScormPreviousData.cv is "Current Video"

                        if (curVidData.id === model.ScormPreviousData.cv) {
                            curVidData.current = true;
                            model.maxVisitedTime = curVidData.currenttime;
                            model.supposedCurrentTime = curVidData.currenttime;
                            //alert(model.supposedCurrentTime) //check bookmark
                            //alert(model.Playlist.CurrentItem)

                        }
                    }
                    // if course mode is CPE, then enable the item only if previous Audio is complete.
                    curVidData.disabled = (model.CourseMode === DataStructures.CourseMode.CPE) ? !prevVidComplete : false;
                    // then set the prevVidComplete to current video's complete status
                    // to use for next item.
                    prevVidComplete = curVidData.complete;
                }
            }
            else {

                for (let i: number = 0; i < playlistItems.length; i++) {
                    let curVidData: DataStructures.AudioData = playlistItems[i];
                    curVidData.currenttime = 0;
                    curVidData.complete = false;
                    // if course mode is CPE, then disable all videos and enable only first.
                    curVidData.disabled = (model.CourseMode === DataStructures.CourseMode.CPE);
                }
                model.ScormPreviousData = {};
                model.ScormPreviousData.cv = model.ScormPreviousData.cv || playlistItems[0].id;
                //model.ScormPreviousData.feedback = ""


                playlistItems[0].currenttime = 0;
                playlistItems[0].current = true;
                playlistItems[0].disabled = false;

                model.maxVisitedTime = 0;
                model.supposedCurrentTime = 0;
                Utilities.consoleTrace("Data not recieved from SCORM for audioId: " + playlistItems[0].id, " Setting default Max watched time as: " + model.maxVisitedTime, " and current time: ", playlistItems[0].currenttime);
            }
        }

        @named
        public sendDataToScorm(): void {
            let model: Models.AudioPlayer = this;

            Utilities.consoleTrace("Saving progress to SCORM. ", JSON.stringify(model.ScormPreviousData));
            model.trigger(Events.EVENT_SAVE_COURSE_DATA, model.ScormPreviousData);
            model.markCourseComplete();
        }

        @named
        public markCourseComplete(): void {
            let model: AudioPlayer = this;

            if (model.isComplete()) {
                Utilities.consoleLog("Course completed!!");
                model.trigger(Events.EVENT_MARK_COURSE_COMPLETE);
            }
        }

        @named
        public isComplete(): boolean {
            let model: Models.AudioPlayer = this;
            return (model.Playlist.getCompletedCount() === model.Playlist.PlaylistItems.length);
        }
    }
}
