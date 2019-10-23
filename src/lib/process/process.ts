// const Emitter = require('tiny-emitter');




// export class Task {
// 	private _name: string;
// 	private _desc: string;
// 	private _started: boolean = false;

// 	constructor(emitter, completor, onStart, onComplete) {
// 		this.completor = completor;
// 		this.onStart = onStart;
// 		this.onComplete = onComplete;
// 	}
// 	start() {
// 		this.started = true;
// 	}
// }


// export class Process {
// 	private _name: string;
// 	private _desc: string;
// 	private _emitter;
// 	private _steps: Task[];
// 	constructor(name) {
// 		this._name = name||"";
// 		this._emitter = new Emitter();
// 		return this;
// 	}
// 	describe(desc: string) {
// 		this._desc = desc;
// 		return this;
// 	}

// 	addStep(name, description, handler) {

// 	}

// 	get name() { return this._name };
// 	set name(name) { this._name = name; }

// 	get desc() { return this._desc }
// 	set desc(desc) { this._desc = desc; }

// }


// const lookat = new Process("lookat")
// 	.describe("allows user to select a surface and the camera will align to view and be set to ortho")
// 	.addStep("pick surface", (state, complete, restart, abandon) => {
// 		state.pickGeometry((picked_surface) => {
// 			complete(picked_surface)
// 		});
// 	})
