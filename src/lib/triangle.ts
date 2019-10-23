import { vec3a, cross, sub } from './math/math';

export class Triangle{
	private _points: number[][];
	private _normal: number[];
	constructor(a: number[], b: number[], c: number[]) {
		this._points = [a, b, c];
		this._normal = cross(sub(b, a), sub(c, a));
	}

	get points(): number[][] { return this._points }
	set points(points: number[][]) {
		this._points = points;
		this._normal = cross(sub(this._points[1], this._points[0]), sub(this._points[2], this._points[0]));
	}


	get normal(): number[] { return this._normal; }


}
