namespace HTML5AudioPlayer.Components.Models {

    export class CarouselItem extends Backbone.Model {

        get Id(): string { return this.get("id"); }
        set Id(value: string) { this.set("id", value); }

        get Title(): string { return this.get("title"); }
        set Title(value: string) { this.set("title", value); }

        get Description(): string { return this.get("description"); }
        set Description(value: string) { this.set("description", value); }

        get Preview(): string { return this.get("preview"); }
        set Preview(value: string) { this.set("preview", value); }

        get Subtitle(): string { return this.get("subtitle"); }
        set Subtitle(value: string) { this.set("subtitle", value); }

        // get Current(): boolean { return this.get("current"); }
        // set Current(value: boolean) { this.set("current", value); }

        // get Disabled(): boolean { return this.get("disabled"); }
        // set Disabled(value: boolean) { this.set("disabled", value); }

        // get Buttons(): DataStructures.ModalButton[] { return this.get("buttons"); }
        // set Buttons(value: DataStructures.ModalButton[]) { this.set("buttons", value); }

        constructor(options: DataStructures.slideData) {
            super(options);

            let model: CarouselItem = this;

            // hideItemCount = 0;
        }
    }
}