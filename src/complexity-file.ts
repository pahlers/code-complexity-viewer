import { Complexity, ComplexityFileData } from './complexity';

export class ComplexityFile {
  get size(): number {
    return this.#size;
  }

  get file(): File {
    return this.#file;
  }

  get name(): string {
    return this.#name;
  }

  get data(): Complexity[] {
    return this.#data;
  }

  #text = '';
  #valid = false;
  #data: Complexity[] = [];
  #file: File;
  #name: string;
  #size: number;

  constructor(file: File) {
    this.#file = file;
    this.#name = file.name;
    this.#size = file.size;
  }

  async parse(): Promise<this> {
    this.#text = await this.#file.text();

    try {
      this.#data = (JSON.parse(this.#text) as ComplexityFileData[])
        .map((metrics): Complexity => {
            const {
              path: file,
              maintainability: {maximum: {volume = 0, cyclomatic = 0}, sloc = 0},
            } = metrics;

            const score = sloc === 0 ? 0 : (5.2 * Math.log(volume)) + (0.23 * cyclomatic) + (16.2 * Math.log(sloc));

            return {
              file,
              module: this.#name,
              maintainability: {
                score,
                volume,
                cyclomatic,
                sloc
              },
              _metrics: metrics
            };
          }
        );

      this.#valid = true;
    } catch (error) {
      console.error('[ComplexityFile] parse', error);

      this.#valid = false;
    }

    return this;
  }

  isValid(): boolean {
    return this.#valid;
  }
}
