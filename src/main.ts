import fileItemFactory from './file-item.factory';
import { PlotData, SliderHistogramComponent } from './slider-histogram.component';
import { Complexity } from './complexity';
import { ComplexityFile } from './complexity-file';
import throttle from 'lodash.throttle';
import { ScoreFormComponent } from './score-form.component';

type Size = 'xsList' | 'sList' | 'mList' | 'lList' | 'xlList';

interface MetaData {
    count: number;
    min: number;
    max: number;
}

const selectFilesElement = document.querySelector('.select-files') as HTMLInputElement;
const filesElement = document.querySelector('.files__list') as HTMLUListElement;
const fileTemplateElement = document.querySelector('.files__item-template') as HTMLTemplateElement;
const renderFileItem = fileItemFactory(fileTemplateElement);

const metaFileCountElement = document.querySelector('.meta__file-count') as HTMLSpanElement;
const metaMinScoreElement = document.querySelector('.meta__min-score') as HTMLSpanElement;
const metaMaxScoreElement = document.querySelector('.meta__max-score') as HTMLSpanElement;

const xsListElement = document.querySelector('.xs__list') as HTMLOListElement;
const sListElement = document.querySelector('.s__list') as HTMLOListElement;
const mListElement = document.querySelector('.m__list') as HTMLOListElement;
const lListElement = document.querySelector('.l__list') as HTMLOListElement;
const xlListElement = document.querySelector('.xl__list') as HTMLOListElement;

SliderHistogramComponent.define();
const sliderHistogram = document.querySelector('slider-histogram') as SliderHistogramComponent;

ScoreFormComponent.define();
const scoreForm = document.querySelector('score-form') as ScoreFormComponent;

let data: Complexity[] = [];
let plotData: PlotData = {
    scores: [],
    max: 0
};

sliderHistogram.addEventListener('update', throttle((event) => {
    const sliders = event.detail.map((slider: number) => Math.round(slider));

    scoreForm.scores = sliders;
    renderLists(convertToLists(data, sliders));
}, 250) as EventListener);

scoreForm.addEventListener('update', throttle((event) => {
    const sliders = event.detail;

    sliderHistogram.sliders = sliders;
    renderLists(convertToLists(data, sliders));
}, 250) as EventListener);

function calculatePlotData(data: Complexity[]): PlotData {
    return data.reduce(({scores, max}: PlotData, {score}: Complexity) => {
        let scoreCounter = scores.find(([s]) => s === score);

        if (scoreCounter) {
            // Update counter
            scoreCounter = [score, scoreCounter[1] + 1];
        } else {
            // Set counter
            scoreCounter = [score, 1];
        }

        return {
            scores: [
                ...scores.filter(([s]) => s !== score),
                scoreCounter
            ],
            max: max > score ? max : score
        };
    }, {scores: [], max: 0});
}

function renderMetadata({count, min, max}: MetaData) {
    metaFileCountElement.innerText = `${count}`;
    metaMinScoreElement.innerText = `${min}`;
    metaMaxScoreElement.innerText = `${max}`;
}

selectFilesElement.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const rawFiles = [...(target.files as FileList)]
        .filter(({type}) => type === 'text/csv')
        .map(file => new ComplexityFile(file))
        .map(async file => await file.parse());

    const parsedFiles = await Promise.all(rawFiles);
    const files = parsedFiles.filter(file => file.isValid());

    filesElement.replaceChildren(...files.map(file => renderFileItem(file)));

    data = files.map(file => file.data)
        .flat()
        .filter(({file}) => file.length > 0)
        .sort((a, b) => a.score - b.score);

    const metaData = data
        .reduce(({count, min, max}, {score}) => {
            return {
                count: count + 1,
                min: score < min ? score : min,
                max: score > max ? score : max
            };
        }, {count: 0, min: Infinity, max: 0});

    renderMetadata(metaData);

    plotData = calculatePlotData(data);

    sliderHistogram.plotData = plotData;
    const sliders = [
        1,
        plotData.max / 5,
        plotData.max / 5 * 2,
        plotData.max / 5 * 3,
        plotData.max / 5 * 4,
        plotData.max
    ];
    sliderHistogram.sliders = sliders;

    renderLists(convertToLists(data, sliders));
    scoreForm.max = plotData.max;
    scoreForm.scores = sliders.map((slider: number) => Math.round(slider));
});

function renderLiItem(complexity: Complexity): HTMLLIElement {
    const itemElement = document.createElement('li');
    itemElement.innerText = `${complexity.file} ${complexity.score}`;

    return itemElement;
}

function renderLists(lists: Record<Size, Complexity[]>) {
    const xsItemElements = lists.xsList.map(renderLiItem);
    const sItemElements = lists.sList.map(renderLiItem);
    const mItemElements = lists.mList.map(renderLiItem);
    const lItemElements = lists.lList.map(renderLiItem);
    const xlItemElements = lists.xlList.map(renderLiItem);

    xsListElement.replaceChildren(...xsItemElements);
    sListElement.replaceChildren(...sItemElements);
    mListElement.replaceChildren(...mItemElements);
    lListElement.replaceChildren(...lItemElements);
    xlListElement.replaceChildren(...xlItemElements);
}

function convertToLists(data: Complexity[], [aSlider, bSlider, cSlider, dSlider, eSlider, fSlider]: number[]): Record<Size, Complexity[]> {
    return data.reduce((acc: Record<string, (Complexity)[]>, complexity: Complexity) => {
        const {score} = complexity;
        let key;

        if (score >= aSlider && score < bSlider) {
            key = 'xsList';

        } else if (score >= bSlider && score < cSlider) {
            key = 'sList';

        } else if (score >= cSlider && score < dSlider) {
            key = 'mList';

        } else if (score >= dSlider && score < eSlider) {
            key = 'lList';

        } else if (score >= eSlider && score <= fSlider) {
            key = 'xlList';

        } else {
            return acc;
        }

        return {...acc, [key]: [...acc[key], complexity]};
    }, {
        xsList: [],
        sList: [],
        mList: [],
        lList: [],
        xlList: [],
    });
}
