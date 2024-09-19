namespace HTML5AudioPlayer.Components.Models {

    export class PlaylistItem extends Backbone.Model {

        get Id(): string { return this.get("id"); }
        set Id(value: string) { this.set("id", value); }

        get Title(): string { return this.get("title"); }
        set Title(value: string) { this.set("title", value); }

        get TitleEllipses(): string { return this.get("TitleEllipses"); }
        set TitleEllipses(value: string) { this.set("TitleEllipses", value); }

        get Description(): string { return this.get("description"); }
        set Description(value: string) { this.set("description", value); }

        get Url(): string { return this.get("url"); }
        set Url(value: string) { this.set("url", value); }

        get Transcript(): string { return this.get("transcript"); }
        set Transcript(value: string) { this.set("transcript", value); }

        get Subtitle(): string { return this.get("subtitle"); }
        set Subtitle(value: string) { this.set("subtitle", value); }

        get PreviewImage(): string { return this.get("preview"); }
        set PreviewImage(value: string) { this.set("preview", value); }

        get Thumbnail(): string { return this.get("thumbnail"); }
        set Thumbnail(value: string) { this.set("thumbnail", value); }

        get Current(): boolean { return this.get("current"); }
        set Current(value: boolean) { this.set("current", value); }

        get CurrentTime(): number { return this.get("currenttime"); }
        set CurrentTime(value: number) { this.set("currenttime", value); }

        get Duration(): number { return this.get("duration"); }
        set Duration(value: number) { this.set("duration", value); }

        get Index(): string { return this.get("index"); }
        set Index(value: string) { this.set("index", value); }

        get SrNumbar(): string { return this.get("srNumbar"); }
        set SrNumbar(value: string) { this.set("srNumbar", value); }

        get Complete(): boolean { return this.get("complete"); }
        set Complete(value: boolean) { this.set("complete", value); }

        get Kccomplete(): boolean { return this.get("kccomplete"); }
        set Kccomplete(value: boolean) { this.set("kccomplete", value); }

        get Disabled(): boolean { return this.get("disabled"); }
        set Disabled(value: boolean) { this.set("disabled", value); }

        get IsAssessment(): boolean { return this.get("isAssessment"); }
        set IsAssessment(value: boolean) { this.set("isAssessment", value); }

        get HiddenInPlaylist(): boolean { return this.get("hiddenInPlaylist"); }
        set HiddenInPlaylist(value: boolean) { this.set("hiddenInPlaylist", value); }

        get IsSurvey(): boolean { return this.get("isSurvey"); }
        set IsSurvey(value: boolean) { this.set("isSurvey", value); }

        get hasUrl(): boolean { return this.get("url"); }
        set hasUrl(value: boolean) { this.set("url", value); }

        get MicroPolls(): DataStructures.MicroPoll[] { return this.get("microPolls"); }
        set MicroPolls(value: DataStructures.MicroPoll[]) { this.set("microPolls", value); }

        get HasQuestion(): boolean { return this.get("hasQuestion"); }
        set HasQuestion(value: boolean) { this.set("hasQuestion", value); }

        get Total(): number { return this.get("total"); }
        set Total(value: number) { this.set("total", value); }


        get QuesDescription(): string { return this.get("quesDescription"); }
        set QuesDescription(value: string) { this.set("quesDescription", value); }

        get NumQuestions(): number { return this.get("numQuestions"); }
        set NumQuestions(value: number) { this.set("numQuestions", value); }

        constructor(options: DataStructures.AudioData) {
            super(options);
            let model: PlaylistItem = this;
            model.NumQuestions = model.NumQuestions || 0;
            model.CurrentTime = model.CurrentTime || 0;
            model.Current = model.Current || false;
            model.Complete = model.Complete || false;
            model.Kccomplete = model.Kccomplete || false;
            model.MicroPolls = model.MicroPolls || [];
            model.TitleEllipses = model.Title;
            if (model.Title.length > 75) {
                model.TitleEllipses = model.Title.slice(0, 75) + "...";
            }
        }
    }
}
