import { api, Element } from 'engine';
import HomePage from "./page-home.html";
import ProjectPage from "./page-project.html";
export default class AppRouter extends Element {
    @api pageType;
    @api pageId;
    @api pageState; // TODO: We don't need to pass this down once we have @wire

    render() {
        switch (this.pageType) {
            case 'home': return HomePage;
            case 'project': return ProjectPage;
            default: return HomePage;
        }
    }
}
