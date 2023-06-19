export class CenterTextOverflow extends HTMLElement {

  #root: ShadowRoot;
  #left: HTMLSpanElement;
  #right: HTMLSpanElement;

  constructor() {
    super();

    const left = document.createElement('span');
    left.classList.add('left');
    const right = document.createElement('div');
    right.classList.add('right');

    const css = `
        :host{
            display: flex;
        }
        .left{
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: pre;
        }
        .right{
            flex: 1 0 auto;
            overflow: hidden;
        }
        `;
    const cssElement = document.createElement('style');
    cssElement.textContent = css;

    this.#root = this.attachShadow({mode: 'open'});
    this.#root.append(cssElement, left.cloneNode(true), right.cloneNode(true));

    this.#left = this.#root.querySelector('.left') as HTMLSpanElement;
    this.#right = this.#root.querySelector('.right') as HTMLSpanElement;
  }

  connectedCallback(): void {
    const text = this.getAttribute('title')?.valueOf() ?? '';
    let splitIndex = 0;

    if (this.hasAttribute('split-at-part')) {
      const splitAt = Number(this.getAttribute('split-at-part')?.valueOf());
      const splitFrom = this.getAttribute('split-from')?.valueOf() ?? 'start';

      if (!isNaN(splitAt)) {
        splitIndex = Math.round(text.length * splitAt);

        if (this.hasAttribute('split-from')) {
          if (splitFrom === 'end') {
            splitIndex = text.length - splitIndex;
          }
        }
      }

    }

    if (this.hasAttribute('split-at-character')) {
      const splitAt = this.getAttribute('split-at-character')?.valueOf() ?? '';
      const splitFrom = this.getAttribute('split-from')?.valueOf() ?? 'start';

      if (splitFrom === 'end') {
        const textArray = text.split('');

        splitIndex = textArray.findLastIndex((character: string) => character === splitAt);
      } else {
        // from start
        splitIndex = text.indexOf(splitAt);
      }
    }

    this.#left.innerText = text.slice(0, splitIndex);
    this.#right.innerText = text.slice(splitIndex);
  }

  static define() {
    window.customElements.define('center-text-overflow', CenterTextOverflow);
  }
}
