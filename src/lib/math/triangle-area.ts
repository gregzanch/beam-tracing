import {Vector3} from 'three';
type vec3 = Vector3;
export function triangleArea(a: vec3, b: vec3, c: vec3) {
	const A = new Vector3().subVectors(b, a);
	const B = new Vector3().subVectors(c, a);
	return A.length() * B.length() * Math.sin(A.angleTo(B)) / 2;
}
