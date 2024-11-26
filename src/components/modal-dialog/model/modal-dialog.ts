namespace HTML5AudioPlayer.Components.Models {

    export class ModalDialog extends Backbone.Model {
        get Heading(): string { return this.get("heading"); }
        set Heading(value: string) { this.set("heading", value); }

        get Content(): string { return this.get("content"); }
        set Content(value: string) { this.set("content", value); }

        get CloseButton(): boolean { return this.get("hasclose"); }
        set CloseButton(value: boolean) { this.set("hasclose", value); }

        get Progressbar(): boolean { return this.get("hasProgressbar"); }
        set Progressbar(value: boolean) { this.set("hasProgressbar", value); }

        get ProgressTitle(): string { return this.get("progressTitle"); }
        set ProgressTitle(value: string) { this.set("progressTitle", value); }

        get Buttons(): DataStructures.ModalButton[] { return this.get("buttons"); }
        set Buttons(value: DataStructures.ModalButton[]) { this.set("buttons", value); }

        get StartRating(): boolean { return this.get("hasStarRating"); }
        set StartRating(value: boolean) { this.set("hasStarRating", value); }

        get Rating(): number { return this.get("rating"); }
        set Rating(value: number) { this.set("rating", value); }

        constructor(options: DataStructures.ModalDialogOptions) {
            super(options);
            this.Rating = 0;
        }
    }
}