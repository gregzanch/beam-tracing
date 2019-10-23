export function rotationMatrix(axis, angle) {
	const [s, c] = [Math.sin(angle), Math.cos(angle)];
	switch (axis) {
		case 'x':
			return [
				[1, 0, 	0],
				[0, c, -s],
				[0, s,  c]
			]
		case 'y':
			return [
				[ c, 0, s],
				[ 0, 1, 0],
				[-s, s, c]
			]
		case 'z':
			return [
				[c, -s, 0],
				[s,  c, 0],
				[0,  0, 1]
			]
		default:
			throw new Error(`must specify an axis (either 'x', 'y', or 'z'`);
	}
}
