interface IEventsType {
    SWITCH_TARGET: {
        targetID: string;
    };
    UPDATE_PROJECT: {
        targetID: string;
    };
}

interface IEvents {
    emit<T extends keyof IEvents>(event: T, data: IEvents[T]): void;
    on<T extends keyof IEvents>(
        event: T,
        callback: (data: IEvents[T]) => void,
        once: boolean,
    ): void;
    off<T extends keyof IEvents>(event: T, callback: (data: IEvents[T]) => void): void;
}

class Events implements IEvents {
    private eventsStorage: {
        [T in keyof IEvents]?: { once: boolean; callback(data: unknown): void }[];
    } = {};

    on<T extends keyof IEvents>(
        event: T,
        callback: (data: IEvents[T]) => void,
        once: boolean,
    ): void {
        if (!this.eventsStorage[event]) this.eventsStorage[event] = [];
        const callbacks = this.eventsStorage[event]!;
        callbacks.push({ callback, once });
    }

    emit<T extends keyof IEvents>(event: T, data: IEvents[T]): void {
        const callbacks = this.eventsStorage[event];
        if (!callbacks) return;

        for (let i = callbacks.length - 1; i >= 0; i--) {
            const event = callbacks[i];
            event.callback(data);
            if (event.once) {
                callbacks.splice(i, 1);
            }
        }
    }

    off<T extends keyof IEvents>(event: T, callback: (data: IEvents[T]) => void): void {
        const callbacks = this.eventsStorage[event];
        if (!callbacks) return;

        const index = callbacks.findIndex(callbackCheck => callbackCheck.callback === callback);
        if (index !== -1) callbacks.splice(index, 1);
    }
}

export { type IEventsType };
export const events = new Events();
