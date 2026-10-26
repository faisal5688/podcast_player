namespace HTML5AudioPlayer.Components.Models {

    export class PdfViewer extends Backbone.Model {
        get Heading(): string { return this.get("heading"); }
        set Heading(value: string) { this.set("heading", value); }

        get Content(): string { return this.get("content"); }
        set Content(value: string) { this.set("content", value); }

        get CloseButton(): boolean { return this.get("hasclose"); }
        set CloseButton(value: boolean) { this.set("hasclose", value); }

        get HasDownload(): boolean { return this.get("hasDownload"); }
        set HasDownload(value: boolean) { this.set("hasDownload", value); }

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

        // ============ PDF related properties ============
        get HasPdf(): boolean { return this.get("hasPdf"); }
        set HasPdf(value: boolean) { this.set("hasPdf", value); }

        get PdfUrl(): string { return this.get("pdfUrl"); }
        set PdfUrl(value: string) { this.set("pdfUrl", value); }

        get PdfTitle(): string { return this.get("pdfTitle"); }
        set PdfTitle(value: string) { this.set("pdfTitle", value); }

        // ============ Platform detection ============
        get IsIos(): boolean { return this.get("isIos"); }
        set IsIos(value: boolean) { this.set("isIos", value); }

        constructor(options: DataStructures.PdfViewerOptions) {
            super(options);
            this.Rating = 0;

            if (this.HasPdf === undefined) { this.HasPdf = false; }
            if (!this.PdfTitle) { this.PdfTitle = "PDF Document"; }
            if (this.HasDownload === undefined) { this.HasDownload = false; }

            this.IsIos =
                /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        }
    }
}