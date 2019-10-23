import { planeEquation, norm } from './math/math';
import { BufferGeometry } from 'three';
import { peqp } from './process/util/peqp';
import { uuidv4 } from './process/util/uuidv4';

export class Polygon {
	public pleq: number[];
	public tris: number[][][];
	public n: number[];
	public points: number[][];
	public id: string;
	constructor(surface: BufferGeometry|number[]) {
		this.id = uuidv4();
		this.tris = [];
		this.points =[];
		const N = 3;
		const arr = (surface instanceof BufferGeometry) ? surface.attributes.position.array : surface;
		for (let i = 0; i < arr.length / N ** 2; i++){
			const tri = [];
			for (let j = 0; j < N; j++){
				const pt = [];
				for (let k = 0; k < N; k++){
					const index = i * N ** 2 + j * N + k;
					pt.push(arr[index]);
				}
				tri.push(pt);
				if (this.points .length == 0) {
					this.points .push(pt);
				}
				else {
					let push = true;
					loop: for (let i = 0; i < this.points .length; i++) {
						if (peqp(pt, this.points [i])) {
							push = false;
							break loop
						}
					}
					push && this.points.push(pt);
				}
			}
			this.tris.push(tri);
		}
		let normpleqs = [];
		let coPlanar = this.tris
			.map(x => norm(planeEquation(x[0], x[1], x[2]))
				.map(y => y.toFixed(5)).join(''))
			.reduce((a, b, c, d) => (c==0) ? d[0] : (b === a) ? b : false)

		if (!coPlanar) {
			// console.log(this);
			throw new Error('surface triangles must be co-planar');
		}

		this.pleq = norm(planeEquation(this.tris[0][0], this.tris[0][1], this.tris[0][2]));
		this.n = norm([this.pleq[0], this.pleq[1], this.pleq[2]]);
		const az = Math.atan2(this.n[0], this.n[1]);
		const ax = Math.atan2(this.n[0], this.n[2]);
	}



}
