export function map(v, l1, h1, l2, h2) {
	return l2 + ((v - l1) * (h2 - l2)) / (h1 - l1);
}
