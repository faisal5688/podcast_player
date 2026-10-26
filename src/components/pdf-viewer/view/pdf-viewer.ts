namespace HTML5AudioPlayer.Components.Views {

    export class PdfViewer extends Backbone.View<Models.PdfViewer> {
        private _template: (properties?: HandlebarsTemplates) => string;
        private _pdfDoc: any = null;
        private _pdfViewerContainer: JQuery = null;

        private _resizeObserver: any = null;
        private _resizeTimer: number = null;
        private _lastRenderedWidth: number = 0;

        // Re-entrancy guard: prevents the same view instance from kicking
        // off more than one download at a time.
        private _downloadStarted: boolean = false;

        private static _preloadedUrls: { [url: string]: boolean } = {};

        // ============ Blob prefetch cache ============
        // Required for the iOS Web Share API to show the full share sheet
        // (AirDrop, Messages, Mail, Save to Files, …).
        // navigator.share() requires transient user activation; if we wait
        // for an async fetch after the click, iOS rejects with
        // NotAllowedError. Prefetching the blob early lets share() run
        // synchronously from the click handler.
        private static _prefetchedBlobs: { [absUrl: string]: Blob } = {};
        private static _prefetchPromises: { [absUrl: string]: Promise<Blob> } = {};

        // Worker path must match where you placed pdf.worker.min.js.
        private static _pdfWorkerUrl: string =
            "libs/pdf_viewer/3.11.174/pdf.worker.min.js";

        private static _widthReservePxDesktop: number = 6;
        private static _widthReservePxMobile: number = 2;

        private static _maxScale: number = 2;
        private static _minScale: number = 0.1;

        // ============ ZIP detection ============
        private static isZipFile(fileName: string, pdfUrl?: string): boolean {
            if (fileName && /\.zip$/i.test(fileName.trim())) { return true; }
            if (pdfUrl) {
                let path: string = pdfUrl.split(/[?#]/)[0];
                if (/\.zip$/i.test(path)) { return true; }
            }
            return false;
        }

        // ============ File-name resolution ============
        // Prefers the real filename from the URL basename when it already
        // carries the correct extension; only falls back to the title.
        private static deriveFileName(fileName: string, pdfUrl: string, isZip: boolean): string {
            let expectedExt: RegExp = isZip ? /\.zip$/i : /\.pdf$/i;
            let anyExt: RegExp = /\.[a-z0-9]{1,8}$/i;

            let urlBasename: string = "";
            try {
                let pathOnly: string = (pdfUrl || "").split(/[?#]/)[0];
                let segments: string[] = pathOnly.split("/");
                let last: string = segments[segments.length - 1] || "";
                try { last = decodeURIComponent(last); } catch (e) { /* ignore */ }
                urlBasename = last.trim();
            } catch (e) { /* ignore */ }

            // 1. Title already has the correct extension.
            if (fileName && expectedExt.test(fileName.trim())) {
                return fileName.trim();
            }
            // 2. URL basename has the correct extension → real filename.
            if (urlBasename && expectedExt.test(urlBasename)) {
                return urlBasename;
            }
            // 3. Title has some extension → keep as-is.
            if (fileName && anyExt.test(fileName.trim())) {
                return fileName.trim();
            }
            // 4. Fallback: strip any extension and append the correct one.
            let base: string = (fileName && fileName.trim()) || urlBasename || "document";
            base = base.replace(anyExt, "");
            return base + (isZip ? ".zip" : ".pdf");
        }

        // ============ Blob prefetch ============
        // Fetches the file as a Blob and caches it per absolute URL.
        // Safe to call multiple times — concurrent calls share the same
        // in-flight promise.
        private static prefetchBlob(url: string): Promise<Blob> {
            if (!url) { return Promise.reject(new Error("No URL")); }

            let absUrl: string;
            try { absUrl = new URL(url, window.location.href).href; }
            catch (e) { absUrl = url; }

            if (PdfViewer._prefetchedBlobs[absUrl]) {
                return Promise.resolve(PdfViewer._prefetchedBlobs[absUrl]);
            }
            if (PdfViewer._prefetchPromises[absUrl]) {
                return PdfViewer._prefetchPromises[absUrl];
            }

            let fetchPromise: Promise<Blob>;
            if (typeof fetch === "function") {
                fetchPromise = fetch(absUrl, { credentials: "same-origin" })
                    .then((res: Response) => {
                        if (!res.ok) { throw new Error("HTTP " + res.status); }
                        return res.blob();
                    });
            } else {
                fetchPromise = new Promise<Blob>((resolve, reject) => {
                    let xhr = new XMLHttpRequest();
                    xhr.open("GET", absUrl, true);
                    xhr.responseType = "blob";
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) { resolve(xhr.response); }
                        else { reject(new Error("HTTP " + xhr.status)); }
                    };
                    xhr.onerror = () => reject(new Error("Network error"));
                    xhr.send();
                });
            }

            let promise = fetchPromise
                .then((blob: Blob) => {
                    PdfViewer._prefetchedBlobs[absUrl] = blob;
                    delete PdfViewer._prefetchPromises[absUrl];
                    return blob;
                })
                .catch((err: any) => {
                    delete PdfViewer._prefetchPromises[absUrl];
                    throw err;
                });

            PdfViewer._prefetchPromises[absUrl] = promise;
            return promise;
        }

        constructor(options: any) {
            super(options);

            let pdfViewerView: PdfViewer = this;
            let pdfViewerModel: Models.PdfViewer = this.model;

            pdfViewerView._template = HBTemplates['pdf-viewer'];
            pdfViewerView.$el.addClass("modal-background fade");

            // Prefetch the blob eagerly for zip packages so the iOS share
            // sheet works when the user clicks download. If the caller
            // also calls preloadPdf() on page load, the blob will already
            // be cached by the time the click happens.
            if (PdfViewer.isZipFile(pdfViewerModel.PdfTitle, pdfViewerModel.PdfUrl)) {
                PdfViewer.prefetchBlob(pdfViewerModel.PdfUrl).catch(() => { /* ignore */ });
            }
        }

        public static preloadPdf(pdfUrl: string): void {
            if (!pdfUrl) { return; }

            let absUrl: string;
            try {
                absUrl = new URL(pdfUrl, window.location.href).href;
            } catch (e) {
                absUrl = pdfUrl;
            }

            if (PdfViewer._preloadedUrls[absUrl]) { return; }
            PdfViewer._preloadedUrls[absUrl] = true;

            try {
                let origin: string = new URL(absUrl).origin;
                if (origin && origin !== window.location.origin) {
                    PdfViewer.addLinkTag("preconnect", origin, true);
                    PdfViewer.addLinkTag("dns-prefetch", origin);
                }
            } catch (e) { /* ignore */ }

            // Prefetch the full blob so the download button click can
            // call navigator.share() synchronously (iOS requires this).
            PdfViewer.prefetchBlob(absUrl).catch(() => { /* non-fatal */ });
        }

        private static addLinkTag(rel: string, href: string, crossOrigin?: boolean): void {
            let selector: string = 'link[rel="' + rel + '"][href="' + href + '"]';
            if (document.head.querySelector(selector)) { return; }

            let link: HTMLLinkElement = document.createElement("link");
            link.rel = rel;
            link.href = href;
            if (crossOrigin) { link.crossOrigin = "anonymous"; }
            document.head.appendChild(link);
        }

        public events() {
            return <Backbone.EventsHash>{
                'click .close-modal':  'closeModal',
                'click .download-pdf': 'downloadPdf',
                'click .star':         'updateRating',
            };
        }

        public render() {
            let pdfViewerView = this,
                pdfViewerModel: Models.PdfViewer = this.model;

            pdfViewerView.$el.html(pdfViewerView._template(pdfViewerModel.toJSON()));

            if (pdfViewerModel.HasPdf) {
                pdfViewerView.initPdfJsViewer();
            }

            let storedRating = localStorage.getItem('starRating');
            if (storedRating) {
                pdfViewerModel.Rating = parseInt(storedRating, 10);
            }

            pdfViewerView.updateStars();
            return pdfViewerView;
        }

        // ==================================================================
        // PDF.js
        // ==================================================================
        private initPdfJsViewer(): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = this.model;

            pdfViewerView._pdfViewerContainer = pdfViewerView.$(".pdfjs-viewer");
            if (!pdfViewerView._pdfViewerContainer.length) { return; }

            let pdfUrl: string = pdfViewerModel.PdfUrl;
            if (!pdfUrl) {
                pdfViewerView.hidePdfLoader();
                return;
            }

            let pdfjsLib: any = (window as any).pdfjsLib;
            if (!pdfjsLib) {
                console.error("PDF.js library not loaded. Add the <script> tag for pdf.min.js in your HTML shell.");
                pdfViewerView.hidePdfLoader();
                return;
            }

            try {
                pdfjsLib.GlobalWorkerOptions.workerSrc = PdfViewer._pdfWorkerUrl;
            } catch (e) { /* ignore */ }

            pdfjsLib.getDocument(pdfUrl).promise.then((pdfDoc: any) => {
                pdfViewerView._pdfDoc = pdfDoc;
                pdfViewerView.renderAllPages();
                pdfViewerView.setupResizeObserver();
            }).catch((err: any) => {
                console.error("PDF.js load error:", err);
                pdfViewerView.hidePdfLoader();
            });
        }

        private getUsableWidth(container: JQuery): number {
            let el: HTMLElement = container[0] as HTMLElement;
            let containerWidth: number = (el && el.clientWidth)
                ? el.clientWidth
                : (container.width() || 800);

            let isMobileViewport: boolean = false;
            try {
                isMobileViewport = window.matchMedia
                    && window.matchMedia("(max-width: 768px)").matches;
            } catch (e) { /* ignore */ }

            let reserve: number = isMobileViewport
                ? PdfViewer._widthReservePxMobile
                : PdfViewer._widthReservePxDesktop;

            let usableWidth: number = containerWidth - reserve;
            if (usableWidth < 60) { usableWidth = Math.max(containerWidth, 60); }
            return usableWidth;
        }

        private renderAllPages(): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = pdfViewerView.model,
                pdfDoc = pdfViewerView._pdfDoc,
                container = pdfViewerView._pdfViewerContainer;

            if (!pdfDoc || !container.length) { return; }

            container.empty();

            let el: HTMLElement = container[0] as HTMLElement;
            pdfViewerView._lastRenderedWidth = el && el.clientWidth
                ? el.clientWidth
                : container.width();

            let renderPromises: Promise<void>[] = [];

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                let promise = pdfDoc.getPage(pageNum).then((page: any) => {
                    return pdfViewerView.renderPage(page, pageNum, container, pdfViewerModel.PdfUrl);
                });
                renderPromises.push(promise);
            }

            Promise.all(renderPromises).then(() => {
                pdfViewerView.hidePdfLoader();
            }).catch((err: any) => {
                console.error("PDF.js render error:", err);
                pdfViewerView.hidePdfLoader();
            });
        }

        private renderPage(page: any, pageNum: number, container: JQuery, pdfUrl: string): Promise<void> {
            let pdfViewerView: PdfViewer = this;

            return new Promise((resolve) => {
                let usableWidth: number = pdfViewerView.getUsableWidth(container);
                let baseViewport = page.getViewport({ scale: 1 });

                let scale: number = usableWidth / baseViewport.width;
                if (scale > PdfViewer._maxScale) { scale = PdfViewer._maxScale; }
                if (scale < PdfViewer._minScale) { scale = PdfViewer._minScale; }

                let viewport = page.getViewport({ scale: scale });

                let pageWidthPx: number = Math.floor(viewport.width);
                let pageHeightPx: number = Math.floor(viewport.height);

                if (pageWidthPx > usableWidth) {
                    scale = usableWidth / baseViewport.width;
                    viewport = page.getViewport({ scale: scale });
                    pageWidthPx = Math.floor(viewport.width);
                    pageHeightPx = Math.floor(viewport.height);
                }

                let pageWrapper: JQuery = $("<div>").addClass("pdfjs-page");
                pageWrapper.css({
                    position: "relative",
                    width: pageWidthPx + "px",
                    height: pageHeightPx + "px",
                    margin: "0 auto 10px auto",
                    background: "#fff",
                    maxWidth: "100%"
                });

                let canvas: HTMLCanvasElement = document.createElement("canvas");
                let context: CanvasRenderingContext2D = canvas.getContext("2d");
                let outputScale: number = window.devicePixelRatio || 1;

                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);
                canvas.style.width = pageWidthPx + "px";
                canvas.style.height = pageHeightPx + "px";
                canvas.style.display = "block";
                pageWrapper.append(canvas);

                let annotationLayerDiv: HTMLDivElement = document.createElement("div");
                annotationLayerDiv.className = "annotationLayer";
                annotationLayerDiv.style.position = "absolute";
                annotationLayerDiv.style.top = "0";
                annotationLayerDiv.style.left = "0";
                annotationLayerDiv.style.width = pageWidthPx + "px";
                annotationLayerDiv.style.height = pageHeightPx + "px";
                annotationLayerDiv.style.transformOrigin = "0 0";
                pageWrapper.append(annotationLayerDiv);

                container.append(pageWrapper);

                let transform: number[] = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : null;
                let renderContext: any = {
                    canvasContext: context,
                    viewport: viewport,
                    transform: transform
                };

                page.render(renderContext).promise.then(() => {
                    return page.getAnnotations({ intent: "display" }).then((annotations: any[]) => {
                        if (!annotations || annotations.length === 0) {
                            resolve();
                            return;
                        }

                        let pdfjsLib: any = (window as any).pdfjsLib;
                        if (!pdfjsLib || !pdfjsLib.AnnotationLayer) {
                            console.error("[PDF.js] AnnotationLayer is not available.");
                            resolve();
                            return;
                        }

                        let linkService: any = pdfViewerView.createLinkService(pdfjsLib);

                        try {
                            let annotationLayerInstance: any = null;

                            try {
                                annotationLayerInstance = new pdfjsLib.AnnotationLayer({
                                    div: annotationLayerDiv,
                                    accessibilityManager: null,
                                    annotationCanvasMap: null,
                                    page: page,
                                    viewport: viewport.clone({ dontFlip: true }),
                                });
                            } catch (ctorErr) {
                                if (typeof pdfjsLib.AnnotationLayer.render === "function") {
                                    pdfjsLib.AnnotationLayer.render({
                                        annotations: annotations,
                                        div: annotationLayerDiv,
                                        page: page,
                                        viewport: viewport.clone({ dontFlip: true }),
                                        linkService: linkService,
                                        renderForms: false,
                                        enableScripting: false
                                    });
                                    pdfViewerView.finalizeAnnotationLinks(annotationLayerDiv, pdfUrl, pageNum);
                                    resolve();
                                    return;
                                }
                                throw ctorErr;
                            }

                            let renderResult: any = annotationLayerInstance.render({
                                annotations: annotations,
                                div: annotationLayerDiv,
                                page: page,
                                viewport: viewport.clone({ dontFlip: true }),
                                linkService: linkService,
                            });

                            if (renderResult && typeof renderResult.then === "function") {
                                renderResult.then(() => {
                                    pdfViewerView.finalizeAnnotationLinks(annotationLayerDiv, pdfUrl, pageNum);
                                    resolve();
                                }).catch((err: any) => {
                                    console.error(`[PDF.js] AnnotationLayer.render failed on page ${pageNum}:`, err);
                                    resolve();
                                });
                            } else {
                                pdfViewerView.finalizeAnnotationLinks(annotationLayerDiv, pdfUrl, pageNum);
                                resolve();
                            }
                        } catch (e) {
                            console.error(`[PDF.js] AnnotationLayer render FAILED on page ${pageNum}:`, e);
                            resolve();
                        }
                    });
                }).catch((err) => {
                    console.error(`[PDF.js] Page ${pageNum} render failed:`, err);
                    resolve();
                });
            });
        }

        private setupResizeObserver(): void {
            let pdfViewerView: PdfViewer = this,
                container = pdfViewerView._pdfViewerContainer;

            if (!container || !container.length) { return; }

            if (pdfViewerView._resizeObserver) {
                try { pdfViewerView._resizeObserver.disconnect(); } catch (e) { /* ignore */ }
                pdfViewerView._resizeObserver = null;
            }

            if (typeof (window as any).ResizeObserver === "undefined") { return; }

            pdfViewerView._resizeObserver = new (window as any).ResizeObserver((entries: any[]) => {
                for (let entry of entries) {
                    let newWidth: number = Math.round(entry.contentRect.width);
                    if (Math.abs(newWidth - pdfViewerView._lastRenderedWidth) < 6) { continue; }

                    if (pdfViewerView._resizeTimer !== null) {
                        window.clearTimeout(pdfViewerView._resizeTimer);
                    }
                    pdfViewerView._resizeTimer = window.setTimeout(() => {
                        pdfViewerView._resizeTimer = null;
                        if (pdfViewerView._pdfDoc) {
                            pdfViewerView.renderAllPages();
                        }
                    }, 250);
                }
            });

            pdfViewerView._resizeObserver.observe(container[0]);
        }

        private createLinkService(pdfjsLib: any): any {
            try {
                let pdfjsViewer: any = (window as any).pdfjsViewer;
                if (pdfjsViewer && typeof pdfjsViewer.SimpleLinkService === "function") {
                    return new pdfjsViewer.SimpleLinkService();
                }
            } catch (e) { /* keep trying */ }

            try {
                if (pdfjsLib && typeof pdfjsLib.SimpleLinkService === "function") {
                    return new pdfjsLib.SimpleLinkService();
                }
            } catch (e) { /* keep trying */ }

            console.warn("[PDF.js] Using fallback linkService shim.");
            let externalLinkTarget: number = (pdfjsLib && pdfjsLib.LinkTarget)
                ? pdfjsLib.LinkTarget.BLANK
                : 2;

            let shim: any = {
                externalLinkTarget: externalLinkTarget,
                externalLinkRel: "noopener noreferrer nofollow",
                externalLinkEnabled: true,

                addLinkAttributes: function (link: HTMLAnchorElement, url: string, newWindow?: boolean) {
                    if (!url || typeof url !== "string") { return; }
                    link.href = url;
                    link.target = (newWindow === false) ? "" : "_blank";
                    link.rel = "noopener noreferrer nofollow";
                },

                getDestinationHash: function () { return ""; },
                getAnchorUrl: function () { return ""; },
                setHash: function () { /* no-op */ },
                executeNamedAction: function () { /* no-op */ },
                executeAction: function () { /* no-op */ },
                isPageVisible: function () { return true; },
                isDestVisible: function () { return true; },
                navigateTo: function () { /* no-op */ },
                navigateToDestination: function () { /* no-op */ }
            };

            try {
                Object.defineProperty(shim, "pagesCount", { get: function () { return 0; } });
                Object.defineProperty(shim, "page", {
                    get: function () { return 0; },
                    set: function (_v: number) { /* no-op */ }
                });
                Object.defineProperty(shim, "rotation", {
                    get: function () { return 0; },
                    set: function (_v: number) { /* no-op */ }
                });
            } catch (e) { /* ignore */ }

            return shim;
        }

        private finalizeAnnotationLinks(annotationLayerDiv: HTMLDivElement, pdfUrl: string, pageNum: number): void {
            let $links: JQuery = $(annotationLayerDiv).find("a");

            $links.each(function () {
                let $link: JQuery = $(this);
                let href: string = $link.attr("href");

                if (href && !/^(https?:|mailto:|tel:|#)/i.test(href)) {
                    try {
                        $link.attr("href", new URL(href, new URL(pdfUrl, window.location.href)).href);
                    } catch (e) { /* ignore */ }
                }

                $link.attr("target", "_blank");
                $link.attr("rel", "noopener noreferrer");
            });
        }

        private hidePdfLoader(): void {
            let pdfViewerView: PdfViewer = this,
                $loader: JQuery = pdfViewerView.$(".pdf-loader");

            if ($loader.length) {
                $loader.addClass("hidden");
                window.setTimeout(() => { $loader.remove(); }, 300);
            }
        }

        public showModal(): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = pdfViewerView.model;

            // ZIP packages bypass the modal entirely.
            if (PdfViewer.isZipFile(pdfViewerModel.PdfTitle, pdfViewerModel.PdfUrl)) {
                pdfViewerView.downloadPdf();
                pdfViewerView.trigger(Events.EVENT_MODAL_CLOSED, "close");
                pdfViewerView.destroy();
                return;
            }

            $("body").append(pdfViewerView.render().$el.addClass("in"));
        }

        // ==================================================================
        // DOWNLOAD
        // ==================================================================
        public downloadPdf(evt?: Event): void {
            if (evt) { evt.preventDefault(); evt.stopPropagation(); }

            // Re-entrancy guard — one download per view instance.
            if (this._downloadStarted) { return; }
            this._downloadStarted = true;

            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = this.model,
                pdfUrl: string = pdfViewerModel.PdfUrl;

            if (!pdfUrl) {
                this._downloadStarted = false;
                return;
            }

            // Resolve the real filename (URL basename wins when it has
            // the correct extension — so ".../bundle-v2.zip" downloads
            // as "bundle-v2.zip", not the friendly title).
            let isZip: boolean = PdfViewer.isZipFile(pdfViewerModel.PdfTitle, pdfUrl);
            let fileName: string = PdfViewer.deriveFileName(
                pdfViewerModel.PdfTitle,
                pdfUrl,
                isZip
            );

            let absUrl: string;
            try { absUrl = new URL(pdfUrl, window.location.href).href; }
            catch (e) { absUrl = pdfUrl; }

            // ---- Fast path: use prefetched blob ----
            // Runs synchronously from the click handler, so iOS still
            // sees the transient user activation and the FULL share
            // sheet appears for zips too (AirDrop, Messages, Mail, …).
            let cachedBlob: Blob = PdfViewer._prefetchedBlobs[absUrl];
            if (cachedBlob) {
                pdfViewerView.saveBlob(cachedBlob, fileName);
                return;
            }

            // ---- Slow path: fetch then save ----
            // On iOS the share sheet will fail here (activation expired)
            // and we fall back to anchor download ("Save to Files").
            pdfViewerView.fetchAsBlob(absUrl)
                .then((blob: Blob) => {
                    PdfViewer._prefetchedBlobs[absUrl] = blob;
                    pdfViewerView.saveBlob(blob, fileName);
                })
                .catch((err: any) => {
                    console.warn("[PdfViewer] Blob download failed, falling back to direct anchor:", err);
                    pdfViewerView.triggerDirectDownload(absUrl, fileName);
                });
        }

        private fetchAsBlob(url: string): Promise<Blob> {
            return PdfViewer.prefetchBlob(url);
        }

        /**
         * Saves the Blob to disk / share sheet.
         *
         * iOS: Web Share API gives the full native share sheet (AirDrop,
         * Messages, Mail, Save to Files, …). It requires transient user
         * activation, so this works only when the blob is already in
         * memory (prefetched). If share() still rejects for any reason
         * other than an explicit user cancel (AbortError), we fall back
         * to a blob-URL anchor download — which on iOS Safari 13+ also
         * shows "Save to Files".
         */
        private saveBlob(blob: Blob, fileName: string): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = pdfViewerView.model;

            let blobUrl: string;
            try {
                blobUrl = URL.createObjectURL(blob);
            } catch (e) {
                pdfViewerView.triggerDirectDownload(pdfViewerModel.PdfUrl, fileName);
                return;
            }

            let nav: any = window.navigator as any;
            let mimeType: string = PdfViewer.isZipFile(fileName, pdfViewerModel.PdfUrl)
                ? "application/zip"
                : "application/pdf";

            // iOS: try Web Share first (native share sheet + Save to Files).
            if (pdfViewerModel.IsIos && nav &&
                typeof nav.canShare === "function" &&
                typeof nav.share === "function") {
                try {
                    let file: File = new File([blob], fileName, { type: mimeType });

                    if (nav.canShare({ files: [file] })) {
                        nav.share({ files: [file], title: fileName })
                            .then(() => {
                                window.setTimeout(() => {
                                    try { URL.revokeObjectURL(blobUrl); } catch (e) { /* ignore */ }
                                }, 60000);
                            })
                            .catch((err: any) => {
                                if (err && err.name === "AbortError") {
                                    // User dismissed the share sheet.
                                    try { URL.revokeObjectURL(blobUrl); } catch (e) { /* ignore */ }
                                    return;
                                }

                                // NotAllowedError (activation expired) or
                                // any other failure — fall back to anchor
                                // ("Save to Files" on iOS 13+).
                                console.warn(
                                    "[PdfViewer] iOS Web Share failed, falling back to anchor:",
                                    err
                                );
                                pdfViewerView.triggerAnchorDownload(blobUrl, fileName);
                                window.setTimeout(() => {
                                    try { URL.revokeObjectURL(blobUrl); } catch (e) { /* ignore */ }
                                }, 60000);
                            });
                        return;
                    }
                } catch (e) {
                    console.warn("[PdfViewer] iOS share path threw, falling back to anchor:", e);
                }
            }

            // Desktop + Android + iOS (no share support or after failure).
            pdfViewerView.triggerAnchorDownload(blobUrl, fileName);

            window.setTimeout(() => {
                try { URL.revokeObjectURL(blobUrl); } catch (e) { /* ignore */ }
            }, 60000);
        }

        private triggerAnchorDownload(href: string, fileName: string): void {
            let link: HTMLAnchorElement = document.createElement("a");
            link.href = href;
            link.download = fileName;
            link.rel = "noopener";
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        private triggerDirectDownload(url: string, fileName: string): void {
            let pdfViewerModel: Models.PdfViewer = this.model;

            if (!url) { url = pdfViewerModel.PdfUrl; }
            if (!url) { return; }

            let link: HTMLAnchorElement = document.createElement("a");
            link.href = url;
            link.download = fileName;
            if (!pdfViewerModel.IsIos) {
                link.target = "_blank";
            }
            link.rel = "noopener noreferrer";
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // ==================================================================
        // CLOSE / TEARDOWN
        // ==================================================================
        public closeModal(evt?: MouseEvent): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = this.model,
                $btn, btnId: string;

            if (evt) {
                $btn = $(evt.currentTarget);
                btnId = $btn.attr("data-id");
            }

            if (pdfViewerModel.Progressbar) {
                pdfViewerView.resetProgressBar();
            }

            pdfViewerView.teardownResizeObserver();

            if (pdfViewerView._pdfDoc) {
                try { pdfViewerView._pdfDoc.destroy(); } catch (e) { /* ignore */ }
                pdfViewerView._pdfDoc = null;
            }

            pdfViewerView.trigger(Events.EVENT_MODAL_CLOSED, btnId);
            pdfViewerView.$el.removeClass("in");
            pdfViewerView.destroy();
        }

        private teardownResizeObserver(): void {
            let pdfViewerView: PdfViewer = this;

            if (pdfViewerView._resizeTimer !== null) {
                window.clearTimeout(pdfViewerView._resizeTimer);
                pdfViewerView._resizeTimer = null;
            }

            if (pdfViewerView._resizeObserver) {
                try { pdfViewerView._resizeObserver.disconnect(); } catch (e) { /* ignore */ }
                pdfViewerView._resizeObserver = null;
            }
        }

        public updateProgress(text: string, successPercent: number, failedPercent: number): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = this.model,
                $progressBarSuccess: JQuery = pdfViewerView.$(".progress-bar.progress-bar-success"),
                $progressBarFailed: JQuery = pdfViewerView.$(".progress-bar.progress-bar-danger"),
                $bodyText: JQuery = pdfViewerView.$(".modal-body .progress-text .progress-text-content");

            $progressBarSuccess.css('width', successPercent + '%').html(successPercent > 5 ? successPercent + '%' : '');
            $progressBarFailed.css('width', failedPercent + '%').html(failedPercent > 2 ? failedPercent + '%' : '');

            pdfViewerModel.Content = text;
            $bodyText.html(text);
        }

        public resetProgressBar(): void {
            let pdfViewerView: PdfViewer = this,
                pdfViewerModel: Models.PdfViewer = pdfViewerView.model,
                $progressBarSuccess: JQuery = pdfViewerView.$(".progress-bar.progress-bar-success"),
                $progressBarFailed: JQuery = pdfViewerView.$(".progress-bar.progress-bar-danger"),
                $bodyText: JQuery = pdfViewerView.$(".modal-body .modal-body-text");

            pdfViewerModel.Content = "";

            $progressBarSuccess.css('width', 0 + '%').html('');
            $progressBarFailed.css('width', 0 + '%').html('');
            $bodyText.html('');
        }

        private updateStars(): void {
            let pdfViewerView = this,
                pdfViewerModel: Models.PdfViewer = this.model;

            pdfViewerView.$('.star').each((index, element) => {
                let $star = $(element);
                let value = parseInt($star.attr('data-value')!, 10);

                if (value <= pdfViewerModel.Rating) {
                    $star.addClass('selected');
                } else {
                    $star.removeClass('selected');
                }
            });
            this.$('.rating-text').html(`You rated ${pdfViewerModel.Rating} star${pdfViewerModel.Rating > 1 ? 's' : ''}`);
        }

        private updateRating(evt: Event): void {
            let pdfViewerView = this,
                pdfViewerModel: Models.PdfViewer = this.model;

            let $star = $(evt.currentTarget);
            pdfViewerModel.Rating = parseInt($star.attr('data-value')!, 10);

            localStorage.setItem('starRating', pdfViewerModel.Rating.toString());

            this.updateStars();

            pdfViewerModel.set('rating', pdfViewerModel.Rating);

            this.$('.rating-text').html(`You rated ${pdfViewerModel.Rating} star${pdfViewerModel.Rating > 1 ? 's' : ''}`);
        }

        public destroy(): void {
            let pdfViewerView: PdfViewer = this;

            pdfViewerView.teardownResizeObserver();

            if (pdfViewerView._pdfDoc) {
                try { pdfViewerView._pdfDoc.destroy(); } catch (e) { /* ignore */ }
                pdfViewerView._pdfDoc = null;
            }

            pdfViewerView.unbind();
            pdfViewerView.$el.html("");
            pdfViewerView.$el.empty();
            pdfViewerView.remove();
        }
    }
}