import { Polygon } from './polygon';
import { v3_dot_v4, Vec3, Vec4} from './vector';


export class Beam {
	private _top: Vec3;
	private _polygon: Polygon;
	private _numPleqs: number;
	private _pleqs: Vec4[];
	constructor(top?: number[], polygon?: Polygon) {

	}

	calculatePleqs() {

			// let n = this.polygon.points.length;


			// let p1: Vec3 = this.polygon.points[n - 1];

			// let sign = v3_dot_v4(this.top, this.polygon.pleq) > 0 ? -1 : 1;

			// for (let i = 0; i < n; i++) {
			// 	let p0: Vec3 = p1;
			// 	p1 = this.polygon.points[i];
			// 	this.pleqs = sign * normalize(getPlaneEquation(m_top, p0, p1));
			// }
			// m_pleqs[0] = sign * m_polygon.getPleq();




	}

	contains(p: Vec3): boolean {
		for (let i = 0; i < this.numPleqs(); i++){
			if (v3_dot_v4(p, this.getPleq(i)) < 0) {
				return false
			}
		}
		return true
	}

	getPleq(i: number) {
		if (i < 0 || i >= this.numPleqs()) {
			throw ("Error out of bounds")
		}
		return this._pleqs[i]
	}

	numPleqs() {
		return this._pleqs.length;
	}

	get pleqs() { return this._pleqs }
	set pleqs(pleqs) { this._pleqs = pleqs; }

	get top() {
		return this._top;
	}
	set top(top) {
		this._top = top
	}

	get polygon() {
		return this._polygon
	}
	set polygon(polygon: Polygon) {
		this._polygon = polygon;
	}
}
