export class Scale {
    get maxScore(): number {
        return this.#maxScore;
    }
    get width(): number {
        return this.#width;
    }
    #scale = 1;
    #maxScore = 1;
    #width = 1;

    setMaxScore(maxScore: number) {
        this.#maxScore = maxScore;
        this.#scale = this.#width / maxScore;
    }

    setWidth(width: number): void {
        this.#width = width;
        this.#scale = width / this.#maxScore;
    }

    getPosition(score: number): number {
        return score * this.#scale;
    }

    getScore(position: number): number {
        return position / this.#scale;
    }
}
