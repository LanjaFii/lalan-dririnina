export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

export function randRange(min: number, max: number): number {
	return Math.random() * (max - min) + min
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

export function degToRad(deg: number): number {
	return deg * (Math.PI / 180)
}

export default { clamp, randRange, lerp, degToRad }
