import { Scale } from './scale';

interface Rect {
    width: number;
    height: number;
}

export interface PlotData {
    scores: [number, number][];
    max: number;
}

export class SliderHistogramComponent extends HTMLElement {
    set sliders(sliders: number[]) {
        this.#sliders = [...sliders].sort((a, b) => a - b);
    }

    set plotData({scores, max}: PlotData) {
        this.#scale.setMaxScore(max);
        this.#plotData = scores;
    }

    #root: ShadowRoot;

    #plotData: [number, number][] = [];
    #sliders: number[] = [];
    #scale: Scale = new Scale();
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;
    #boundingClientRect: Rect = {width: 0, height: 0};
    #animationFrameNumber = -1;
    #slider = -1;
    #dragging = false;

    constructor() {
        super();

        const template = document.createElement('canvas');
        const css = `
        :host{
            display: block;
        }
        canvas {
              width: 100%;
              height: 25vw;

              cursor: grab;
        }
        `;
        const cssElement = document.createElement('style');
        cssElement.textContent = css;

        this.#root = this.attachShadow({mode: 'open'});
        this.#root.append(cssElement, template.cloneNode(true));
        this.#canvas = this.#root.querySelector('canvas') as HTMLCanvasElement;
        this.#ctx = this.#canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    connectedCallback(): void {
        this.#updateWidthAndHeight();

        // add events
        this.#canvas.addEventListener('pointermove', (event) => this.#moveSlider(event));
        // this.#canvas.addEventListener('pointerup', () => this.#emitEvent());
        window.addEventListener('resize', () => this.#updateWidthAndHeight());
        this.#animationFrameNumber = window.requestAnimationFrame(() => this.#animationFrame());
    }

    disconnectedCallback(): void {
        // remove events
        this.#canvas.removeEventListener('pointermove', (event) => this.#moveSlider(event));
        // this.#canvas.removeEventListener('pointerup', () => this.#emitEvent());
        window.removeEventListener('resize', () => this.#updateWidthAndHeight());
        window.cancelAnimationFrame(this.#animationFrameNumber);
    }

    #updateWidthAndHeight(): void {
        const {width, height} = this.#canvas.getBoundingClientRect();
        this.#boundingClientRect = {width, height};

        this.#scale.setWidth(width);
        this.#canvas.width = width;
        this.#canvas.height = height;
    }

    #animationFrame(): void {
        const {width, height} = this.#boundingClientRect;
        this.#ctx.clearRect(0, 0, width, height);
        this.#ctx.fillStyle = 'green';

        this.#plotData.forEach(([score, count]) => {
            count = count * 2;
            this.#ctx.fillRect(Math.min(this.#scale.getPosition(score), width - 2), (height - count), 2, count);
        });

        this.#ctx.fillStyle = 'black';

        this.#sliders.forEach(score => {
            this.#ctx.fillRect(Math.min(this.#scale.getPosition(score), width - 2), 0, 2, height);
        });

        this.#animationFrameNumber = window.requestAnimationFrame(() => this.#animationFrame());
    }

    #moveSlider(event: PointerEvent): void {
        const {offsetX, buttons} = event;
        this.#canvas.style.cursor = 'initial';

        if (this.#slider === -1) {
            this.#slider = this.#sliders.findIndex(x => {
                const position = this.#scale.getPosition(x);
                return offsetX >= position - 4 && offsetX <= position + 6;
            });
        }

        if (this.#slider >= 0) {
            this.#canvas.style.cursor = 'grab';
            this.#dragging = (buttons === 1);
        }

        if (this.#dragging) {
            this.#canvas.style.cursor = 'grabbing';

            if (SliderHistogramComponent.insideBoundary(
                this.#sliders[this.#slider - 1] ? this.#scale.getPosition(this.#sliders[this.#slider - 1]) : 0,
                this.#sliders[this.#slider + 1] ? this.#scale.getPosition(this.#sliders[this.#slider + 1]) : this.#boundingClientRect.width,
                offsetX
            )) {
                this.#sliders[this.#slider] = this.#scale.getScore(offsetX);

                this.#emitEvent(this.#sliders);
            }
        } else {
            this.#dragging = false;
            this.#slider = -1;
        }
    }

    #emitEvent(sliders: number[]): void {
        const updateEvent = new CustomEvent('update', {
            detail: [...sliders]
        });

        this.dispatchEvent(updateEvent);
    }

    static insideBoundary(left: number, right: number, offset: number): boolean {
        return left < offset && right > offset;
    }

    static define() {
        window.customElements.define('slider-histogram', SliderHistogramComponent);
    }
}
