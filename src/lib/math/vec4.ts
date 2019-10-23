export class vec4 {
	private data: Float32Array;
	constructor(x, y, z, t) {
		this.data = new Float32Array([x, y, z, t]);
	}



	get x() { return this.data[0] }
	set x(_) { this.data[0] = _ }
	get y() { return this.data[1] }
	set y(_) { this.data[1] = _ }
	get z() { return this.data[2] }
	set z(_) { this.data[2] = _ }
	get t() { return this.data[3] }
	set t(_) { this.data[3] = _ }
}

