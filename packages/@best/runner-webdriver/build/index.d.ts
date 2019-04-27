import AbstractRunner from '@best/runner-abstract';
export default class Runner extends AbstractRunner {
    loadUrl(url: string, projectConfig: any): Promise<void>;
    runIteration(page: any, opts: any): any;
    reloadPage(): Promise<void>;
    closeBrowser(): Promise<void>;
}
