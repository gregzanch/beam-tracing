import { Polygon } from "./polygon";
import { Source } from './source';
import { Receiver } from './receiver';
import { BSP } from './bsp';
import { Element } from './element';
import { sub,add,scale } from './math/math';

export interface RoomConstructorParams{
	elements?: Element[];
	sources?: Source[];
	receivers?: Receiver[];
	bsp?: BSP;
}

export class Room {
	public elements: Element[];
	public sources: Source[];
	public receivers: Receiver[];
	public bsp: BSP;
	constructor(params?: RoomConstructorParams) {
		if (params) {
			if (params.elements) this.elements = params.elements;
			if (params.sources) this.sources = params.sources;
			if (params.receivers) this.receivers = params.receivers;
			if (params.bsp) this.bsp = params.bsp;
		}
	}
	addPolygon(poly: Polygon, color: number[]) {

	}
	constructBSP(): void{
		// construct BSP
		const polygons: Polygon[] = [];
		for (let i = 0; i < this.elements.length; i++) {
			polygons.push(this.elements[i].polygon);
		}
		this.bsp = new BSP();
		// this.bsp.constructHierarchy(polygons[0], polygons.length);
	}
	reset() {

	}
	addSource(s: Source) {
		this.sources.push(s);
	}

	getBoundingBox(mn: number[], mx: number[]) {
		if (this.elements.length == 0) {
			mn[0] = 0;
			mn[1] = 0;
			mn[2] = 0;
			mx = mn;
			return;
		}

		mn = mx = this.elements[0].polygon[0];

		for (let i = 0; i < this.elements.length; i++) {
			for (let j = 0; j < this.elements[i].polygon.points.length; j++) {
				const p = this.elements[i].polygon[j];
				for (let k = 0; k < 3; k++) {
					mn[k] = mn[k] <= p[k] ? mn[k] : p[k];
					mx[k] = mx[k] <= p[k] ? mx[k] : p[k];
				}
			}
		}
	}
	getMaxLength() {
		let mn: number[] = [];
		let mx: number[] = [];
		this.getBoundingBox(mn, mx);

		mx = sub(mx, mn);
		let len = mx[0];
		len = len >= mx[1] ? len : mx[1];
		len = len >= mx[2] ? len : mx[2];

		return len;
	}
	getCenter() {
		let mn: number[] = [];
		let mx: number[] = [];
		this.getBoundingBox(mn, mx);
		return scale(add(mn,mx),.5);
	}

	getBSP() {
		return this.bsp;
	}
}

