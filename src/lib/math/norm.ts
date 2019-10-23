import { mag } from './mag';

export function norm(p) {
	const m = mag(p);
	return p.map(x => x / m);
}
