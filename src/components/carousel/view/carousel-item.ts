/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/carousel.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class CarouselItem extends Backbone.View<Models.CarouselItem> {
        private _template: (properties?: HandlebarsTemplates) => string;


        constructor(options: any) {
            super(options);

            let carouselView: CarouselItem = this;
            let carouselModel: Models.CarouselItem = this.model;



            carouselView._template = HBTemplates['carousel-item'];
            carouselView.$el.addClass("carousel-item");
        }



        public render() {
            let carouselView = this,
                carouselModel: Models.CarouselItem = this.model;

            carouselView.$el.html(carouselView._template(carouselModel.toJSON()));
            return carouselView;
        }


    }
}