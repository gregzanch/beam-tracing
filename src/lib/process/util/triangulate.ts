import { peqp } from './peqp';
export function triangulate(array) {
	const tris = [];
	const N = 3;
	let history = {
		verts: []
	};
	for (let i = 0; i < array.length / N ** 2; i++) {
		const tri = {
			verts: [],
			lines: []
		};
		for (let j = 0; j < N; j++) {
			const pt = {
				xyz: []
			};
			for (let k = 0; k < N; k++) {
				const index = i * N ** 2 + j * N + k;
				pt.xyz.push(array[index]);
			}
			if (history.verts.length == 0) {
				history.verts.push(pt);
			} else {
				let push = true;
				for (let k = 0; k < history.verts.length; k++) {
					if (peqp(pt.xyz, history.verts[k].xyz)) {
						push = false;
					}
				}
				if (push) {
					history.verts.push(pt);
				}
			}
			tri.verts.push(pt);
		}
		tri.lines.push({
			verts: [tri.verts[0], tri.verts[1]],
		})
		tri.lines.push({
			verts: [tri.verts[0], tri.verts[2]],
		})
		tri.lines.push({
			verts: [tri.verts[1], tri.verts[2]],
		})
		tris.push(tri);
	}
	return { tris, history };
}

