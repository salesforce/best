import { createElement } from "engine";
import App from "simple-benchmark";

const container = document.getElementById('main');
const element = createElement('todo-app', { is: App });
container.appendChild(element);
