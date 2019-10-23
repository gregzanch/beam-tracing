import { vec3, vec4 } from './math/math';
export interface PointOfInterestParams{
	pos?: vec3;
	col?: vec4;
	radius?: number;
	name?: string;
}

/**
 *
 */
export class PointOfInterest{
	public pos;
	public col;
	public radius;
	public name;
	private _posarr;
	constructor(params) {
		this.pos = params.pos || new vec3(0, 0, 0);
		this._posarr = [this.pos.x,this.pos.y,this.pos.z];
		this.col = params.col || new vec4(0, 0, 0, 1);
		this.radius = params.radius || 1;
		this.name = params.name || `noname${Math.random()}`
	}

	get posarr() {
		return this._posarr;
	}
	set posarr(arr: number[]) {
		this._posarr = arr;
		this.pos.x = arr[0];
		this.pos.y = arr[1];
		this.pos.z = arr[2];
	}

}
