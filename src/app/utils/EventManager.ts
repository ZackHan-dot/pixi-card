type CEvent = {
    [key: string]: Function[];
};
export class EventManager {
    private events: CEvent;
    constructor() {
        this.events = {};
    }

    on(eventName: string, listener: Function) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    emit(eventName: string, data: unknown) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(data));
        }
    }

    off(eventName: string, listener: Function) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(
                existingListener => existingListener !== listener
            );
        }
    }
}
