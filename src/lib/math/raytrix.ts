
var cross = require('./cross');
var dot = require('./dot');
var sub = require('./sub');

export function raytrix(rayOrigin, ray, triangle, opts?) {
	opts = opts || {}

	var kz = getMaxAxis(ray)
	var kx = kz + 1
	if (kx === 3) { kx = 0 }
	var ky = kx + 1
	if (ky === 3) { ky = 0 }

	// Swap kx and ky dimension to preserve winding direction of triangle
	if (ray[kz] < 0) {
		var swap = ky
		ky = kx
		kx = swap
	}

	// TODO: Handle cases when we need to divide by zero because one of the ray
	// components is zero.
	// example rays that breaks -> [3, 4, 0] ... [10, 0, 10]... any ray with a 0 in it
	if (ray[kz] == 0) {
		ray[kz] = 0.0000000001
	}

	// Calculate the shear constants
	var Sz = 1.0 / ray[kz]
	var Sx = ray[kx] * Sz
	var Sy = ray[ky] * Sz

	// Calculate the vertices relative to the ray origin
	var A = sub([], triangle[0], rayOrigin)
	var B = sub([], triangle[1], rayOrigin)
	var C = sub([], triangle[2], rayOrigin)

	// Perform shear and scale on vertices
	var Ax = A[kx] - Sx * A[kz]
	var Ay = A[ky] - Sy * A[kz]
	var Bx = B[kx] - Sx * B[kz]
	var By = B[ky] - Sy * B[kz]
	var Cx = C[kx] - Sx * C[kz]
	var Cy = C[ky] - Sy * C[kz]

	// Calculate scaled barycentric coordinates
	var U = Cx * By - Cy * Bx
	var V = Ax * Cy - Ay * Cx
	var W = Bx * Ay - By * Ax

	/**
	  We aren't implementing the fallback that uses double precision at the
	  triangle's edges because JavaScript numbers always use double precision
	  if (U === 0 || V === 0 || W === 0) {
	  }
	  */

	// Abort early if we know that we have not intersected our triangle
	if (opts.backfaceCulling) {
		if (U < 0 || V < 0 || W < 0) { return }
	} else {
		if (
			(U < 0 || V < 0 || W < 0) &&
			(U > 0 || V > 0 || W > 0)
		) {
			return
		}
	}

	// Calculate determinant
	var det = U + V + W
	if (det === 0) { return }

	// Calculate scaled z-coordinates of vertices and use them to calculate the
	// hit distance
	var Az = Sz * A[kz]
	var Bz = Sz * B[kz]
	var Cz = Sz * C[kz]
	var T = U * Az + V * Bz + W * Cz

	var inverseDet = 1.0 / det

	// var hitU = U * inverseDet
	// var hitV = V * inverseDet
	// var hitW = W * inverseDet

	// Parametric distance from ray origin to intersection
	var t = T * inverseDet

	return [t * ray[0] + rayOrigin[0], t * ray[1] + rayOrigin[1], t * ray[2] + rayOrigin[2]]
}

/**
 * As per the watertight ray/triangle intersection algorithm, calculate
 * the direction in which the ray is largest
 * TODO: This is incorrect, supposed to be using absolute value
 */
function getMaxAxis(ray) {
	if (ray[0] > ray[1]) {
		if (ray[0] > ray[2]) {
			// X component of ray is largest
			return 0
		} else {
			// Z component of ray is largest
			return 2
		}
	} else {
		if (ray[1] > ray[2]) {
			// Y component of ray is lragest
			return 1
		} else {
			// Z component of ray is largest
			return 2
		}
	}
}


var EPSILON = 0.000001;
var edge1 = [0, 0, 0];
var edge2 = [0, 0, 0];
var tvec = [0, 0, 0];
var pvec = [0, 0, 0];
var qvec = [0, 0, 0];

export function raytrix2(out, pt, dir, tri) {
	sub(edge1, tri[1], tri[0]);
	sub(edge2, tri[2], tri[0]);

	cross(pvec, dir, edge2);
	var det = dot(edge1, pvec);

	if (det < EPSILON) return null;
	sub(tvec, pt, tri[0]);
	var u = dot(tvec, pvec);
	if (u < 0 || u > det) return null;
	cross(qvec, tvec, edge1);
	var v = dot(dir, qvec);
	if (v < 0 || u + v > det) return null;

	var t = dot(edge2, qvec) / det;
	out[0] = pt[0] + t * dir[0];
	out[1] = pt[1] + t * dir[1];
	out[2] = pt[2] + t * dir[2];
	return out;
}
