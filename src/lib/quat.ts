/**
 * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function logHypot(a, b) {

	var _a = Math.abs(a);
	var _b = Math.abs(b);

	if (a === 0) {
		return Math.log(_b);
	}

	if (b === 0) {
		return Math.log(_a);
	}

	if (_a < 3000 && _b < 3000) {
		return Math.log(a * a + b * b) * 0.5;
	}

	return Math.log(a / Math.cos(Math.atan2(b, a)));
}

type quatRep = number | quat | string | number[];

/** Default is the multiplicative one element **/
let P: quat = ({ w: 1, x: 0, y: 0, z: 0 } as quat);

export function parse(dest, w: quatRep, x?: number, y?: number, z?: number) {

	// Most common internal use case with 4 params
	if (z !== undefined) {
		dest['w'] = w;
		dest['x'] = x;
		dest['y'] = y;
		dest['z'] = z;
		return;
	}

	if (typeof w === 'object' && y === undefined) {

		// Check for quats, for example when an object gets cloned
		if ('w' in w || 'x' in w || 'y' in w || 'z' in w) {
			dest['w'] = w['w'] || 0;
			dest['x'] = w['x'] || 0;
			dest['y'] = w['y'] || 0;
			dest['z'] = w['z'] || 0;
			return;
		}

		// Check for complex numbers
		if ('re' in w && 'im' in w) {
			dest['w'] = w['re'];
			dest['x'] = w['im'];
			dest['y'] = 0;
			dest['z'] = 0;
			return;
		}

		// Check for array
		if ((w as number[]).length === 4) {
			dest['w'] = w[0];
			dest['x'] = w[1];
			dest['y'] = w[2];
			dest['z'] = w[3];
			return;
		}

		// Check for augmented vector
		if ((w as number[]).length === 3) {
			dest['w'] = 0;
			dest['x'] = w[0];
			dest['y'] = w[1];
			dest['z'] = w[2];
			return;
		}

		throw new Error('Invalid object');
	}

	// Parse string values
	if (typeof w === 'string' && y === undefined) {

		var tokens = (w as string).match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
		var plus = 1;
		var minus = 0;

		var iMap = { i: 'x', j: 'y', k: 'z' };

		if (tokens === null) {
			throw new Error('Parse error');
		}

		// Reset the current state
		dest['w'] =
		dest['x'] =
		dest['y'] =
		dest['z'] = 0;

		for (var i = 0; i < tokens.length; i++) {

			var c = tokens[i];
			var d = tokens[i + 1];

			if (c === ' ' || c === '\t' || c === '\n') {
				/* void */
			} else if (c === '+') {
				plus++;
			} else if (c === '-') {
				minus++;
			} else {

				if (plus + minus === 0) {
					throw new Error('Parse error' + c);
				}
				var g = iMap[c];

				// Is the current token an imaginary sign?
				if (g !== undefined) {

					// Is the following token a number?
					//@ts-ignore
					if (d !== ' ' && !isNaN(d)) {
						c = d;
						i++;
					} else {
						c = '1';
					}

				} else {
					//@ts-ignore
					if (isNaN(c)) {
						throw new Error('Parser error');
					}

					g = iMap[d];

					if (g !== undefined) {
						i++;
					}
				}

				dest[g || 'w'] += parseFloat((minus % 2 ? '-' : '') + c);
				plus = minus = 0;
			}
		}

		// Still something on the stack
		if (plus + minus > 0) {
			throw new Error('Parser error');
		}
		return;
	}

	// If no single variable was given AND it was the constructor, set it to the identity
	if (w === undefined && dest !== P) {
		dest['w'] = 1;
		dest['x'] =
			dest['y'] =
			dest['z'] = 0;
	} else {

		dest['w'] = w || 0;

		// Note: This isn't setFromAxis, it's just syntactic sugar!
		//@ts-ignore
		if (x && x.length === 3) {
			dest['x'] = x[0];
			dest['y'] = x[1];
			dest['z'] = x[2];
		} else {
			dest['x'] = x || 0;
			dest['y'] = y || 0;
			dest['z'] = z || 0;
		}
	}
}

function numToStr(n, char, prev) {

	var ret = '';

	if (n !== 0) {

		if (prev !== '') {
			ret += n < 0 ? ' - ' : ' + ';
		} else if (n < 0) {
			ret += '-';
		}

		n = Math.abs(n);

		if (1 !== n || char === '') {
			ret += n;
		}
		ret += char;
	}
	return ret;
}


