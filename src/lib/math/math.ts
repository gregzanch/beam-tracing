import { Triangle } from './../triangle';

export * from './triangle-area';

export * from './aabb';
export * from './planeEquation';
export * from './raytrix';

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

export class vec3a {
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

export function log10(x) {
	return Math.log(x) / Math.LN10;
}

export function roundToNdigits(x, N) {
	var scaler = Math.floor(log10(x)) + 1;
	scaler = Math.pow(10, scaler - N);
	x = x / scaler;
	x = Math.round(x);
	x = x * scaler;
	return x;
}

export function toDeg(a) {
	return 180 * a / Math.PI;
}

export function mag(p) {
	let sum = 0;
	for (let i = 0; i < p.length; i++) {
		sum += p[i] * p[i];
	}
	return Math.sqrt(sum);
}



export function norm(p) {
	const m = mag(p);
	return p.map(x => x / m);
}
;


export function projectionDistance(pt, pleq) {
	return (pleq[0] * pt[0] + pleq[1] * pt[1] + pleq[2] * pt[2] + pleq[3]) / mag([pleq[0], pleq[1], pleq[2]]);
}




export function reflect(pt: number[], pleq: number[], norm: number[]): number[] {
	const d = projectionDistance(pt, pleq);
	return pt.map((p, i) => p - 2 * d * norm[i])
}

export function vec3sub(out, a, b) {
	out[0] = a[0] - b[0]
	out[1] = a[1] - b[1]
	out[2] = a[2] - b[2]
	return out
}

export function max(a, b) {
	return a > b ? a : b;
}

export function min(a, b) {
	return a < b ? a : b;
}

export function clamp(v, a, b) {
	return v < a ? a : v > b ? b : v;
}

export function map(v, l1, h1, l2, h2) {
	return l2 + ((v - l1) * (h2 - l2)) / (h1 - l1);
}


export function cross(a: number[], b: number[]): number[] {
	return [
		(a[1] * b[2] - a[2] * b[1]),
		(a[2] * b[0] - a[0] * b[2]),
		(a[0] * b[1] - a[1] * b[0])
	];
}


export function sub(a: number[], b:  number[]): number[] {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}


export function add(a:  number[], b:  number[]): number[] {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scale(a: number[], n: number): number[] {
	return [a[0] * n, a[1] * n, a[2] * n];
}

export function dot(a:  number[], b:  number[]): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function fabs(x) {
	return Math.abs(x);
}

export function dist(p1: number[], p2: number[]) {
	return mag(sub(p2, p1));
}


export function rayTriangleIntersect(
	orig: number[],
	dir: number[],
	tri: Triangle,
	uvt: number[],
	culling: boolean,
	kEpsilon: number
) {
	const v0v1 = sub(tri.points[1], tri.points[0]);
	const v0v2 = sub(tri.points[2], tri.points[0]);
	const pvec = cross(dir, v0v2);
	const det = dot(v0v1, pvec);
	if (culling){
		// if the determinant is negative the triangle is backfacing
		// if the determinant is close to 0, the ray misses the triangle
		if (det < kEpsilon) return false;
	}
	else {
		// ray and triangle are parallel if det is close to 0
		if (fabs(det) < kEpsilon) return false;
	}
	const invDet = 1 / det;

	const tvec = sub(orig, tri.points[0]);
	uvt[0] = dot(tvec, pvec) * invDet;
	if (uvt[0] < 0 || uvt[0] > 1) return false;

	const qvec = cross(tvec, v0v1);
	uvt[1] = dot(dir,qvec) * invDet;
	if (uvt[1] < 0 || uvt[0] + uvt[1] > 1) return false;

	uvt[2] = dot(v0v2,qvec) * invDet;

	return true;
}

