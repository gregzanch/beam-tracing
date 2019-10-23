import * as GLOBALS from './math/globals';
import { log10, roundToNdigits, toDeg, mag } from './math/math';
import { vec3sub } from './math/vec3sub';

export class Vec2 {
	public x: number;
	public y: number;
	constructor(x: number | Vec2, y?: number) {
		if (!y) {
			this.x = (x as Vec2).x;
			this.y = (x as Vec2).y;
		}
		else {
			this.x = (x as number);
			this.y = y;
		}
	}
	clone() {
		return new Vec2(this.x, this.y);
	}
	sub(v2: Vec2) {
		this.x = this.x - v2.x;
		this.y = this.y - v2.y;
		return this;
	}
	add(v2: Vec2) {
		this.x = this.x + v2.x;
		this.y = this.y + v2.y;
		return this;
	}
	len() {
		return (Math.sqrt(this.x * this.x + this.y * this.y));
	}
	normalize() {
		var l = this.len();
		this.scale(1 / l);
		return this;
	}
	relativeScale(p, s) {
		this.sub(p);
		this.scale(s);
		this.add(p);
		return this;
	}
	distance(v) {
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		return (Math.sqrt(dx * dx + dy * dy));
	}
	setFromUnitVector(angle: number) {
		this.x = Math.cos(angle);
		this.y = Math.sin(angle);
		return this;
	}
	scale(s) {
		this.x = this.x * s;
		this.y = this.y * s;
		return this;
	};
	vec2Add(v1, v2) {
		var v = new Vec2(v1);
		v.add(v2);
		return v;
	}
	timeOfFlight(dest) {
		var v;
		if (dest)
			v = v2_dir(this, dest);
		else
			v = this;
		return (v.len() / GLOBALS.speedOfSound);
	}
	scaleToTime(t) {
		this.normalize();
		this.scale(t * GLOBALS.speedOfSound);
		return this;
	}
	dot(v2) {
		return this.x * v2.x + this.y * v2.y;
	}
	reflect(l, center) {
		var v = v2_dir(center, this);
		var v_dot_l = v.dot(l);
		var r = new Vec2(l);
		r.scale(2 * v_dot_l);
		r.sub(v);
		r.add(center);
		return r;
	}
	inFrontOfPlane(c, norm) {
		var pointToCenter = v2_dir(this, c);
		return (pointToCenter.dot(norm) < 0);
	}
	print(txt = "") {
		console.log(txt + " = [" + this.x + "," + this.y + "]");
	}
}



// Intersection of two lines of form l = p + t*s
// returns t for line: p1 + t*s1
export function v2_line_itx(p0, s0, p1, s1) {
	var scaler = s0.x * s1.y - s1.x * s0.y;
	if (scaler == 0) {
		return null; //Lines are parallel
	} else {
		return (s0.x * (p0.y - p1.y) - s0.y * (p0.x - p1.x)) / scaler
	}
}

export function v2_itx(p0, s0, p1, s1) {
	var t = v2_line_itx(p0, s0, p1, s1);
	var ip = new Vec2(s1);
	ip.scale(t);
	ip.add(p1);
	return ip;
}

export function v2_seg_itx(p0, s0, p1, s1, mult) {
	var eps = mult * GLOBALS.EPS;
	var t = v2_line_itx(p0, s0, p1, s1);
	if ((t > eps) && (t < (1 - eps))) {
		t = v2_line_itx(p1, s1, p0, s0);
		if ((t > eps) && (t < (1 - eps)))
			return true;
	}
	return false;
}

