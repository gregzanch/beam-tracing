export class KDTree{
	public points: any[];
	public nodeSize: number;
	public coords;
	public ids: any[];
	constructor(points: any[], nodeSize?: number) {
		this.points = points;
		this.nodeSize = nodeSize || 64;
		this.coords = points.slice();

		var l = Math.floor(points.length / 2)
		this.ids = Array(l);

		for (var i = 0; i < l; i++) {
			this.ids[i] = i;
		}

		sortKD(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0);
	}
	range(minX, minY, maxX, maxY) {
		var ids = this.ids, coords = this.coords, nodeSize = this.nodeSize
		var stack = [0, ids.length - 1, 0];
		var result = [];
		var x, y;

		while (stack.length) {
			var axis = stack.pop();
			var right = stack.pop();
			var left = stack.pop();

			if (right - left <= nodeSize) {
				for (var i = left; i <= right; i++) {
					x = coords[2 * i];
					y = coords[2 * i + 1];
					if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[i]);
				}
				continue;
			}

			var m = Math.floor((left + right) / 2);

			x = coords[2 * m];
			y = coords[2 * m + 1];

			if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[m]);

			var nextAxis = (axis + 1) % 2;

			if (axis === 0 ? minX <= x : minY <= y) {
				stack.push(left);
				stack.push(m - 1);
				stack.push(nextAxis);
			}
			if (axis === 0 ? maxX >= x : maxY >= y) {
				stack.push(m + 1);
				stack.push(right);
				stack.push(nextAxis);
			}
		}

		return result;
	}
	within(qx, qy, r) {
		var ids = this.ids, coords = this.coords, nodeSize = this.nodeSize
		var stack = [0, ids.length - 1, 0];
		var result = [];
		var r2 = r * r;

		while (stack.length) {
			var axis = stack.pop();
			var right = stack.pop();
			var left = stack.pop();

			if (right - left <= nodeSize) {
				for (var i = left; i <= right; i++) {
					if (sqDist(coords[2 * i], coords[2 * i + 1], qx, qy) <= r2) result.push(ids[i]);
				}
				continue;
			}

			var m = Math.floor((left + right) / 2);

			var x = coords[2 * m];
			var y = coords[2 * m + 1];

			if (sqDist(x, y, qx, qy) <= r2) result.push(ids[m]);

			var nextAxis = (axis + 1) % 2;

			if (axis === 0 ? qx - r <= x : qy - r <= y) {
				stack.push(left);
				stack.push(m - 1);
				stack.push(nextAxis);
			}
			if (axis === 0 ? qx + r >= x : qy + r >= y) {
				stack.push(m + 1);
				stack.push(right);
				stack.push(nextAxis);
			}
		}

		return result;
	}


}


export function sqDist(ax, ay, bx, by) {
	var dx = ax - bx;
	var dy = ay - by;
	return dx * dx + dy * dy;
}


export function sortKD(ids, coords, nodeSize, left, right, depth) {
	if (right - left <= nodeSize) return;

	var m = Math.floor((left + right) / 2);

	select(ids, coords, m, left, right, depth % 2);

	sortKD(ids, coords, nodeSize, left, m - 1, depth + 1);
	sortKD(ids, coords, nodeSize, m + 1, right, depth + 1);
}

export function select(ids, coords, k, left, right, inc) {

	while (right > left) {
		if (right - left > 600) {
			var n = right - left + 1;
			var m = k - left + 1;
			var z = Math.log(n);
			var s = 0.5 * Math.exp(2 * z / 3);
			var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
			var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
			var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
			select(ids, coords, k, newLeft, newRight, inc);
		}

		var t = coords[2 * k + inc];
		var i = left;
		var j = right;

		swapItem(ids, coords, left, k);
		if (coords[2 * right + inc] > t) swapItem(ids, coords, left, right);

		while (i < j) {
			swapItem(ids, coords, i, j);
			i++;
			j--;
			while (coords[2 * i + inc] < t) i++;
			while (coords[2 * j + inc] > t) j--;
		}

		if (coords[2 * left + inc] === t) swapItem(ids, coords, left, j);
		else {
			j++;
			swapItem(ids, coords, j, right);
		}

		if (j <= k) left = j + 1;
		if (k <= j) right = j - 1;
	}
}

export function swapItem(ids, coords, i, j) {
	swap(ids, i, j);
	swap(coords, 2 * i, 2 * j);
	swap(coords, 2 * i + 1, 2 * j + 1);
}

export function swap(arr, i, j) {
	var tmp = arr[i];
	arr[i] = arr[j];
	arr[j] = tmp;
}
