import { mag } from './mag';
import { projectionDistance } from './projection';
export function reflect(pt, pleq, norm) {
	const d = projectionDistance(pt, pleq);
	return pt.map((p,i) => p - 2 * d * norm[i])
}
