import AbstractRunner from '@best/runner-abstract';
export default class Runner extends AbstractRunner {
    loadUrl(url: string): Promise<void>;
    runIteration(page: any, opts: any): Promise<any>;
    runServerIterations(page: any, state: any, opts: any, messager: any): Promise<any>;
    reloadPage(): Promise<void>;
    closeBrowser(): Promise<void>;
}
