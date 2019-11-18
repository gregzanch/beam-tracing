
export class DoubleClickTimer {
	elt: HTMLElement;
	window: number;
	callback: (e: Event, dt: number) => void;
	prevTime: number;
	constructor(elt: HTMLElement, window: number, callback: (e: Event, dt: number) => void) {
		this.elt = elt;
		this.window = window;
		this.callback = callback;
		this.prevTime = undefined;
		this.elt.addEventListener('click', (e => {
			if (!this.prevTime) {
				this.prevTime = Date.now();
			}
			else {
				const dt = Date.now() - this.prevTime;
				if (dt <= this.window) {
					callback(e, dt);
				}
				this.prevTime = Date.now();
			}
		}).bind(this));
	}
}
