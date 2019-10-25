/**
 * Calcualtes the *reflection coefficient* **R**
 * of a surface with *absorption coefficient* **α**
 * at an *angle* **θ**
 *
 * @export
 * @param {number} α where **α ∈ [0,1]**
 * @param {number} θ where **θ ∈ [0,π/2]**
 * @returns {number} R where **R ∈ [0,1]**
 */

export function reflectionCoefficient(α: number, θ: number) {

	const ξo = (1 + Math.sqrt(1 - α)) / (1 - Math.sqrt(1 - α));
	const ξo_cosθ = ξo * Math.cos(θ);
	const R = (ξo_cosθ - 1) / (ξo_cosθ + 1);
	return R;
}





