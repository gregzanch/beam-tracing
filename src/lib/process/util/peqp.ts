export function peqp(p1: number[], p2: number[]) {
	if (p1.length != p2.length) {
		console.warn("trying to compare a "+p1.length+"-D point with a "+p2.length+"-D point. Returning false.");
		return false
	}
	for (let i = 0; i < p1.length; i++){
		if (p1[i] != p2[i]) {
			return false
		}
	}
	return true;
}
