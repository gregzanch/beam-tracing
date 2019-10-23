import { Event } from './event';

export interface EventList {
	[name: string]: Event;
}

export class EventManager{
	events: EventList;
	constructor() {
		this.events = {} as EventList;
	}
	event(eventName: string) {
		if (!this.events[eventName]) {
			this.events[eventName] = new Event(eventName);
		}
		return this.events[eventName];
	}
	emit(eventName: string, ...args) {
		if (!this.events[eventName]) {
			return
		}
		this.events[eventName].handlers.forEach(handler => {
			handler(args);
		})
	}
}
