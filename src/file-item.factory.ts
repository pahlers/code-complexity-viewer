import { ComplexityFile } from './complexity-file';

export default (template: HTMLTemplateElement) => (file: ComplexityFile): HTMLLIElement => {
  const clone = template.content.cloneNode(true) as HTMLLIElement;
  (clone.querySelector('.file-name') as HTMLSpanElement).textContent = file.name;
  (clone.querySelector('.file-size') as HTMLSpanElement).textContent = new Intl.NumberFormat("en", {
    style: 'unit',
    unit: 'kilobyte',
    unitDisplay: 'short',
    maximumFractionDigits: 1
  }).format(file.size / 1024);

  return clone;
}
