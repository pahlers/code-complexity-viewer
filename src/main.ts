import 'toolcool-range-slider';
import { Complexity } from './complexity';
import { ComplexityFile } from './complexity-file';
import fileItemFactory from './file-item.factory';
import { Sliders } from "./sliders";

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

const canvasElement = document.querySelector('.slider') as HTMLCanvasElement;

// Set pixels in canvas
let {width, height} = canvasElement.getBoundingClientRect();
canvasElement.width = width;
canvasElement.height = height;

let data: Complexity[] = [];
let plotData: Record<string, number> = {};
let metaData: MetaData = {count: 0, min: 0, max: 0};
let sliders: Sliders = new Sliders(5, width);
let slider = -1;
let dragging = false;

function calculatePlotData(data: Complexity[], width: number, max: number): Record<string, number> {
    const plotBarSize = Math.max(Math.floor(max / width), 1) * 2; // Multiply by two to be able to make the bars wider.

    return data.reduce((acc: Record<string, number>, {score}) => {
        const barPosition = Math.min(Math.ceil(score / plotBarSize), width);
        const count = acc[barPosition] ?? 0;

        return {...acc, [barPosition]: count + 1};
    }, {});
}

function renderMetadata(count: number, min: number, max: number) {
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

    metaData = data
        .reduce(({count, min, max}, {score}) => {
            return {
                count: count + 1,
                min: score < min ? score : min,
                max: score > max ? score : max
            };
        }, {count: 0, min: Infinity, max: 0});

    plotData = calculatePlotData(data, width, metaData.max);

    renderMetadata(metaData.count, metaData.min, metaData.max);
    renderLists(convertToLists(data, sliders));
});

function renderLiItem(complexity: Complexity): HTMLLIElement {
    const itemElement = document.createElement('li');
    itemElement.innerText = `${complexity.file} ${complexity.score}`;

    return itemElement;
}

function animationFrame() {
    const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'green';
    Object.entries(plotData).forEach(([position, count]) => {
        count = count * 2;
        ctx.fillRect(Math.min(parseInt(position) * 2, width - 2), (height - count), 2, count);
    });

    ctx.fillStyle = 'black';

    sliders.sliders.forEach(position => {
        if (position >= width) {
            position = width - 2;
        }

        ctx.fillRect(position, 0, 2, height)
    });

    window.requestAnimationFrame(animationFrame);
}

window.requestAnimationFrame(animationFrame);

canvasElement.addEventListener('pointermove', event => {
    const {offsetX, buttons} = event;
    canvasElement.style.cursor = 'initial';

    if (slider === -1) {
        slider = sliders.sliders.findIndex(x => offsetX >= x - 4 && offsetX <= x + 6);
    }

    if (slider >= 0) {
        canvasElement.style.cursor = 'grab';
        dragging = (buttons === 1);
    }

    if (dragging) {
        canvasElement.style.cursor = 'grabbing';

        if (Sliders.insideBoundary(sliders.sliders[slider - 1] ?? 0, sliders.sliders[slider + 1] ?? width - 2, offsetX)) {
            sliders.update(slider, offsetX);
        }
    } else {
        dragging = false;
        slider = -1;
    }
});

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

canvasElement.addEventListener('pointerup', () => renderLists(convertToLists(data, sliders)));

function convertToLists(data: Complexity[], sliders: Sliders): Record<Size, Complexity[]> {
    const [min, xs, s, m, l, max] = sliders.sliders;

    return data.reduce((acc: Record<string, (Complexity)[]>, complexity: Complexity) => {
        const {score} = complexity;
        let key;

        if (score >= min && score < xs) {
            key = 'xsList';

        } else if (score >= xs && score < s) {
            key = 'sList';

        } else if (score >= s && score < m) {
            key = 'mList';

        } else if (score >= m && score < l) {
            key = 'lList';

        } else if (score >= l && score <= max) {
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

window.addEventListener('resize', () => {
    // Set pixels in canvas
    const rect = canvasElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvasElement.width = width;
    canvasElement.height = height;

    sliders.width = width;

    plotData = calculatePlotData(data, width, metaData.max);
});
