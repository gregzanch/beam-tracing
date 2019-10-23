export class AABB {
	mn: Float32Array;
	mx: Float32Array;
	constructor(mn: Float32Array, mx: Float32Array) {
		this.mn = mn;
		this.mx = mx;
	}
	grow(p: Float32Array) {
		for (let i = 0; i < 3; i++){
			if (p[i] < this.mn[i]) {
				this.mn[i] = p[i];
			}
			if (p[i] > this.mx[i]) {
				this.mx[i] = p[i];
			}
		}
	}
	overlaps(o: AABB): boolean{
		return (this.mn[0] < o.mx[0] && this.mx[0] > o.mn[0] &&
				this.mn[1] < o.mx[1] && this.mx[1] > o.mn[1] &&
				this.mn[2] < o.mx[2] && this.mx[2] > o.mn[2]);
	}
	contains(p: Float32Array): boolean {
		return (p[0] > this.mn[0] && p[0] < this.mx[0] &&
				p[1] > this.mn[1] && p[1] < this.mx[1] &&
				p[2] > this.mn[2] && p[2] < this.mx[2]);
	}
};
