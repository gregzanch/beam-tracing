export class vec3 {
	private data: Float32Array;
	constructor(x, y, z) {
		this.data = new Float32Array([x, y, z]);
	}



	get x() { return this.data[0] }
	set x(_) { this.data[0] = _ }
	get y() { return this.data[1] }
	set y(_) { this.data[1] = _ }
	get z() { return this.data[2] }
	set z(_) { this.data[2] = _ }
}
