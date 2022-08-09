export class ConnectStore {
    connected = false;
    dataCallback;
    store;
    subscription;

    constructor(dataCallback) {
        this.dataCallback = dataCallback;
    }

    connect() {
        this.connected = true;
        this.subscribeToStore();
    }

    disconnect() {
        this.unsubscribeFromStore();
        this.connected = false;
    }

    subscribeToStore() {
        if (this.connected && this.store) {
            const notifyStateChange = () => {
                const state = this.store.getState();
                this.dataCallback(state);
            };
            this.subscription = this.store.subscribe(notifyStateChange);
            notifyStateChange();
        }
    }

    update(config) {
        this.unsubscribeFromStore();
        this.store = config.store;
        this.subscribeToStore();
    }

    unsubscribeFromStore() {
        if (this.subscription) {
            this.subscription();
            this.subscription = undefined;
        }
    }
}
