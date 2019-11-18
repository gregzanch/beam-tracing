
export function sphericalToCartesian(theta: number, phi: number) {
    return [
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
    ]
}