export class quat {

	/**
	 * Identity I
	 *
	 * @type {quat}
	 * @memberof quat
	 */
	I: quat = new quat(0, 1, 0, 0);

	/**
	 * identity J
	 *
	 * @type {quat}
	 * @memberof quat
	 */
	J: quat = new quat(0, 0, 1, 0);

	/**
	 * identity K
	 *
	 * @type {quat}
	 * @memberof quat
	 */
	K: quat = new quat(0, 0, 0, 1);

	/**
	 * Additive identity quat
	 *
	 * @memberof quat
	 */
	ZERO = new quat(0, 0, 0, 0);

	/**
	 * Multiplicative identity quat
	 *
	 * @type {quat}
	 * @memberof quat
	 */
	ONE: quat = new quat(1, 0, 0, 0); //

	/**
	 * Epsilon Limit
	 *
	 * @type {number}
	 * @memberof quat
	 */
	EPSILON: number = 1e-16;

	public w: number;
	public x: number;
	public y: number;
	public z: number;
	constructor(w?: quatRep, x?: number, y?: number, z?: number) {
		parse(P, w, x, y, z);
		this.w = P['w'];
		this.x = P['x'];
		this.y = P['y'];
		this.z = P['z'];

	}
	/**
	 * Adds two quaternions Q1 and Q2
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {quat}
	 */
	add(w: quatRep, x?: number, y?: number, z?: number): quat {
		parse(P, w, x, y, z);

		// Q1 + Q2 := [w1, v1] + [w2, v2] = [w1 + w2, v1 + v2]

		return new quat(
			this['w'] + P['w'],
			this['x'] + P['x'],
			this['y'] + P['y'],
			this['z'] + P['z']
		);
	}
	/**
	 * Subtracts a quaternions Q2 from Q1
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {quat}
	 */
	sub(w: quatRep, x: number, y: number, z: number): quat {

		parse(P, w, x, y, z);

		// Q1 - Q2 := Q1 + (-Q2)
		//          = [w1, v1] - [w2, v2] = [w1 - w2, v1 - v2]

		return new quat(
			this['w'] - P['w'],
			this['x'] - P['x'],
			this['y'] - P['y'],
			this['z'] - P['z']);
	}


	/**
	 * Calculates the additive inverse, or simply it negates the quaternion
	 *
	 * @returns {quat}
	 */
	neg(): quat {

		// -Q := [-w, -v]

		return new quat(-this['w'], -this['x'], -this['y'], -this['z']);
	}

	/**
	 * Calculates the LENGTH/modulus/magnitude or the norm of a quaternion
	 * !! NOT NORMALIZE !!
	 * @returns {number}
	 */
	norm(): number {

		// |Q| := sqrt(|Q|^2)

		// The unit quaternion has |Q| = 1

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		return Math.sqrt(w * w + x * x + y * y + z * z);
	}

	/**
	 * Calculates the squared length/modulus/magnitude or the norm of a quaternion
	 *
	 * @returns {number}
	 */
	normSq(): number {

		// |Q|^2 := [w, v] * [w, -v]
		//        = [w^2 + dot(v, v), -w * v + w * v + cross(v, -v)]
		//        = [w^2 + |v|^2, 0]
		//        = [w^2 + dot(v, v), 0]
		//        = dot(Q, Q)
		//        = Q * Q'

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		return w * w + x * x + y * y + z * z;
	}

