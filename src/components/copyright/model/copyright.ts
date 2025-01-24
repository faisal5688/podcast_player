namespace HTML5AudioPlayer.Components.Models {

    export class Copyright extends Backbone.Model {

        get HasCarousel(): boolean { return this.get("hasCarousel"); }
        set HasCarousel(value: boolean) { this.set("hasCarousel", value); }

        get Visible(): boolean { return this.get("visible"); }
        set Visible(value: boolean) { this.set("visible", value); }

        get Content(): string { return this.get("content"); }
        set Content(value: string) { this.set("content", value); }


        constructor(options: any) {
            super(options);

            let model: Copyright = this;
            //slideData: DataStructures.slideData[] = options.slides;

            model.Content = model.Content;

            console.log("************** Copyright  "+model.Content)
            console.log(options)

            // hideItemCount = 0;
        }
    }
}