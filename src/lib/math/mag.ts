
export function mag(p) {
	let sum = 0;
	for (let i = 0; i < p.length; i++){
		sum += p[i] * p[i];
	}
	return Math.sqrt(sum);
}
