import { createElement } from 'engine';
import App from 'simple-benchmark';

const container = document.getElementById('main');
const element = createElement('simple-benchmark', { is: App });
container.appendChild(element);
