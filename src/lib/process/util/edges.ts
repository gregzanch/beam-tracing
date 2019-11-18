import { triangulate } from './triangulate';
import { lines_equal } from './lines_equal';

export function edges(triangles) {
	const {
		tris,
		history
	} = triangulate(triangles);

	let sharedlines = [];
	tris.forEach((x, i) => {
		tris.forEach((y, j) => {
			if (i < j) {
				x.lines.forEach((xline, ii) => {
					y.lines.forEach((yline, jj) => {
						let linesaresame = false;
						if (ii < jj) {
							linesaresame = lines_equal(xline.verts, yline.verts);
						}
						if (linesaresame) {
							sharedlines.push(xline.verts);
						}
					})
				})
			}
		})
	})

	return tris
		.reduce((acc, tri) => {
			tri.lines.forEach((x, i, a) => {
				acc.push(a[i]);
			});
		},[])
		.filter(x => !lines_equal(x.verts, sharedlines[0]))
		.map(x => x.verts.map(y => y.xyz))
}
