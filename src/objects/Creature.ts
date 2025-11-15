import * as THREE from 'three'

export class CreatureManager {
  private creatures: THREE.Object3D[] = []
  private spawnTimer: number = 0
  private scene: THREE.Scene
  private roadWidth: number = 12
  private laneCenters: number[] = []
  private laneCount: number = 4

  constructor(scene: THREE.Scene, roadWidth: number = 12) {
    this.scene = scene
    this.roadWidth = roadWidth
    this.laneCount = 4
    const laneWidth = this.roadWidth / this.laneCount
    this.laneCenters = []
    for (let i = 0; i < this.laneCount; i++) {
      const x = -this.roadWidth / 2 + laneWidth * (i + 0.5)
      this.laneCenters.push(x)
    }
  }

  private createRandomCreature(): THREE.Object3D {
    const types = [
      () => new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 1.2, 6),
        new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          metalness: 0.2,
          roughness: 0.8
        })
      ),
      () => new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x2F4F4F,
          metalness: 0.3,
          roughness: 0.7
        })
      ),
      () => {
        const group = new THREE.Group()
        const body = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x800020 })
        )
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 6, 4),
          new THREE.MeshStandardMaterial({ color: 0x600010 })
        )
        head.position.y = 0.8
        group.add(body)
        group.add(head)
        return group
      }
    ]
    
    const creature = types[Math.floor(Math.random() * types.length)]()
    // cast to Object3D to allow Mesh or Group
    ;(creature as THREE.Object3D).castShadow = true
    return creature as THREE.Object3D
  }

  public spawnCreature(): void {
    const laneIndex = Math.floor(Math.random() * this.laneCount)
    const x = this.laneCenters[laneIndex]
    const z = -40 - Math.random() * 20 // Devant la voiture
    
    const creature = this.createRandomCreature()
    creature.position.set(x, 0.6, z)
    creature.rotation.y = Math.random() * Math.PI * 2
    
    // Animation d'apparition
    creature.scale.set(0.1, 0.1, 0.1)
    creature.userData = { 
      spawnTime: performance.now(),
      lane: laneIndex,
      baseY: 0.6
    }

    this.creatures.push(creature)
      this.scene.add(creature)

    // Animation d'apparition
    const scaleUp = () => {
      creature.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      if (creature.scale.x < 0.95) {
        requestAnimationFrame(scaleUp)
      }
    }
    scaleUp()
  }

  public update(delta: number, carPosition: THREE.Vector3): void {
    this.spawnTimer += delta
    
    // Spawn plus fréquent avec la vitesse
    const spawnChance = Math.min(0.1 + (carPosition.length() * 0.001), 0.5)
    if (this.spawnTimer > 1.5 && Math.random() < spawnChance) {
      this.spawnCreature()
      this.spawnTimer = 0
    }

    // Mettre à jour les créatures existantes
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const creature = this.creatures[i]
      
      // Animation de flottement
      const time = performance.now() * 0.001
      creature.position.y = creature.userData.baseY + Math.sin(time + i) * 0.1
      creature.rotation.y += delta * 0.5

      // Les créatures se rapprochent de la voiture
      creature.position.z += delta * 5

      // Supprimer les créatures derrière la voiture
      if (creature.position.z > carPosition.z + 10) {
        this.scene.remove(creature)
          // Dispose des géométries et matériaux si c'est un Mesh, sinon traverser
          if (creature instanceof THREE.Mesh) {
            if (creature.geometry) creature.geometry.dispose()
            if (Array.isArray(creature.material)) {
              creature.material.forEach(m => m.dispose())
            } else if (creature.material) {
              (creature.material as THREE.Material).dispose()
            }
          } else {
            creature.traverse((child) => {
              if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
              const mat = (child as THREE.Mesh).material as any
              if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose())
              else if (mat && mat.dispose) mat.dispose()
            })
          }
        this.creatures.splice(i, 1)
      }
    }
  }

  public checkCollision(target: THREE.Object3D): boolean {
    const targetBox = new THREE.Box3().setFromObject(target)
    targetBox.expandByScalar(0.5) // Marge de collision
    
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i]
      const box = new THREE.Box3().setFromObject(c)
      
      if (box.intersectsBox(targetBox)) {
        // Effet de collision
        this.scene.remove(c)
          if (c instanceof THREE.Mesh) {
            if (c.geometry) c.geometry.dispose()
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose())
            else if (c.material) (c.material as THREE.Material).dispose()
          } else {
            c.traverse((child) => {
              if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
              const mat = (child as THREE.Mesh).material as any
              if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose())
              else if (mat && mat.dispose) mat.dispose()
            })
          }
        this.creatures.splice(i, 1)
        return true
      }
    }
    return false
  }
}