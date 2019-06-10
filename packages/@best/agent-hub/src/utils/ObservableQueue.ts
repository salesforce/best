import { EventEmitter } from "events";

export default class ObservableQueue<T> extends EventEmitter implements Iterable<T | null>{
    _store: T[] = [];
    push(val: T) {
        this._store.push(val);
        this.emit('item-added', val);
    }
    pop(): T | undefined {
        const item = this._store.shift();

        if (item !== undefined) {
            this.emit('item-removed', item);
        }

        return item;
    }

    remove(val: T) {
        for(let i = 0, n = this._store.length; i < n; i++){
            if (this._store[i] === val) {
                this._store.splice(i, 1);
                this.emit('item-removed', val);
            }
        }
    }

    get size() {
        return this._store.length;
    }

    [Symbol.iterator]() {
        let pointer = 0;
        const elements: T[] = this._store;

        return {
            next(): IteratorResult<T | null> {
                if (pointer < elements.length) {
                    return {
                        done: false,
                        value: elements[pointer++]
                    }
                } else {
                    return {
                        done: true,
                        value: null
                    }
                }
            }
        }
    }
}
