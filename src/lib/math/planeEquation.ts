export function planeEquation(p1, p2, p3) {
	const a1 = p2[0] - p1[0];
	const b1 = p2[1] - p1[1];
	const c1 = p2[2] - p1[2];
	const a2 = p3[0] - p1[0];
	const b2 = p3[1] - p1[1];
	const c2 = p3[2] - p1[2];
	const a = b1 * c2 - b2 * c1;
	const b = a2 * c1 - a1 * c2;
	const c = a1 * b2 - b1 * a2;
	const d = (- a * p1[0] - b * p1[1] - c * p1[2]);
	return [a, b, c, d];
}
