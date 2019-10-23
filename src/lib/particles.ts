import { Vec3 } from './vector';

export class ParticleSystem{
	_startPos: Vec3;
	_PDF: (theta, phi) => number;
	constructor() {
		this.startPos = new Vec3(0, 0, 0);
	}
	setStart(startPos: Vec3) {
		this.startPos = new Vec3(0, 0, 0);
		return this;
	}
	setPDF(PDF: (theta, phi) => number) {
		this.PDF = PDF;
	}

	get PDF() { return this._PDF }
	set PDF(PDF) { this._PDF = PDF; }
	get startPos() { return this._startPos }
	set startPos(startPos) { this._startPos = startPos; }
}
