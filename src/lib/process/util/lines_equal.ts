import { peqp } from './peqp';

export function lines_equal(l1, l2) {
	var line1 = l1.map(x => x.xyz);
	var line2 = l2.map(y => y.xyz);
	return (
			peqp(line1[0], line2[0]) &&
			peqp(line1[1], line2[1])) ||
		(peqp(line1[0], line2[1]) &&
			peqp(line1[1], line2[0]))

}
