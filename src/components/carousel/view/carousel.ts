/// <reference path="../../../common/scorm-wrapper.ts" />
/// <reference path="../../../common/utilities.ts" />
/// <reference path="../model/carousel.ts" />
/// <reference path="../model/carousel-item.ts" />

namespace HTML5AudioPlayer.Components.Views {

    export class Carousel extends Backbone.View<Models.Carousel> {
        private _template: (properties?: HandlebarsTemplates) => string;

        private _crouselItems: CarouselItem[];
        private currentSlideIndex: number;
        private parentWidth: number;
        Visible: any;

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
                carouselItemView.on(Events.EVENT_CLICK_MENU, carouselView.toggleMenulist, carouselView);
            }

            $(window).on('resize', carouselView.afterResize);
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

            carouselView.parentWidth = carouselViewInner.outerWidth();
            // alert(carouselView.parentWidth)
            //$('.carousel-slide').css("width",$("#carousel-content").outerWidth());


            // Render circular navigation buttons
            //carouselView.renderIndicators();
            carouselView.updateSlidePosition();
            carouselView.afterRender();
            return carouselView;
        }

        @named
        public afterRender(): void {
            let carouselView = this,
                carouselModel: Models.Carousel = this.model;
            let carouselViewSlide: JQuery = carouselView.$el.find(".carousel-slide"),
                carouselViewInner: JQuery = carouselView.$el.find("#carousel-content");
            carouselViewSlide.css("width", carouselViewInner.outerWidth());
        }

        @named
        public afterResize():void{
            $('.carousel-slide').css("width",$("#carousel-content").outerWidth());

        }




        @named
        private toggleMenulist(): void {
            let carouselView = this,
                carouselModel: Models.Carousel = this.model;
            // let audioPlayerView: AudioPlayer = this,
            //     audioPlayerModel: Models.AudioPlayer = audioPlayerView.model,
            //     playerContainer: JQuery = audioPlayerView.$(".player-container"),
            let menuPanel: JQuery = $("#course-leftpanel"),
                visible: boolean = menuPanel.is(':visible');
            //alert(visible)

            // if (Utilities.isiPad()) {
            //     if (Utilities.readDeviceOrientation() === "Portrait") {
            //         carouselView.once(Events.EVENT_PLAYLIST_ANIMATION_END, function () {
            //             menuPanel.off(Events.CSS_ANIMATION_END);
            //             if (menuPanel.hasClass("to-full-width")) {
            //                 menuPanel.removeClass("to-full-width").addClass("fullWidth");
            //             }
            //             if (menuPanel.hasClass("to-small-width")) {
            //                 menuPanel.removeClass("to-small-width fullWidth");
            //             }
            //         });
            //     }
            // }
            // if (visible) {
            //     if (Utilities.isiPhone()) {
            //         // audioPlayerView._playerPausedOnShowPlaylist = audioPlayerView._myPlayer.paused();
            //         // if (!audioPlayerView._playerPausedOnShowPlaylist) {
            //         //     audioPlayerView.pause();
            //         // }
            //     }
            //     else {
            //         menuPanel.one(Events.CSS_ANIMATION_END, function (evt) {
            //             menuPanel.removeClass("to-full-width").addClass("fullWidth");
            //         })
            //             .removeClass("fullWidth")
            //             .addClass("to-full-width");
            //     }
            // }
            // else {
            //     //if (!Utilities.isiPhone()) {
            //         menuPanel.one(Events.CSS_ANIMATION_END, function (evt) {
            //             menuPanel.removeClass("to-small-width");
            //         })
            //             .removeClass("fullWidth")
            //             .addClass("to-small-width");
            //     //}
            // }
            carouselView.trigger(Events.EVENT_TOGGLEMENU, carouselModel);
            carouselView.toggle();
        }
        public toggle(): void {
            let carouselView = this,
                carouselModel: Models.Carousel = this.model
            let menuPanel: JQuery = $("#course-leftpanel"),
                visible: boolean = menuPanel.is(':visible');
            //playlistContainer: JQuery = playlistView.$el.parent();

            if (!visible) {
                // alert()
                menuPanel.one(Events.CSS_ANIMATION_END, function () {
                    menuPanel.removeClass("to-animate-right").addClass("animate-right");
                    carouselView.trigger(Events.EVENT_PLAYLIST_ANIMATION_END);
                    $(".course-leftpanel-overlay").show();
                })
                    .addClass("to-animate-right");
            } else {
                menuPanel.one(Events.CSS_ANIMATION_END, function () {
                    menuPanel.removeClass("to-animate-left").removeClass("animate-right");
                    carouselView.trigger(Events.EVENT_PLAYLIST_ANIMATION_END);
                    $(".course-leftpanel-overlay").hide();
                })
                    .addClass("to-animate-left");
            }
            carouselView.Visible = !carouselView.Visible;
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
            //alert(this.currentSlideIndex)

            let carouselView = this,
                carouselModel: Models.Carousel = this.model;

                if(carouselModel.Showcontrols){
                    const offset = -this.currentSlideIndex * (100); // 300px width per slide
                    this.$('.carousel-content').css('transform', `translateX(${offset}%)`);

                    // Update active state for indicators
                    this.$('.carousel-indicators button').removeClass('active');
                    this.$(`.carousel-indicators button[data-index="${this.currentSlideIndex}"]`).addClass('active');
                }

        }

        goToSlide(event: JQuery.ClickEvent, slideNum?:number) {
            const index = event ? $(event.currentTarget).data('index'): slideNum;
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