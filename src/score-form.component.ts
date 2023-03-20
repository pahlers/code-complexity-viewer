import { SliderHistogramComponent } from "./slider-histogram.component";

export class ScoreFormComponent extends HTMLElement {
    set max(max: number) {
        this.#max = max;
    }

    set scores(scores: number[]) {
        this.#scores = [...scores].sort((a, b) => a - b);

        if (this.#form.hasChildNodes()) {
            this.#scores.forEach((score: number, index: number, list: number[]) => this.#updateScoreInputElement(score, index, list));

        } else {
            this.#form.replaceChildren(...this.#scores.map((score: number, index: number, list: number[]) => this.#renderScoreInputElement(score, index, list)));
        }
    }

    #form: HTMLFormElement;
    #root: ShadowRoot;

    #scores: number[] = [];
    #max = 0;

    constructor() {
        super();

        const template = document.createElement('form');

        const css = `
        :host{
            display: block;
        }
        form {
            display: flex;
            gap: 1rem;
        }
        input {
            flex-grow: 1;
        }
        `;
        const cssElement = document.createElement('style');
        cssElement.textContent = css;

        this.#root = this.attachShadow({mode: 'open'});
        this.#root.append(cssElement, template.cloneNode(true));
        this.#form = this.#root.querySelector('form') as HTMLFormElement;
    }

    connectedCallback(): void {
        this.#form.addEventListener('change', event => this.#update(event));
        this.#form.addEventListener('blur', event => this.#update(event));
    }

    disconnectedCallback(): void {
        this.#form.removeEventListener('change', event => this.#update(event));
        this.#form.removeEventListener('blur', event => this.#update(event));
    }

    #update(event: Event): void {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        const index = parseInt(target.dataset.index ?? '-1');

        if (SliderHistogramComponent.insideBoundary(this.#scores[index - 1] ?? 1, this.#scores[index + 1] ?? this.#max, value)) {
            this.#scores[index] = value;

            const scoreElementBefore = this.#form.querySelector(`[data-index="${index - 1}"]`);

            if (scoreElementBefore) {
                (scoreElementBefore as HTMLInputElement).max = `${value}`;
            }

            const scoreElementAfter = this.#form.querySelector(`[data-index="${index + 1}"]`);

            if (scoreElementAfter) {
                (scoreElementAfter as HTMLInputElement).min = `${value}`;
            }
        }

        this.#emitEvent(this.#scores);
    }

    #emitEvent(scores: number[]): void {
        const updateEvent = new CustomEvent('update', {
            detail: [...scores]
        });

        this.dispatchEvent(updateEvent);
    }

    #renderScoreInputElement(score: number, index: number, list: number[]): HTMLInputElement {
        const element = document.createElement('input');
        element.type = 'number';

        element.min = `${list[index - 1] ?? 1}`;
        element.max = `${list[index + 1] ?? this.#max}`;

        element.value = `${score}`;
        element.dataset.index = `${index}`;

        return element;
    }

    #updateScoreInputElement(score: number, index: number, list: number[]): void {
        const element = this.#form.querySelector(`[data-index="${index}"]`) as HTMLInputElement;

        element.min = `${list[index - 1] ?? 1}`;
        element.max = `${list[index + 1] ?? this.#max}`;

        element.value = `${score}`;
    }

    static define() {
        window.customElements.define('score-form', ScoreFormComponent);
    }
}
