import { createElement } from 'lwc';
import App from 'one-app';

const container = document.getElementById('main');
const element = createElement('one-app', { is: App });
container.appendChild(element);

