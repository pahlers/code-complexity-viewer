import {Complexity} from './complexity';

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
        this.#valid = this.#text.startsWith('file,complexity,churn,score');

        this.#data = this.#text.split('\n')
            .filter(row => !row.startsWith('file,complexity,churn,score')) // remove header
            .map(row => row.split(','))
            .map(([file, complexity, churn, score]): Complexity => ({
                    file,
                    complexity: parseInt(complexity),
                    churn: parseInt(churn),
                    score: parseInt(score)
                })
            );

        return this;
    }

    isValid(): boolean {
        return this.#valid;
    }
}
