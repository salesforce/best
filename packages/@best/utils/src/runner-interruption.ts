import { Interruption } from "@best/types";

export class RunnerInterruption implements Interruption {
    public requestedInterruption: boolean = false;
    public id?: string;

    constructor(id?: string) {
        this.id = id;
    }

    requestInterruption() {
        this.requestedInterruption = true;
    }
}
