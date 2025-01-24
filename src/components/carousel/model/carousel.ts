/// <reference path="carousel-item.ts" />
namespace HTML5AudioPlayer.Components.Models {

    export class Carousel extends Backbone.Model {

        get HasCarousel(): boolean { return this.get("hasCarousel"); }
        set HasCarousel(value: boolean) { this.set("hasCarousel", value); }

        get Showcontrols(): boolean { return this.get("showcontrols"); }
        set Showcontrols(value: boolean) { this.set("showcontrols", value); }



        get Visible(): boolean { return this.get("visible"); }
        set Visible(value: boolean) { this.set("visible", value); }

        get CarouselItems(): CarouselItem[] { return this.get("carouselItems"); }
        set CarouselItems(value: CarouselItem[]) { this.set("carouselItems", value); }


        constructor(options: any) {
            super(options);

            let model: Carousel = this,
            slideData: DataStructures.slideData[] = options.slides;

            model.CarouselItems = new Array<CarouselItem>();
            console.log("options ")
            console.log(options)
            if(model.HasCarousel){
                for (let i: number = 0; i < slideData.length; i++) {
                    let carouselItem: CarouselItem = new CarouselItem(slideData[i]);
                    model.CarouselItems.push(carouselItem)
                }
            }
            // hideItemCount = 0;
        }
    }
}