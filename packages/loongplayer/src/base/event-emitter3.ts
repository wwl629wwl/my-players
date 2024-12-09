export type EventObject = {
    [props: string]: Function[]
}

export class EventEmitter3 {
    private $events: EventObject = {}

    constructor() { }

    emit(event: string, ...args: any[]) {
        if (this.$events[event]) {
            this.$events[event].forEach((cb) => {
                cb.call(this, ...args)
            })
        }
    }

    on(event: string, cb: Function) {
        this.$events[event] = this.$events[event] || [];
        this.$events[event].push(cb)
    }

    off(event: string, cb: Function) {
        if (this.$events[event]) {
            this.$events[event] = this.$events[event].filter((fn) => {
                if (cb === fn) return false
                return true
            })
        }
    }
}