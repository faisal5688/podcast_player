/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/carousel.ts" />
/// <reference path="../model/carousel-item.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Carousel extends Backbone.View<Models.Carousel> {

        private _template: (properties?: HandlebarsTemplates) => string;

        private _crouselItems: CarouselItem[];
        private currentSlideIndex: number;

        constructor(options: any) {
            super(options);

            let carouselView: Carousel = this;
            let carouselModel: Models.Carousel = this.model;
            this.currentSlideIndex = 0;

            carouselView._template = HBTemplates['carousel'];
            carouselView._crouselItems = new Array<CarouselItem>();

            for (let i = 0; i < carouselModel.CarouselItems.length; i++) {

                let carouselItemView = new CarouselItem({
                    id: _.uniqueId("carousel-item"),
                    className: "carousel-item",
                    model: carouselModel.CarouselItems[i]
                });

                carouselView._crouselItems.push(carouselItemView);
            }
        }

        public events() {
            return {
                'click .next': 'nextSlide',
                'click .prev': 'prevSlide',
                'click .carousel-indicators button': 'goToSlide'
            };
        }

        public render() {
            let carouselView = this,
                carouselModel: Models.Carousel = this.model;
            //alert(carouselModel.HasCarousel)

            carouselView.$el.html(carouselView._template(carouselModel.toJSON()));

            let carouselViewInner: JQuery = carouselView.$el.find("#carousel-content");

            const indicatorsContainer = this.$('.carousel-indicators');
            indicatorsContainer.empty(); // Clear existing buttons

            for (let i = 0; i < carouselView._crouselItems.length; i++) {
                let carouselItem: CarouselItem = carouselView._crouselItems[i];
                carouselViewInner.append(carouselItem.render().$el);
                const isActive = i === this.currentSlideIndex ? 'active' : '';
                indicatorsContainer.append(`<button class="${isActive}" data-index="${i}"></button>`);
            }



            // Render circular navigation buttons
            //carouselView.renderIndicators();
            carouselView.updateSlidePosition();

            return carouselView;
        }

        renderIndicators() {
            let carouselView = this,
                carouselModel: Models.Carousel = this.model;
            const indicatorsContainer = this.$('.carousel-indicators');
            indicatorsContainer.empty(); // Clear existing buttons

            // // Create a button for each slide
            // this.collection.each((slide, index) => {
            //     const isActive = index === this.currentSlideIndex ? 'active' : '';
            //     indicatorsContainer.append(`<button class="${isActive}" data-index="${index}"></button>`);
            // });

            // Create a button for each slide in _carouselItems
            carouselView._crouselItems.forEach((_, index) => {
                const isActive = index === this.currentSlideIndex ? 'active' : '';
                indicatorsContainer.append(`<button class="${isActive}" data-index="${index}"></button>`);
            });
        }

        updateSlidePosition() {
            const offset = this.currentSlideIndex * -300; // 300px width per slide
            this.$('.carousel-content').css('transform', `translateX(${offset}px)`);

            // Update active state for indicators
            this.$('.carousel-indicators button').removeClass('active');
            this.$(`.carousel-indicators button[data-index="${this.currentSlideIndex}"]`).addClass('active');
        }

        goToSlide(event: JQuery.ClickEvent) {
            const index = $(event.currentTarget).data('index');
            this.currentSlideIndex = index;
            this.updateSlidePosition();
        }

        public nextSlide() {
            // if (this.currentSlideIndex < this.collection.length - 1) {
            //     this.currentSlideIndex++;
            //     this.updateSlidePosition();
            // }
        }

        public prevSlide() {
            if (this.currentSlideIndex > 0) {
                this.currentSlideIndex--;
                this.updateSlidePosition();
            }
        }


    }
}