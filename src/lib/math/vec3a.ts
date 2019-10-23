export class vec3a{
	constructor(x: number, y: number, z: number) {
		this[0] = x;
		this[1] = y;
		this[2] = z;
	}
	get x() {
		return this[0];
	}
	set x(_x: number) {
		this[0] = _x;
	}
	get y() {
		return this[1];
	}
	set y(_y: number) {
		this[1] = _y;
	}
	get z() {
		return this[2];
	}
	set z(_z: number) {
		this[2] = _z;
	}
}

