/// <reference path="playlist-item.ts" />
/// <reference path="queslist-item.ts" />
/// <reference path="knowledge-check-item.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class Playlist extends Backbone.Model {

        get PlaylistItems(): PlaylistItem[] { return this.get("playlistItems"); }
        set PlaylistItems(value: PlaylistItem[]) { this.set("playlistItems", value); }

        get QuestionlistItems(): QuestionlistItem[] { return this.get("questionlistItems"); }
        set QuestionlistItems(value: QuestionlistItem[]) { this.set("questionlistItems", value); }

        get KnowledgeCheckItems(): KnowledgeCheckItem[] { return this.get("KnowledgeCheckItems"); }
        set KnowledgeCheckItems(value: KnowledgeCheckItem[]) { this.set("KnowledgeCheckItems", value); }

        get CurrentItem(): PlaylistItem { return this.get("currentitem"); }
        set CurrentItem(value: PlaylistItem) { this.set("currentitem", value); }

        get CurrentQuesItem(): QuestionlistItem { return this.get("currentQuesItem"); }
        set CurrentQuesItem(value: QuestionlistItem) { this.set("currentQuesItem", value); }

        get CurrentListItem(): string { return this.get("currentListItem"); }
        set CurrentListItem(value: string) { this.set("currentListItem", value); }

        get Visible(): boolean { return this.get("visible"); }
        set Visible(value: boolean) { this.set("visible", value); }

        get PlaylistStartIndex(): number { return this.get("playlistStartIndex"); }
        set PlaylistStartIndex(value: number) { this.set("playlistStartIndex", value); }

        get CourseMode(): DataStructures.CourseMode { return this.get("coursemode"); }
        set CourseMode(value: DataStructures.CourseMode) { this.set("coursemode", value); }

        get ScormPreviousData(): any { return this.get("ScormPreviousData"); }
        set ScormPreviousData(value: any) { this.set("ScormPreviousData", value); }

        // get KnowledgeChecks(): Components.Models.KnowledgeCheck { return this.get("KnowledgeCheckModel"); }
        // set KnowledgeChecks(value: Components.Models.KnowledgeCheck) { this.set("KnowledgeCheckModel", value); }

        get KnowledgeChecks(): DataStructures.KnowledgeChecks[] { return this.get("KnowledgeChecks"); }
        set KnowledgeChecks(value: DataStructures.KnowledgeChecks[]) { this.set("KnowledgeChecks", value); }

        get CuePoints(): DataStructures.CuePoint[] { return this.get("CuePoints"); }
        set CuePoints(value: DataStructures.CuePoint[]) { this.set("CuePoints", value); }



        protected currentitemid: string;

        constructor(options: any) {
            super(options);



            let model: Playlist = this,
                audioData: DataStructures.AudioData[] = options.audioData,
                kcdata:DataStructures.KCData[]= options.kcdata,
                hideItemCount = 0,
                qItemCount = 0;

            model.PlaylistItems = new Array<PlaylistItem>();

            model.QuestionlistItems = new Array<QuestionlistItem>();

            model.KnowledgeCheckItems = new Array<KnowledgeCheckItem>();


            for (let i = 0; i < audioData.length; i++) {
                let playlistItem: PlaylistItem = new PlaylistItem(audioData[i]),
                    idx: number = (model.PlaylistStartIndex ? model.PlaylistStartIndex + i : i),
                    index: string = (idx < 9 ? "0" + (idx + 1) : "" + (idx + 1));

                if (playlistItem.HiddenInPlaylist) {
                    hideItemCount++;
                }
                playlistItem.Index = index;
                playlistItem.SrNumbar = hideItemCount ?
                    (idx < 9 ? "0" + ((idx - hideItemCount) + 1) : "" + ((idx - hideItemCount) + 1)) :
                    (idx < 9 ? "0" + (idx + 1) : "" + (idx + 1))

                model.PlaylistItems.push(playlistItem);


                let questionlistItem:QuestionlistItem = new QuestionlistItem(audioData[i]),
                    qidx: number = (model.PlaylistStartIndex ? model.PlaylistStartIndex + i : i),
                    qindex: string = (qidx < 9 ? "0" + (qidx + 1) : "" + (qidx + 1));

                    // if(QuestionlistItem.HasQuestion){
                    //     qItemCount++;
                    // }

                    if (questionlistItem.HiddenInPlaylist) {
                        qItemCount++;
                    }

                    questionlistItem.Index = qindex;

                    questionlistItem.SrNumbar = qItemCount ?
                    (qidx < 9 ? "0" + ((qidx - qItemCount) + 1) : "" + ((qidx - qItemCount) + 1)) :
                    (qidx < 9 ? "0" + (qidx + 1) : "" + (qidx + 1))

                if(questionlistItem.HasQuestion){
                    model.QuestionlistItems.push(questionlistItem);
                }



                // if(playlistItem.IsAssessment && this.isKcComplete()){
                //     playlistItem.Disabled=false;
                // }

                if (playlistItem.Current) {
                    model.CurrentItem = playlistItem;
                }

                // if (questionlistItem.Current) {
                //     model.CurrentQuesItem = questionlistItem;
                // }
            }


            if (!model.CurrentItem) {
                model.setAudioByID(model.PlaylistItems[0].Id);
            }
            console.log("Playlist options")
            console.log(options)
            console.log(options.kcdata)
            //alert("model.KnowledgeChecks")
           // alert(kcdata)
            for (let i: number = 0; i < kcdata.length; i++) {
                let knowledgeCheckItem :KnowledgeCheckItem = new KnowledgeCheckItem(kcdata[i])
                model.KnowledgeCheckItems.push(knowledgeCheckItem)

            }
        }

        /**
         * Returns URL of the passed video ID
         * @param audioId
         * @return URL of the video.
         */
        public getSrc(audioId: string): string {
            let curSrc: string = "";
            for (let i = 0; i < this.PlaylistItems.length; i++) {
                if (audioId === this.PlaylistItems[i].Id) {
                    curSrc = this.PlaylistItems[i].Url;
                    break;
                }
            }
            return curSrc;
        }

        public getAudioByID(audioId: string): PlaylistItem {
            return this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.Id === audioId;
            })[0];
        }

        public setAudioByID(audioId: string): void {
            if (this.CurrentItem) {
                this.CurrentItem.Current = false;
            }
            this.CurrentItem = this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.Id === audioId;
            })[0];
            this.CurrentItem.Current = true;
        }

        public getCompletedCount(): number {
            return this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.Complete;
            }).length;
        }

        public enableNext(curVidId: string): void {
            let model: Playlist = this,
                found: boolean = false;

            for (let i: number = 0; i < model.PlaylistItems.length; i++) {
                if (found) {
                    model.PlaylistItems[i].Disabled = false;
                    break;
                }
                if (model.PlaylistItems[i].Id === curVidId) {
                    found = true;
                }
            }


        }

        public enableNextKc(curVidId: string): void {
            let model: Playlist = this;
            let CurrentItem = this.QuestionlistItems.filter(function (val: QuestionlistItem): boolean {
                return val.Id === curVidId;
            })[0];


            if(CurrentItem){
                //console.log("CurrentItem ")
                //console.log(CurrentItem)
                //CurrentItem.Complete=true;
                CurrentItem.Disabled=false;
                //this.CurrentItem.Current = true;
            }

            model.enableAssessment();



        }

        public enableAssessment():void{
            let model: Playlist = this;
            let assessmentItem = this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.IsAssessment;
            })[0];
            if(model.isItemComplete() && model.isKcComplete()){
                assessmentItem.Disabled=false;
            }else{
                assessmentItem.Disabled=true;
            }

            console.log("PlaylistItems")
            console.log(model.PlaylistItems)
        }

        public completeKc(curVidId: string): void {
            let CurrentItem = this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.Id === curVidId;
            })[0];
            let CurrentQuestion = this.QuestionlistItems.filter(function (val: QuestionlistItem): boolean {
                return val.Id === curVidId;
            })[0];
            // console.log("CurrentItem")
            // console.log(CurrentItem)
            // console.log("CurrentQuestion")
            // console.log(CurrentQuestion)
            if(CurrentItem){
                if(CurrentItem.Kccomplete){
                    CurrentQuestion.Kccomplete=true;
                }
            }

        }

        public enableKc(curVidId: string): void {

            let CurrentItem = this.QuestionlistItems.filter(function (val: QuestionlistItem): boolean {
                return val.Id === curVidId;
            })[0];

            if(CurrentItem){
                if(CurrentItem.Complete){
                    //CurrentItem.Complete=true;
                    CurrentItem.Disabled=false;
                }else{
                    //CurrentItem.Complete=false;
                    CurrentItem.Disabled=true;
                }

                //this.CurrentItem.Current = true;
            }
        }
        // public getNumQuestions(curVidId: string,numQuestions:number): void {
        //     let CurrentItem = this.QuestionlistItems.filter(function (val: QuestionlistItem): boolean {
        //         return val.Id === curVidId;
        //     })[0];

        //     if(CurrentItem){
        //         CurrentItem.NumQuestions=numQuestions;
        //         //this.CurrentItem.Current = true;
        //     }
        // }
        public isLastAudio(): boolean {
            let model: Playlist = this,
                lastItem: PlaylistItem = model.PlaylistItems[model.PlaylistItems.length - 1];
            if (lastItem.IsAssessment) {
                lastItem = model.PlaylistItems[model.PlaylistItems.length - 2];
            }
            return (model.CurrentItem.Id === lastItem.Id);
        }
        public isItemComplete(): boolean {
            let model: Playlist = this,
                lastItem: PlaylistItem = model.PlaylistItems[model.PlaylistItems.length - 1];
            if (lastItem.IsAssessment) {
                lastItem = model.PlaylistItems[model.PlaylistItems.length - 2];
            }
            return (lastItem.Complete);
        }
        public isKcComplete(): boolean {
            let model: Playlist = this;
            let KClength:number = this.QuestionlistItems.filter(function (val: QuestionlistItem): boolean {
                return val.Kccomplete;
            }).length;
            //let model: Models.AudioPlayer = this;
            return (KClength === model.QuestionlistItems.length);
        }

        public setCurrentClicked(curVidId: string):void{
            let model: Playlist = this;
            for (let i = 0; i < this.PlaylistItems.length; i++) {
                model.PlaylistItems[i].CurrentClicked=false;
            }
            let currentClicked = this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.Id === curVidId;
            })[0];

            if(currentClicked){
                currentClicked.CurrentClicked = true;
            }
        }

    }
}
