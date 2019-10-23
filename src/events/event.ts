type EventHandlerFunction = (...args) => void;

export class Event {
	public _name: string;
	public _handlers: EventHandlerFunction[];
	constructor(name) {
		this.name = name;
		this.handlers = [] as EventHandlerFunction[];
	}
	addHandler(handler: EventHandlerFunction) {
		this.handlers.push(handler);
	}

	get handlers() { return this._handlers }
	set handlers(handlers) { this._handlers = handlers; }

	get name() { return this._name }
	set name(name) { this._name = name; }
}
