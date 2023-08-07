import fileItemFactory from './file-item.factory';
import { SliderHistogramComponent } from './lib/slider-histogram/slider-histogram.component';
import { Complexity } from './complexity';
import { ComplexityFile } from './complexity-file';
import throttle from 'lodash.throttle';
import { ScoreFormComponent } from './lib/score-form/score-form.component';
import { CenterTextOverflow } from "./lib/center-text-overflow/center-text-overflow";
import { PlotData } from "./lib/slider-histogram/plot.data";

type Size = 'xs' | 's' | 'm' | 'l' | 'xl';

type MetaData = {
  count: number;
  sloc: number;
  min: number;
  max: number;
};

const selectFilesElement = document.querySelector('.select-files') as HTMLInputElement;
const exportElement = document.querySelector('.export') as HTMLButtonElement;
const filesElement = document.querySelector('.files__list') as HTMLUListElement;
const fileTemplateElement = document.querySelector('.files__item-template') as HTMLTemplateElement;
const renderFileItem = fileItemFactory(fileTemplateElement);

const metaFileCountElement = document.querySelector('.meta__file-count') as HTMLSpanElement;
const metaSlocElement = document.querySelector('.meta__sloc') as HTMLSpanElement;
const metaMinScoreElement = document.querySelector('.meta__min-score') as HTMLSpanElement;
const metaMaxScoreElement = document.querySelector('.meta__max-score') as HTMLSpanElement;

const xsListElement = document.querySelector('.xs__list') as HTMLOListElement;
const sListElement = document.querySelector('.s__list') as HTMLOListElement;
const mListElement = document.querySelector('.m__list') as HTMLOListElement;
const lListElement = document.querySelector('.l__list') as HTMLOListElement;
const xlListElement = document.querySelector('.xl__list') as HTMLOListElement;

const xsAmountElement = document.querySelector('.xs .amount') as HTMLSpanElement;
const sAmountElement = document.querySelector('.s .amount') as HTMLSpanElement;
const mAmountElement = document.querySelector('.m .amount') as HTMLSpanElement;
const lAmountElement = document.querySelector('.l .amount') as HTMLSpanElement;
const xlAmountElement = document.querySelector('.xl .amount') as HTMLSpanElement;

CenterTextOverflow.define();
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
  return data.reduce(({scores, max}: PlotData, {maintainability: {score}}: Complexity) => {
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

function renderMetadata({count, min, max, sloc}: MetaData) {
  metaFileCountElement.textContent = `${count}`;
  metaSlocElement.textContent = `${sloc}`;
  metaMinScoreElement.textContent = `${Math.round(min)}`;
  metaMaxScoreElement.textContent = `${Math.round(max)}`;
}

selectFilesElement.addEventListener('change', async event => {
  const target = event.target as HTMLInputElement;
  const rawFiles = [...(target.files as FileList)]
    .filter(({type}) => type === 'application/json')
    .map(file => new ComplexityFile(file))
    .map(async file => await file.parse());

  const parsedFiles = await Promise.all(rawFiles);
  const files = parsedFiles.filter(file => file.isValid());

  filesElement.replaceChildren(...files.map(file => renderFileItem(file)));

  data = files.map(file => file.data)
    .flat()
    .filter(({file}) => file.length > 0)
    .sort((a, b) => a.maintainability.score - b.maintainability.score);

  const metaData = data
    .reduce(({count, min, max, sloc}, {maintainability: {score, sloc: slocFile}}) => {
      return {
        count: count + 1,
        min: score < min ? score : min,
        max: score > max ? score : max,
        sloc: sloc + slocFile
      };
    }, {count: 0, min: Infinity, max: 0, sloc: 0});

  renderMetadata(metaData);

  plotData = calculatePlotData(data);

  sliderHistogram.plotData = plotData;
  const sliders = [
    0,
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

  exportElement.disabled = false;
});

function renderLiItem(complexity: Complexity): HTMLLIElement {
  const {score, volume, cyclomatic, sloc} = complexity.maintainability;
  const title = `${complexity.file}
Module: ${complexity.module}

Score: ${Math.round(score)}
Halstead volume: ${volume ?? 'not available'}
Cyclomatic Complexity: ${cyclomatic ?? 'not available'}
Source lines of code: ${sloc ?? 'not available'}`;

  const itemElement = document.createElement('li');
  itemElement.classList.add('list-item');

  const centerTextOverflowElement = document.createElement('center-text-overflow');
  centerTextOverflowElement.classList.add('list-item-filename');
  centerTextOverflowElement.setAttribute('title', title);
  centerTextOverflowElement.setAttribute('label', `${complexity.file} ${Math.round(score)}`);
  centerTextOverflowElement.setAttribute('split-at-character', '/');
  centerTextOverflowElement.setAttribute('split-from', 'end');

  itemElement.appendChild(centerTextOverflowElement);

  return itemElement;
}

function renderLists(lists: Record<Size, Complexity[]>) {
  const xsItemElements = lists.xs.map(renderLiItem);
  const sItemElements = lists.s.map(renderLiItem);
  const mItemElements = lists.m.map(renderLiItem);
  const lItemElements = lists.l.map(renderLiItem);
  const xlItemElements = lists.xl.map(renderLiItem);

  xsListElement.replaceChildren(...xsItemElements);
  sListElement.replaceChildren(...sItemElements);
  mListElement.replaceChildren(...mItemElements);
  lListElement.replaceChildren(...lItemElements);
  xlListElement.replaceChildren(...xlItemElements);

  xsAmountElement.textContent = `${lists.xs.length} files`;
  sAmountElement.textContent = `${lists.s.length} files`;
  mAmountElement.textContent = `${lists.m.length} files`;
  lAmountElement.textContent = `${lists.l.length} files`;
  xlAmountElement.textContent = `${lists.xl.length} files`;
}

function convertToLists(data: Complexity[], [aSlider, bSlider, cSlider, dSlider, eSlider, fSlider]: number[]): Record<Size, Complexity[]> {
  return data.reduce((acc: Record<string, (Complexity)[]>, complexity: Complexity) => {
    const {maintainability: {score}} = complexity;
    let key: Size;

    if (score >= aSlider && score < bSlider) {
      key = 'xs';

    } else if (score >= bSlider && score < cSlider) {
      key = 's';

    } else if (score >= cSlider && score < dSlider) {
      key = 'm';

    } else if (score >= dSlider && score < eSlider) {
      key = 'l';

    } else if (score >= eSlider && score <= fSlider) {
      key = 'xl';

    } else {
      return acc;
    }

    return {...acc, [key]: [...acc[key], complexity]};
  }, {
    xs: [],
    s: [],
    m: [],
    l: [],
    xl: [],
  });
}

exportElement.addEventListener('click', () => {
  const exportData = convertToLists(data, sliderHistogram.sliders);
  const type = 'application/json';
  const blob = new Blob([JSON.stringify(exportData, undefined, 2)], {type});
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.download = `export-${(new Date()).toISOString()}.json`;
  anchor.type = type;
  anchor.href = url;

  anchor.click();
});
