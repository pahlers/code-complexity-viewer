import {RangeSlider} from 'toolcool-range-slider';
import {Complexity} from './complexity';
import {ComplexityFile} from './complexity-file';
import fileItemFactory from './file-item.factory';

const selectFilesElement = document.querySelector('.select-files') as HTMLInputElement;
const filesElement = document.querySelector('.files__list') as HTMLUListElement;
const fileTemplateElement = document.querySelector('.files__item-template') as HTMLTemplateElement;
const renderFileItem = fileItemFactory(fileTemplateElement);

const rangeSliderElement = document.querySelector('.config__ranges') as RangeSlider;

const metaFileCountElement = document.querySelector('.meta__file-count') as HTMLSpanElement;
const metaMinScoreElement = document.querySelector('.meta__min-score') as HTMLSpanElement;
const metaMaxScoreElement = document.querySelector('.meta__max-score') as HTMLSpanElement;

const xsListElement = document.querySelector('.xs__list') as HTMLOListElement;
const sListElement = document.querySelector('.s__list') as HTMLOListElement;
const mListElement = document.querySelector('.m__list') as HTMLOListElement;
const lListElement = document.querySelector('.l__list') as HTMLOListElement;
const xlListElement = document.querySelector('.xl__list') as HTMLOListElement;

let data: Complexity[] = [];

interface SizeConfig {
    min: number;
    xs: number;
    s: number;
    m: number;
    l: number;
    max: number;

}

function setRanges({min, xs, s, m, l, max}: SizeConfig) {
    rangeSliderElement.min = min;
    rangeSliderElement.max = max;

    rangeSliderElement.value1 = min;
    rangeSliderElement.value2 = xs;
    rangeSliderElement.value3 = s;
    rangeSliderElement.value4 = m;
    rangeSliderElement.value5 = l;
    rangeSliderElement.value6 = max;
    rangeSliderElement.disabled = false;
}

rangeSliderElement.disabled = true;

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
        .sort((a, b) => a.score - b.score);

    const {count, min, max} = data
        .reduce(({count, min, max}, {score}) => {
            return {
                count: count + 1,
                min: score < min ? score : min,
                max: score > max ? score : max
            };
        }, {count: 0, min: Infinity, max: 0});

    metaFileCountElement.innerText = `${count}`;
    metaMinScoreElement.innerText = `${min}`;
    metaMaxScoreElement.innerText = `${max}`;

    const step = Math.round((max - min) / 5);

    setRanges({
        min,
        xs: step,
        s: step * 2,
        m: step * 3,
        l: step * 4,
        max
    });
});

function renderLiItem(complexity: Complexity): HTMLLIElement {
    const itemElement = document.createElement('li');
    itemElement.innerText = `${complexity.file} ${complexity.score}`;

    return itemElement;
}

rangeSliderElement.addEventListener('change', (event: any) => {
    if (event.detail.values.length < 6) {
        return;
    }

    const [min, xs, s, m, l, max] = event.detail.values;

    console.log(event.detail.values);

    const {
        xsList,
        sList,
        mList,
        lList,
        xlList,
    } = data.reduce((acc: Record<string, (Complexity)[]>, complexity) => {
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

    const xsItemElements = xsList.map(renderLiItem);
    const sItemElements = sList.map(renderLiItem);
    const mItemElements = mList.map(renderLiItem);
    const lItemElements = lList.map(renderLiItem);
    const xlItemElements = xlList.map(renderLiItem);

    xsListElement.replaceChildren(...xsItemElements);
    sListElement.replaceChildren(...sItemElements);
    mListElement.replaceChildren(...mItemElements);
    lListElement.replaceChildren(...lItemElements);
    xlListElement.replaceChildren(...xlItemElements);
});