	/**
	 * Normalizes the quaternion to have |Q| = 1 as long as the norm is not zero
	 * Alternative names are the signum, unit or versor
	 *
	 * @returns {quat}
	 */
	normalize(): quat {

		// Q* := Q / |Q|

		// unrolled Q.scale(1 / Q.norm())

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		var norm = Math.sqrt(w * w + x * x + y * y + z * z);

		if (norm < quat['EPSILON']) {
			return quat['ZERO'];
		}

		norm = 1 / norm;

		return new quat(w * norm, x * norm, y * norm, z * norm);
	}
	/**
	 * Calculates the Hamilton product of two quaternions
	 * Leaving out the imaginary part results in just scaling the quat
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {quat}
	 */
	mul(w: quatRep, x?: number, y?: number, z?: number): quat {

		parse(P, w, x, y, z);

		// Q1 * Q2 = [w1 * w2 - dot(v1, v2), w1 * v2 + w2 * v1 + cross(v1, v2)]

		// Not commutative because cross(v1, v2) != cross(v2, v1)!

		var w1 = this['w'];
		var x1 = this['x'];
		var y1 = this['y'];
		var z1 = this['z'];

		var w2 = P['w'];
		var x2 = P['x'];
		var y2 = P['y'];
		var z2 = P['z'];

		return new quat(
			w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
			w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
			w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2,
			w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2);
	}
	/**
	 * Scales a quaternion by a scalar, faster than using multiplication
	 *
	 * @param {number} s scaling factor
	 * @returns {quat}
	 */
	scale(s: number) {

		return new quat(
			this['w'] * s,
			this['x'] * s,
			this['y'] * s,
			this['z'] * s);
	}
	/**
	 * Calculates the dot product of two quaternions
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {number}
	 */
	dot(w: quatRep, x?: number, y?: number, z?: number) {

		parse(P, w, x, y, z);

		// dot(Q1, Q2) := w1 * w2 + dot(v1, v2)

		return this['w'] * P['w'] + this['x'] * P['x'] + this['y'] * P['y'] + this['z'] * P['z'];
	}
	/**
	 * Calculates the inverse of a quat for non-normalized quats such that
	 * Q^-1 * Q = 1 and Q * Q^-1 = 1
	 *
	 * @returns {quat}
	 */
	inverse(): quat {

		// Q^-1 := Q' / |Q|^2
		//       = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]

		// Proof:
		// Q * Q^-1 = [w, v] * [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]
		//          = [1, 0]
		// Q^-1 * Q = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)] * [w, v]
		//          = [1, 0].

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		var normSq = w * w + x * x + y * y + z * z;

		if (normSq === 0) {
			return quat['ZERO']; // TODO: Is the result zero or one when the norm is zero?
		}

		normSq = 1 / normSq;

		return new quat(w * normSq, -x * normSq, -y * normSq, -z * normSq);
	}
	/**
	 * Multiplies a quaternion with the inverse of a second quaternion
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {quat}
	 */
	div(w: quatRep, x?: number, y?: number, z?: number): quat {

		parse(P, w, x, y, z);

		// Q1 / Q2 := Q1 * Q2^-1

		var w1 = this['w'];
		var x1 = this['x'];
		var y1 = this['y'];
		var z1 = this['z'];

		var w2 = P['w'];
		var x2 = P['x'];
		var y2 = P['y'];
		var z2 = P['z'];

		var normSq = w2 * w2 + x2 * x2 + y2 * y2 + z2 * z2;

		if (normSq === 0) {
			return quat['ZERO']; // TODO: Is the result zero or one when the norm is zero?
		}

		normSq = 1 / normSq;

		return new quat(
			(w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2) * normSq,
			(x1 * w2 - w1 * x2 - y1 * z2 + z1 * y2) * normSq,
			(y1 * w2 - w1 * y2 - z1 * x2 + x1 * z2) * normSq,
			(z1 * w2 - w1 * z2 - x1 * y2 + y1 * x2) * normSq);
	}
	/**
	 * Calculates the conjugate of a quaternion
	 *
	 * @returns {quat}
	 */
	conjugate(): quat {

		// Q' = [s, -v]

		// If the quaternion is normalized,
		// the conjugate is the inverse of the quaternion - but faster
		// Q' * Q = Q * Q' = 1

		// Additionally, the conjugate of a unit quaternion is a rotation with the same
		// angle but the opposite axis.

		// Moreover the following property holds:
		// (Q1 * Q2)' = Q2' * Q1'

		return new quat(this['w'], -this['x'], -this['y'], -this['z']);
	}
	/**
	 * Calculates the natural exponentiation of the quaternion
	 *
	 * @returns {quat}
	 */
	exp(): quat {

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		var vNorm = Math.sqrt(x * x + y * y + z * z);
		var wExp = Math.exp(w);
		var scale = wExp / vNorm * Math.sin(vNorm);

		if (vNorm === 0) {
			//return new quat(wExp * Math.cos(vNorm), 0, 0, 0);
			return new quat(wExp, 0, 0, 0);
		}

		return new quat(
			wExp * Math.cos(vNorm),
			x * scale,
			y * scale,
			z * scale);
	}
	/**
	 * Calculates the natural logarithm of the quaternion
	 *
	 * @returns {quat}
	 */
	log(): quat {

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		if (y === 0 && z === 0) {
			return new quat(
				logHypot(w, x),
				Math.atan2(x, w), 0, 0);
		}

		var qNorm2 = x * x + y * y + z * z + w * w;
		var vNorm = Math.sqrt(x * x + y * y + z * z);

		var scale = Math.atan2(vNorm, w) / vNorm;

		return new quat(
			Math.log(qNorm2) * 0.5,
			x * scale,
			y * scale,
			z * scale);
	}
	/**
	 * Calculates the power of a quaternion raised to a real number or another quaternion
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {quat}
	 */
	pow(w: quatRep, x?: number, y?: number, z?: number) {

		parse(P, w, x, y, z);

		if (P['y'] === 0 && P['z'] === 0) {

			if (P['w'] === 1 && P['x'] === 0) {
				return this;
			}

			if (P['w'] === 0 && P['x'] === 0) {
				return quat['ONE'];
			}

			// Check if we can operate in C
			// Borrowed from complex.js
			if (this['y'] === 0 && this['z'] === 0) {

				var a = this['w'];
				var b = this['x'];

				if (a === 0 && b === 0) {
					return quat['ZERO'];
				}

				var arg = Math.atan2(b, a);
				var loh = logHypot(a, b);

				if (P['x'] === 0) {

					if (b === 0 && a >= 0) {

						return new quat(Math.pow(a, P['w']), 0, 0, 0);

					} else if (a === 0) {

						switch (P['w'] % 4) {
							case 0:
								return new quat(Math.pow(b, P['w']), 0, 0, 0);
							case 1:
								return new quat(0, Math.pow(b, P['w']), 0, 0);
							case 2:
								return new quat(-Math.pow(b, P['w']), 0, 0, 0);
							case 3:
								return new quat(0, -Math.pow(b, P['w']), 0, 0);
						}
					}
				}

				a = Math.exp(P['w'] * loh - P['x'] * arg);
				b = P['x'] * loh + P['w'] * arg;
				return new quat(
					a * Math.cos(b),
					a * Math.sin(b), 0, 0);
			}
		}

		// Normal quaternion behavior
		// q^p = e^ln(q^p) = e^(ln(q)*p)
		return this.log().mul(P).exp();
	}
	/**
	 * Checks if two quats are the same
	 *
	 * @param {number|Object|string} w real
	 * @param {number=} x imag
	 * @param {number=} y imag
	 * @param {number=} z imag
	 * @returns {boolean}
	 */
	equals(w: quatRep, x?: number, y?: number, z?: number) {

		parse(P, w, x, y, z);

		var eps = quat['EPSILON'];

		// maybe check for NaN's here?
		return Math.abs(P['w'] - this['w']) < eps
			&& Math.abs(P['x'] - this['x']) < eps
			&& Math.abs(P['y'] - this['y']) < eps
			&& Math.abs(P['z'] - this['z']) < eps;
	}
	/**
	 * Checks if all parts of a quaternion are finite
	 *
	 * @returns {boolean}
	 */
	isFinite(): boolean {

		return isFinite(this['w']) && isFinite(this['x']) && isFinite(this['y']) && isFinite(this['z']);
	}
	/**
	 * Checks if any of the parts of the quaternion is not a number
	 *
	 * @returns {boolean}
	 */
	isNaN(): boolean {

		return isNaN(this['w']) || isNaN(this['x']) || isNaN(this['y']) || isNaN(this['z']);
	}
	/**
	 * Gets the quat as a well formatted string
	 *
	 * @returns {string}
	 */
	toString(): string {

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];
		var ret = '';

