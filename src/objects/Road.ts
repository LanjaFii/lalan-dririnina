import * as THREE from 'three'

export class Road {
  public mesh: THREE.Group
  private roadSegments: THREE.Mesh[] = []
  private groundSegments: THREE.Mesh[] = []
  private segmentLength: number = 60
  public roadWidth: number = 12
  private laneCount: number = 4
  private groundWidth: number = 50

  constructor() {
    this.mesh = new THREE.Group()
    this.createRoad()
  }

  private createRoad(): void {
    for (let i = 0; i < 6; i++) {
      this.createRoadSegment(i * this.segmentLength)
    }
  }

  private createRoadSegment(zPosition: number): void {
    // SOL (terre) sur les côtés
    const groundGeometry = new THREE.PlaneGeometry(this.groundWidth, this.segmentLength)
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5D4037, // Marron terre
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0
    })

    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.z = zPosition
    ground.receiveShadow = true

    // ROUTE (asphalte)
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength)
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1
    })

    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.z = zPosition
    road.receiveShadow = true

    // Lignes de voie
    const laneWidth = this.roadWidth / this.laneCount
    const lineGeometry = new THREE.PlaneGeometry(0.1, this.segmentLength * 0.8)
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffd200,
      transparent: true,
      opacity: 0.8
    })

    // Lignes séparatrices
    for (let i = 1; i < this.laneCount; i++) {
      const x = -this.roadWidth / 2 + laneWidth * i
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.set(x, 0.02, zPosition)
      
      // Animation des lignes (clignotement)
      line.userData = { offset: Math.random() * Math.PI }
      this.mesh.add(line)
    }

    // Bordures de route
    const borderGeometry = new THREE.BoxGeometry(0.2, 0.1, this.segmentLength)
    const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 })
    
    const leftBorder = new THREE.Mesh(borderGeometry, borderMaterial)
    leftBorder.position.set(-this.roadWidth/2 - 0.1, 0.05, zPosition)
    
    const rightBorder = new THREE.Mesh(borderGeometry, borderMaterial)
    rightBorder.position.set(this.roadWidth/2 + 0.1, 0.05, zPosition)

    this.mesh.add(ground)
    this.mesh.add(road)
    this.mesh.add(leftBorder)
    this.mesh.add(rightBorder)
    
    this.roadSegments.push(road)
    this.groundSegments.push(ground)

    // Ajouter de l'herbe et des éléments naturels
    this.addNaturalElements(zPosition)
  }

  private addNaturalElements(zPosition: number): void {
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x336633,
      side: THREE.DoubleSide,
      roughness: 0.9
    })

    // Herbe entre la route et le sol
    const grassWidth = 3
    const leftGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(grassWidth, this.segmentLength),
      grassMaterial
    )
    leftGrass.rotation.x = -Math.PI / 2
    leftGrass.position.set(-this.roadWidth/2 - grassWidth/2, 0.01, zPosition)

    const rightGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(grassWidth, this.segmentLength),
      grassMaterial
    )
    rightGrass.rotation.x = -Math.PI / 2
    rightGrass.position.set(this.roadWidth/2 + grassWidth/2, 0.01, zPosition)

    this.mesh.add(leftGrass)
    this.mesh.add(rightGrass)
  }

  public update(delta: number, carSpeed: number): void {
    const move = carSpeed * 60 * delta
    
    this.mesh.children.forEach(child => {
      child.position.z += move

      if (child.position.z > 120) {
        child.position.z -= this.segmentLength * 6
      }

      // Animation des lignes de voie (si c'est un Mesh avec PlaneGeometry)
      const meshChild = child as THREE.Mesh
      if (meshChild.geometry instanceof THREE.PlaneGeometry) {
        const time = performance.now() * 0.001
        const opacity = 0.6 + Math.sin(time * 5 + (meshChild.userData?.offset || 0)) * 0.3
        if (meshChild.material instanceof THREE.MeshBasicMaterial) {
          meshChild.material.opacity = opacity
        }
      }
    })
  }
}