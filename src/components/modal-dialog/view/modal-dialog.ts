namespace HTML5AudioPlayer.Components.Views {

    export class ModalDialog extends Backbone.View<Models.ModalDialog> {
        private _template: (properties?: HandlebarsTemplates) => string;

        constructor(options: any) {
            super(options);

            let modalDialogView: ModalDialog = this;
            let modalDialogModel: Models.ModalDialog = this.model;

            modalDialogView._template = HBTemplates['modal-dialog'];
            modalDialogView.$el.addClass("modal-background fade");
        }

        public events() {
            return <Backbone.EventsHash>{
                'click .close-modal': 'closeModal',
                'click .star': 'updateRating',
            };
        }

        public render() {
            let modalDialogView = this,
                modalDialogModel: Models.ModalDialog = this.model;

            modalDialogView.$el.html(modalDialogView._template(modalDialogModel.toJSON()));

            let storedRating = localStorage.getItem('starRating');
            if (storedRating) {
                modalDialogModel.Rating = parseInt(storedRating, 10);  // Use the stored value
            }

            modalDialogView.updateStars();
            return modalDialogView;
        }

        public showModal(): void {
            let modalDialogView: ModalDialog = this;
            $("body").append(modalDialogView.render().$el.addClass("in"));
        }

        public closeModal(evt?: MouseEvent): void {
            let modalDialogView: ModalDialog = this,
                modalDialogModel: Models.ModalDialog = this.model,
                $btn, btnId: string;

            if (evt) {
                $btn = $(evt.currentTarget);
                btnId = $btn.attr("data-id");
            }

            if (modalDialogModel.Progressbar) {
                modalDialogView.resetProgressBar();
            }
            if (modalDialogModel.Buttons) {
                modalDialogView.trigger(Events.EVENT_MODAL_CLOSED, btnId);
            }
            modalDialogView.$el.removeClass("in");
            modalDialogView.destroy();
        }

        public updateProgress(text: string, successPercent: number, failedPercent: number): void {
            let modalDialogView: ModalDialog = this,
                modalDialogModel: Models.ModalDialog = this.model,
                $progressBarSuccess: JQuery = modalDialogView.$(".progress-bar.progress-bar-success"),
                $progressBarFailed: JQuery = modalDialogView.$(".progress-bar.progress-bar-danger"),
                $bodyText: JQuery = modalDialogView.$(".modal-body .progress-text .progress-text-content");

            $progressBarSuccess.css('width', successPercent + '%').html(successPercent > 5 ? successPercent + '%' : '');
            $progressBarFailed.css('width', failedPercent + '%').html(failedPercent > 2 ? failedPercent + '%' : '');

            modalDialogModel.Content = text;
            $bodyText.html(text);
        }

        public resetProgressBar(): void {
            let modalDialogView: ModalDialog = this,
                modalDialogModel: Models.ModalDialog = modalDialogView.model,
                $progressBarSuccess: JQuery = modalDialogView.$(".progress-bar.progress-bar-success"),
                $progressBarFailed: JQuery = modalDialogView.$(".progress-bar.progress-bar-danger"),
                $bodyText: JQuery = modalDialogView.$(".modal-body .modal-body-text");

            modalDialogModel.Content = "";

            $progressBarSuccess.css('width', 0 + '%').html('');
            $progressBarFailed.css('width', 0 + '%').html('');
            $bodyText.html('');
        }

        private updateStars(): void {
            let modalDialogView = this,
            modalDialogModel: Models.ModalDialog = this.model;

            modalDialogView.$('.star').each((index, element) => {
                let $star = $(element);
                let value = parseInt($star.attr('data-value')!, 10);

                if (value <= modalDialogModel.Rating) {
                    $star.addClass('selected');
                } else {
                    $star.removeClass('selected');
                }
            });
            this.$('.rating-text').html(`You rated ${modalDialogModel.Rating} star${modalDialogModel.Rating > 1 ? 's' : ''}`);
        }

        private updateRating(evt:Event): void {
            let modalDialogView = this,
                modalDialogModel: Models.ModalDialog = this.model;

            let $star = $(evt.currentTarget);
            modalDialogModel.Rating = parseInt($star.attr('data-value')!, 10);

            localStorage.setItem('starRating', modalDialogModel.Rating.toString());

            this.updateStars();

            modalDialogModel.set('rating', modalDialogModel.Rating);

            this.$('.rating-text').html(`You rated ${modalDialogModel.Rating} star${modalDialogModel.Rating > 1 ? 's' : ''}`);
        }

        public destroy(): void {
            let modalDialogView: ModalDialog = this;
            modalDialogView.unbind();
            modalDialogView.$el.html("");
            modalDialogView.$el.empty();
            modalDialogView.remove();
        }
    }
}