		if (isNaN(w) || isNaN(x) || isNaN(y) || isNaN(z)) {
			return 'NaN';
		}

		// Alternative design?
		// '(%f, [%f %f %f])'

		ret = numToStr(w, '', ret);
		ret += numToStr(x, 'i', ret);
		ret += numToStr(y, 'j', ret);
		ret += numToStr(z, 'k', ret);

		if ('' === ret)
			return '0';

		return ret;
	}
	/**
	 * Returns the real part of the quaternion
	 *
	 * @returns {number}
	 */
	real(): number {

		return this['w'];
	}
	/**
	 * Returns the imaginary part of the quaternion as a 3D vector / array
	 *
	 * @returns {Array}
	 */
	imag(): number[] {

		return [this['x'], this['y'], this['z']];
	}
	/**
	 * Gets the actual quaternion as a 4D vector / array
	 *
	 * @returns {Array}
	 */
	toVector(): number[] {

		return [this['w'], this['x'], this['y'], this['z']];
	}
	/**
	 * Calculates the 3x3 rotation matrix for the current quat
	 *
	 * @param {boolean=} d2
	 * @see https://en.wikipedia.org/wiki/Rotation_matrix#quat
	 * @returns {Array}
	 */
	toMatrix(d2) {

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		var n = w * w + x * x + y * y + z * z;
		var s = n === 0 ? 0 : 2 / n;
		var wx = s * w * x, wy = s * w * y, wz = s * w * z;
		var xx = s * x * x, xy = s * x * y, xz = s * x * z;
		var yy = s * y * y, yz = s * y * z, zz = s * z * z;

		if (d2) {
			return [
				[1 - (yy + zz), xy - wz, xz + wy],
				[xy + wz, 1 - (xx + zz), yz - wx],
				[xz - wy, yz + wx, 1 - (xx + yy)]];
		}

		return [
			1 - (yy + zz), xy - wz, xz + wy,
			xy + wz, 1 - (xx + zz), yz - wx,
			xz - wy, yz + wx, 1 - (xx + yy)];
	}
	/**
	 * Calculates the homogeneous 4x4 rotation matrix for the current quat
	 *
	 * @param {boolean=} d2
	 * @returns {Array}
	 */
	toMatrix4(d2) {

		var w = this['w'];
		var x = this['x'];
		var y = this['y'];
		var z = this['z'];

		var n = w * w + x * x + y * y + z * z;
		var s = n === 0 ? 0 : 2 / n;
		var wx = s * w * x, wy = s * w * y, wz = s * w * z;
		var xx = s * x * x, xy = s * x * y, xz = s * x * z;
		var yy = s * y * y, yz = s * y * z, zz = s * z * z;

		if (d2) {
			return [
				[1 - (yy + zz), xy - wz, xz + wy, 0],
				[xy + wz, 1 - (xx + zz), yz - wx, 0],
				[xz - wy, yz + wx, 1 - (xx + yy), 0],
				[0, 0, 0, 1]];
		}

		return [
			1 - (yy + zz), xy - wz, xz + wy, 0,
			xy + wz, 1 - (xx + zz), yz - wx, 0,
			xz - wy, yz + wx, 1 - (xx + yy), 0,
			0, 0, 0, 1];
	}
	/**
	 * Clones the actual object
	 *
	 * @returns {quat}
	 */
	clone(): quat {

		return new quat(this);
	}
	/**
	 * Rotates a vector according to the current quaternion
	 *
	 * @param {Array} v The vector to be rotated
	 * @returns {Array}
	 */
	rotateVector(v) {

		// [0, v'] = Q * [0, v] * Q'

		// Q
		var w1 = this['w'];
		var x1 = this['x'];
		var y1 = this['y'];
		var z1 = this['z'];

		// [0, v]
		var w2 = 0;
		var x2 = v[0];
		var y2 = v[1];
		var z2 = v[2];

		// Q * [0, v]
		var w3 = /*w1 * w2*/ -x1 * x2 - y1 * y2 - z1 * z2;
		var x3 = w1 * x2 + /*x1 * w2 +*/ y1 * z2 - z1 * y2;
		var y3 = w1 * y2 + /*y1 * w2 +*/ z1 * x2 - x1 * z2;
		var z3 = w1 * z2 + /*z1 * w2 +*/ x1 * y2 - y1 * x2;

		var w4 = w3 * w1 + x3 * x1 + y3 * y1 + z3 * z1;
		var x4 = x3 * w1 - w3 * x1 - y3 * z1 + z3 * y1;
		var y4 = y3 * w1 - w3 * y1 - z3 * x1 + x3 * z1;
		var z4 = z3 * w1 - w3 * z1 - x3 * y1 + y3 * x1;

		return [x4, y4, z4];
	}

	slerp(w: quatRep, x?: number, y?: number, z?: number) {

		parse(P, w, x, y, z);

		// slerp(Q1, Q2, t) := Q1(Q1^-1 Q2)^t

		var w1 = this['w'];
		var x1 = this['x'];
		var y1 = this['y'];
		var z1 = this['z'];

		var w2 = P['w'];
		var x2 = P['x'];
		var y2 = P['y'];
		var z2 = P['z'];

		var cosTheta0 = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;

		if (cosTheta0 < 0) {
			w1 = -w1;
			x1 = -x1;
			y1 = -y1;
			z1 = -z1;
			cosTheta0 = -cosTheta0;
		}

		if (cosTheta0 > 0.9995) { // DOT_THRESHOLD
			return function (pct) {
				return new quat(
					w1 + pct * (w2 - w1),
					x1 + pct * (x2 - x1),
					y1 + pct * (y2 - y1),
					z1 + pct * (z2 - z1))['normalize']();
			};
		}

		var Theta0 = Math.acos(cosTheta0);
		var sinTheta0 = Math.sin(Theta0);

		return function (pct) {

			var Theta = Theta0 * pct;
			var sinTheta = Math.sin(Theta);
			var cosTheta = Math.cos(Theta);

			var s0 = cosTheta - cosTheta0 * sinTheta / sinTheta0;
			var s1 = sinTheta / sinTheta0;

			return new quat(
				s0 * w1 + s1 * w2,
				s0 * x1 + s1 * x2,
				s0 * y1 + s1 * y2,
				s0 * z1 + s1 * z2);
		}
	}


	/**
	 * Creates quaternion by a rotation given as axis and angle
	 *
	 * @param {Array} axis The axis around which to rotate
	 * @param {number} angle The angle in radians
	 * @returns {quat}
	 */
	fromAxisAngle(axis: number[], angle: number): quat {

		// Q = [cos(angle / 2), v * sin(angle / 2)]

		var halfAngle = angle * 0.5;

		var a = axis[0];
		var b = axis[1];
		var c = axis[2];

		var sin = Math.sin(halfAngle);
		var cos = Math.cos(halfAngle);

		var sin_norm = sin / Math.sqrt(a * a + b * b + c * c);

		return new quat(cos, a * sin_norm, b * sin_norm, c * sin_norm);
	}

	/**
	 * Calculates the quaternion to rotate one vector onto the other
	 *
	 * @param {Array} u
	 * @param {Array} v
	 */
	fromBetweenVectors(u: number[], v: number[]): quat {

		var a = u[0];
		var b = u[1];
		var c = u[2];

		var x = v[0];
		var y = v[1];
		var z = v[2];

		var dot = a * x + b * y + c * z;
		var w1 = b * z - c * y;
		var w2 = c * x - a * z;
		var w3 = a * y - b * x;

		return new quat(
			dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3),
			w1,
			w2,
			w3
		).normalize();
	}

	/**
	 * Creates a quaternion by a rotation given by Euler angles
	 *
	 * @param {number} phi
	 * @param {number} theta
	 * @param {number} psi
	 * @param {string=} order
	 * @returns {quat}
	 */
	fromEuler(phi: number, theta: number, psi: number, order: string): quat {

		var _x = theta * 0.5;
		var _y = psi * 0.5;
		var _z = phi * 0.5;

		var cX = Math.cos(_x);
		var cY = Math.cos(_y);
		var cZ = Math.cos(_z);

		var sX = Math.sin(_x);
		var sY = Math.sin(_y);
		var sZ = Math.sin(_z);

		if (order === undefined || order === 'ZXY') {
			return new quat(
				cX * cY * cZ - sX * sY * sZ,
				sX * cY * cZ - cX * sY * sZ,
				cX * sY * cZ + sX * cY * sZ,
				cX * cY * sZ + sX * sY * cZ);
		}

		if (order === 'XYZ') {
			return new quat(
				cX * cY * cZ - sX * sY * sZ,
				sX * cY * cZ + cX * sY * sZ,
				cX * sY * cZ - sX * cY * sZ,
				cX * cY * sZ + sX * sY * cZ);
		}

		if (order === 'YXZ') {
			return new quat(
				cX * cY * cZ + sX * sY * sZ,
				sX * cY * cZ + cX * sY * sZ,
				cX * sY * cZ - sX * cY * sZ,
				cX * cY * sZ - sX * sY * cZ);
		}

		if (order === 'ZYX') {
			return new quat(
				cX * cY * cZ + sX * sY * sZ,
				sX * cY * cZ - cX * sY * sZ,
				cX * sY * cZ + sX * cY * sZ,
				cX * cY * sZ - sX * sY * cZ);
		}

		if (order === 'YZX') {
			return new quat(
				cX * cY * cZ - sX * sY * sZ,
				sX * cY * cZ + cX * sY * sZ,
				cX * sY * cZ + sX * cY * sZ,
				cX * cY * sZ - sX * sY * cZ);
		}

		if (order === 'XZY') {
			return new quat(
				cX * cY * cZ + sX * sY * sZ,
				sX * cY * cZ - cX * sY * sZ,
				cX * sY * cZ - sX * cY * sZ,
				cX * cY * sZ + sX * sY * cZ);
		}
		return null;
	}
}
