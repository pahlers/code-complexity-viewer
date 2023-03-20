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

    constructor(amountSliders: number, width: number) {
        amountSliders = amountSliders - 1;

        this.#width = width;

        this.#sliders = Array.from({length: amountSliders})
            .map((_, index) => Math.floor((width / amountSliders) * index));

        this.#sliders = [...this.#sliders, width - 2]; // Add last slider
    }

    update(slider: number, position: number): void {
        if (this.#sliders[slider] !== undefined) {
            this.#sliders[slider] = position;
        }
    }

    getScores(max: number): number[] {
        return this.#sliders.map(slider => Math.floor(slider * (max / this.#width)));
    }

    setScores(max: number, scores: number[]): void {
        this.#sliders = scores.map(score => score / (max / this.#width));
    }

    static insideBoundary(left: number, right: number, offset: number): boolean {
        return left < offset && right > offset;
    }
}
