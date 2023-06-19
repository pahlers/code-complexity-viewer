import { SliderHistogramComponent } from '../slider-histogram/slider-histogram.component';

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
  #shadowRoot: ShadowRoot;

  #scores: number[] = [];
  #max = 0;

  constructor() {
    super();

    const template = document.createElement('form');

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
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
        `);

    this.#shadowRoot = this.attachShadow({mode: 'open'});
    this.#shadowRoot.adoptedStyleSheets = [sheet];
    this.#shadowRoot.append(template.cloneNode(true));
    this.#form = this.#shadowRoot.querySelector('form') as HTMLFormElement;
  }

  connectedCallback(): void {
    this.#form.addEventListener('change', this.#update);
    this.#form.addEventListener('blur', this.#update);
  }

  disconnectedCallback(): void {
    this.#form.removeEventListener('change', this.#update);
    this.#form.removeEventListener('blur', this.#update);
  }

  #update = (event: Event): void => {
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
