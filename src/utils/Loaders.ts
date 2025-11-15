import * as THREE from 'three'

export function loadTexture(url: string): Promise<THREE.Texture> {
	return new Promise((resolve, reject) => {
		const loader = new THREE.TextureLoader()
		loader.load(url, (tex) => resolve(tex), undefined, (err) => reject(err))
	})
}

export function loadCubeTextures(urls: string[]): Promise<THREE.CubeTexture> {
	return new Promise((resolve, reject) => {
		const loader = new THREE.CubeTextureLoader()
		loader.load(urls, (tex) => resolve(tex), undefined, (err) => reject(err))
	})
}

export default { loadTexture, loadCubeTextures }
