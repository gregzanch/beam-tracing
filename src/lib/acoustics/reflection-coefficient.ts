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
	const rootOneMinusAlpha = Math.sqrt(1 - α);
	const ξo = (1 - rootOneMinusAlpha) / (1 + rootOneMinusAlpha);
	const ξo_sinθ = ξo * Math.sin(θ);
	const R = (ξo_sinθ - 1) / (ξo_sinθ + 1);
	return R;
}