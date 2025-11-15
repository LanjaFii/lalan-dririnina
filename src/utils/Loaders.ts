import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class LoaderManager {
  private gltfLoader: GLTFLoader
  private textureLoader: THREE.TextureLoader
  private loadedModels: Map<string, THREE.Group> = new Map()

  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.textureLoader = new THREE.TextureLoader()
  }

  // Méthode pour GLB (identique à GLTF en fait)
  public loadGLB(name: string, url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      console.log(`📦 Chargement GLB: ${url}`)
      this.gltfLoader.load(
        url,
        (gltf) => {
          console.log(`✅ GLB chargé: ${name}`, gltf)
          const model = gltf.scene
          this.setupModel(model)
          this.loadedModels.set(name, model)
          resolve(model)
        },
        (progress) => {
          // Progress callback
          if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total) * 100
            console.log(`📥 Progression ${name}: ${percent.toFixed(1)}%`)
          }
        },
        (error) => {
          console.error(`❌ Erreur chargement GLB ${name}:`, error)
          reject(error)
        }
      )
    })
  }

  // Gardez l'ancienne méthode pour compatibilité
  public loadGLTF(name: string, url: string): Promise<THREE.Group> {
    return this.loadGLB(name, url)
  }

  private setupModel(model: THREE.Group): void {
    console.log(`🔧 Configuration du modèle: ${model.children.length} enfants`)
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Debug: afficher les informations du mesh
        console.log(`   - Mesh: ${child.name || 'sans-nom'}, vertices: ${child.geometry.attributes.position.count}`)
        
        // Optimiser les matériaux
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat, index) => {
              console.log(`     Material ${index}:`, mat.type)
              this.optimizeMaterial(mat)
            })
          } else {
            console.log(`     Material:`, child.material.type)
            this.optimizeMaterial(child.material)
          }
        }
      }
    })
  }

  private optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = 0.8
      material.metalness = 0.2
    }
  }

  public getModel(name: string): THREE.Group | undefined {
    const model = this.loadedModels.get(name)
    return model ? model.clone() : undefined
  }

  public loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject)
    })
  }
}

export const loaderManager = new LoaderManager()