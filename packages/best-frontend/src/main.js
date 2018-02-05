import { createElement } from 'engine';
import App from 'one-app';

const container = document.getElementById('main');
const element = createElement('one-app', { is: App });
container.appendChild(element);

