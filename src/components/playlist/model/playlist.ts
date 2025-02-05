/// <reference path="playlist-item.ts" />
/// <reference path="knowledge-check-item.ts" />

namespace HTML5AudioPlayer.Components.Models {

    export class Playlist extends Backbone.Model {

        get PlaylistItems(): PlaylistItem[] { return this.get("playlistItems"); }
        set PlaylistItems(value: PlaylistItem[]) { this.set("playlistItems", value); }


        get Chapters(): string { return this.get("chapters"); }
        set Chapters(value: string) { this.set("chapters", value); }

        get Questions(): string { return this.get("questions"); }
        set Questions(value: string) { this.set("questions", value); }



        get KnowledgeCheckItems(): KnowledgeCheckItem[] { return this.get("KnowledgeCheckItems"); }
        set KnowledgeCheckItems(value: KnowledgeCheckItem[]) { this.set("KnowledgeCheckItems", value); }

        get CurrentItem(): PlaylistItem { return this.get("currentitem"); }
        set CurrentItem(value: PlaylistItem) { this.set("currentitem", value); }

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

        get Speakers(): DataStructures.Speakers { return this.get("speakers"); }
        set Speakers(value: DataStructures.Speakers) { this.set("speakers", value); }

        protected currentitemid: string;

        constructor(options: any) {
            super(options);



            let model: Playlist = this,
                audioData: DataStructures.AudioData[] = options.audioData,
                kcdata:DataStructures.KCData[]= options.kcdata,
                hideItemCount = 0,
                titlesData:DataStructures.Titles = options.Titles,
                qItemCount = 0;
                model.Chapters= titlesData.chapters;
                model.Questions = titlesData.questions;
                model.Speakers = options.Speakers;

            model.PlaylistItems = new Array<PlaylistItem>();

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
                if (playlistItem.Current) {
                    model.CurrentItem = playlistItem;
                }
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
                knowledgeCheckItem.Index = i+1
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

        public enableAssessment():void{
            let model: Playlist = this;
            let assessmentItem = this.PlaylistItems.filter(function (val: PlaylistItem): boolean {
                return val.IsAssessment;
            })[0];
            if(assessmentItem){
                if(model.isItemComplete() && model.isKClistComplete()){
                    assessmentItem.Disabled=false;
                }else{
                    assessmentItem.Disabled=true;
                }
            }

            console.log("PlaylistItems")
            console.log(model.PlaylistItems)
        }


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
        public isKClistComplete(): boolean {
            let model: Playlist = this;
            let KClength:number = this.KnowledgeCheckItems.filter(function (val: KnowledgeCheckItem): boolean {
                return val.Complete;
            }).length;
            //let model: Models.AudioPlayer = this;
            return (KClength === model.KnowledgeCheckItems.length);
        }

        public kcItemActiveList(): number {
            let model: Playlist = this;
            let KClength:number = this.KnowledgeCheckItems.filter(function (val: KnowledgeCheckItem): boolean {
                return !val.Disabled;
            }).length;

            //let model: Models.AudioPlayer = this;
            return KClength;
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

        public enableKcList(curVidId: string): void {

            let CurrentItem = this.KnowledgeCheckItems.filter(function (val: KnowledgeCheckItem): boolean {
                return val.Id === curVidId;
            })[0];

            if(CurrentItem){
                if(CurrentItem.Complete){
                    CurrentItem.Complete=true;
                }else{
                    CurrentItem.Complete=false;
                }
                if(CurrentItem.Disabled){
                    CurrentItem.Disabled=false;
                }else{
                    CurrentItem.Disabled=true;
                }

                //this.CurrentItem.Current = true;
            }
        }

    }
}
