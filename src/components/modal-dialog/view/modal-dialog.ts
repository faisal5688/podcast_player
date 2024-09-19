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
                'click .close-modal': 'closeModal'
            };
        }

        public render() {
            let modalDialogView = this,
                modalDialogModel: Models.ModalDialog = this.model;

            modalDialogView.$el.html(modalDialogView._template(modalDialogModel.toJSON()));
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

        public destroy(): void {
            let modalDialogView: ModalDialog = this;
            modalDialogView.unbind();
            modalDialogView.$el.html("");
            modalDialogView.$el.empty();
            modalDialogView.remove();
        }
    }
}