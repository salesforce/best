import { createElement } from 'lwc';
import App from 'simple-benchmark';

const container = document.getElementById('main');
const element = createElement('simple-benchmark', { is: App });
container.appendChild(element);