export function v2_angle(p0: Vec2, p1: Vec2) {
	return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

export function v2_dir(p0: Vec2, p1: Vec2) {
	var d = new Vec2(p1);
	d.sub(p0);
	return d;
}

export function v2_norm(p0: Vec2, p1: Vec2) {
	var d = v2_dir(p0, p1);
	return new Vec2(d.y, -d.x);
}



//------------------------------------------------------------------------

export class Vec3 {
	public x: number;
	public y: number;
	public z: number;
	constructor(x?: number, y?: number, z?: number) {
		this.x = x || undefined;
		this.y = y || this.x;
		this.z = z || this.x;
	}
	clone() {
		return new Vec3(this.x, this.y, this.z);
	}
	cross(v2: Vec3) {
		return new Vec3(
			(this.y * v2.z - this.z * v2.y),
			(this.z * v2.x - this.x * v2.z),
			(this.x * v2.y - this.y * v2.x)
		);
	}
	sub(v2: Vec3) {
		this.x = this.x - v2.x;
		this.y = this.y - v2.y;
		this.z = this.z - v2.z;
		return this;
	}
	add(v2: Vec3) {
		this.x = this.x + v2.x;
		this.y = this.y + v2.y;
		this.z = this.z + v2.z;
		return this;
	}
	len() {
		return (Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
	}
	normalize() {
		this.scale(1 / this.len());
		return this;
	}
	relativeScale(p: Vec3, s: number) {
		this.sub(p);
		this.scale(s);
		this.add(p);
		return this;
	}
	distance(v: Vec3) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		const dz = this.z - v.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}
	setFromQuaternion(q) {

	}
	scale(s: number) {
		this.x = this.x * s;
		this.y = this.y * s;
		this.z = this.z * s;
		return this;
	};
	timeOfFlight(dest: Vec3) {
		var v: Vec3;
		if (dest)
			v = v3_dir(this, dest);
		else
			v = this;
		return (v.len() / GLOBALS.speedOfSound);
	}
	scaleToTime(t: number) {
		this.normalize();
		this.scale(t * GLOBALS.speedOfSound);
		return this;
	}
	dot(v2: Vec3) {
		return this.x * v2.x + this.y * v2.y + this.z * v2.z;
	}
	reflect(l: Vec3, center: Vec3) {
		var v = v3_dir(center, this);
		var v_dot_l = v.dot(l);
		var r = l.clone();
		r.scale(2 * v_dot_l);
		r.sub(v);
		r.add(center);
		return r;
	}
	inFrontOfPlane(c: Vec3, norm: Vec3) {
		var pointToCenter = v3_dir(this, c);
		return (pointToCenter.dot(norm) < 0);
	}
	print(txt = "") {
		console.log(txt + " = [" + this.x + "," + this.y + "]");
	}
}




// Intersection of two lines of form l = p + t*s
// returns t for line: p1 + t*s1
export function v3_line_itx(p0: Vec3, s0: Vec3, p1: Vec3, s1: Vec3) {
	var scaler = s0.x * s1.y - s1.x * s0.y;
	if (scaler == 0) {
		return null; //Lines are parallel
	} else {
		return (s0.x * (p0.y - p1.y) - s0.y * (p0.x - p1.x)) / scaler
	}
}

export function v3_itx(p0: Vec3, s0: Vec3, p1: Vec3, s1: Vec3) {
	var t = v3_line_itx(p0, s0, p1, s1);
	var ip = s1.clone();
	ip.scale(t);
	ip.add(p1);
	return ip;
}

export function v3_seg_itx(p0: Vec3, s0: Vec3, p1: Vec3, s1: Vec3, mult: number) {
	var eps = mult * GLOBALS.EPS;
	var t = v3_line_itx(p0, s0, p1, s1);
	if ((t > eps) && (t < (1 - eps))) {
		t = v3_line_itx(p1, s1, p0, s0);
		if ((t > eps) && (t < (1 - eps)))
			return true;
	}
	return false;
}

export function v3_angle(p0: Vec3, p1: Vec3) {
	return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

export function v3_dir(p0: Vec3, p1: Vec3) {
	var d = p1.clone();
	d.sub(p0);
	return d;
}

export function v3_cross(v1: Vec3, v2: Vec3) {
	return new Vec3(
		(v1.y * v2.z - v1.z * v2.y),
		(v1.z * v2.x - v1.x * v2.z),
		(v1.x * v2.y - v1.y * v2.x)
	);
}

export function v3_norm(p0: Vec3, p1: Vec3) {
	return v3_cross(p0, p1);
}

export function v3_dot(a: Vec3, b: Vec3) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}
export function v3_dot_v4(a: Vec3, b: Vec4) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function v3_mirror(v: Vec3, p: Vec4) {
	let d = 2 * v3_dot_v4(v, p);
	return new Vec3(v.x - d * p.x, v.y - d * p.y, v.z - d * p.z);
}

export function v3_sub(a: Vec3, b: Vec3) {
	return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

//------------------------------------------------------------------------

export class Vec4 {
	x: number;
	y: number;
	z: number;
	w: number;
	constructor(x?: number, y?: number, z?: number, w?: number) {
		this.x = x || undefined;
		this.y = y || undefined;
		this.z = z || undefined;
		this.w = w || undefined;
	}
	set(x: number, y: number, z: number, w: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	}
	$scale(f: number) {
		this.x *= (f as number);
		this.y *= (f as number);
		this.z *= (f as number);
		this.w *= (f as number);
		return this;
	}
	$scaleVec(v: Vec4) {
		this.x *= (v as Vec4).x;
		this.y *= (v as Vec4).y;
		this.z *= (v as Vec4).z;
		this.w *= (v as Vec4).w;
		return this;
	}
	scale(f: number) {
		return new Vec4(
			this.x * f,
			this.y * f,
			this.z * f,
			this.w * f
		);
	}
	$add(v: Vec4) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;
		return this;
	}
	add(v: Vec4) {
		return new Vec4(
			this.x + v.x,
			this.y + v.y,
			this.z + v.z,
			this.w + v.w
		)
	}
	$sub(v: Vec4) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;
		return this;
	}
	sub(v: Vec4) {
		return new Vec4(
			this.x - v.x,
			this.y - v.y,
			this.z - v.z,
			this.w - v.w
		);
	}
	$mul(v: Vec4) {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
		this.w *= v.w;
		return this;
	}
	mul(v: Vec4) {
		return new Vec4(
			this.x * v.x,
			this.y * v.y,
			this.z * v.z,
			this.w * v.w
		);
	}
	$negate() {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;
		this.w *= -1;
		return this;
	}
	negate() {
		return new Vec4(
			this.x *= -1,
			this.y *= -1,
			this.z *= -1,
			this.w *= -1
		);
	}
	normalize() {
		var len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		if (len == 0) {
			return false;
		}
		len = 1 / len;
		this.x *= len;
		this.y *= len;
		this.z *= len;
		this.w *= len;
		return true;
	}
	normalizeByW() {
		if (this.w == 0.) {
			return false;
		}
		let iw = 1 / this.w;
		this.x *= iw;
		this.y *= iw;
		this.z *= iw;
		this.w = 1.0;
		return true;
	}
}




export function v4_mirror(p: Vec4, r: Vec4){
	let pn = new Vec3(p.x, p.y, p.z);
	let rn = new Vec3(r.x, r.y, r.z);
	let dpr = 2 * v3_dot(pn, rn);
	let x = v3_sub(pn, rn.scale(dpr));
	let pp = new Vec3();
	let pw = p.w - r.w * dpr;
	return new Vec4(pp.x, pp.y, pp.z, pw);
}

export function v4_normalize(p: Vec4){
	let len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
	if (len == 0) {
		return p;
	}
	len = 1 / len;
	return new Vec4(p.x * len, p.y * len, p.z * len, p.w * len);
}


