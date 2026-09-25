interface IEvents<IEventsType extends IEventsTypeMap> {
    emit<T extends keyof IEventsType>(event: T, data: IEventsType[T]): void;
    on<T extends keyof IEventsType>(
        event: T,
        callback: (data: IEventsType[T]) => void,
        once: boolean,
    ): void;
    off<T extends keyof IEventsType>(event: T, callback: (data: IEventsType[T]) => void): void;
}

type IEventsTypeMap = object;

class EventBus<EventsType extends IEventsTypeMap> implements IEvents<EventsType> {
    private eventsStorage: {
        [T in keyof EventsType]?: { once: boolean; callback(data: unknown): void }[];
    } = {};

    on<T extends keyof EventsType>(
        event: T,
        callback: (data: EventsType[T]) => void,
        once: boolean,
    ): void {
        if (!this.eventsStorage[event]) this.eventsStorage[event] = [];
        const callbacks = this.eventsStorage[event]!;
        callbacks.push({ callback, once });
    }

    emit<T extends keyof EventsType>(event: T, data: EventsType[T]): void {
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

    off<T extends keyof EventsType>(event: T, callback: (data: EventsType[T]) => void): void {
        const callbacks = this.eventsStorage[event];
        if (!callbacks) return;

        const index = callbacks.findIndex(callbackCheck => callbackCheck.callback === callback);
        if (index !== -1) callbacks.splice(index, 1);
    }
}

export { type IEventsTypeMap, type IEvents, EventBus };
