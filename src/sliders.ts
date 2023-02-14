export class Sliders {
    set width(value: number) {
        const delta = value / this.#width;

        this.#width = value;
        this.#sliders = this.#sliders.map(position => Math.floor(position * delta));
    }

    #width: number;

    get sliders(): number[] {
        return this.#sliders;
    }

    #sliders: number[] = [];

    constructor(parts: number, width: number) {
        this.#width = width;
        this.#sliders = Array.from({length: parts})
            .map((_, index) => Math.floor((width / parts) * index));
        this.#sliders = [...this.#sliders, width]; // Add last slider
    }

    update(slider: number, position: number) {
        if (this.#sliders[slider] !== undefined) {
            this.#sliders[slider] = position;
        }
    }

    static insideBoundary(left: number, right: number, offset: number): boolean {
        return left < offset && right > offset;
    }
}
