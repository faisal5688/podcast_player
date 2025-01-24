/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/copyright.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Copyright extends Backbone.View<Models.Copyright> {
        private _template: (properties?: HandlebarsTemplates) => string;

        private currentSlideIndex: number;
        private parentWidth: number;
        Visible: any;

        constructor(options: any) {
            super(options);

            let carouselView: Copyright = this;
            let carouselModel: Models.Copyright = this.model;
            this.currentSlideIndex = 0;

            carouselView._template = HBTemplates['copyright'];


        }

        public events() {
            return {
                'click .copyright-close-btn': 'closeCopyright',
            };
        }

        public render() {
            let carouselView = this,
                carouselModel: Models.Copyright = this.model;
            //alert(carouselModel.HasCarousel)
            //alert(carouselModel.toJSON())
            carouselView.$el.html(carouselView._template(carouselModel.toJSON()));
            carouselView.$el.hide()
            carouselView.$el.addClass("copyright-container");
            //let carouselViewInner: JQuery = carouselView.$el.find("#copyright-content");

            carouselView.afterRender();
            return carouselView;
        }

        @named
        public afterRender(): void {
            let carouselView = this,
                carouselModel: Models.Copyright = this.model;

        }

        public show(): void {
            let carouselView = this,
            carouselModel: Models.Copyright = this.model;
            //let carouselView: Assessment = this;
            carouselView.$el.fadeIn(200);
        }

        public closeCopyright() {
            let carouselView = this;
            carouselView.$el.removeClass("copyright-container");
            carouselView.$el.fadeOut(200);
        }




    }
}