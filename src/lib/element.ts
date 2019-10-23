import { Polygon } from './polygon';
import { Color } from 'three';
export class Element{
	public polygon: Polygon;
	public color: Color;
	constructor(polygon: Polygon, color: Color) {
		this.polygon = polygon;
		this.color = color;
	}
}
