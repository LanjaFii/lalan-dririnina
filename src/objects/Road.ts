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
      color: 0x5D4037,
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0
    })

    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.z = zPosition
    ground.receiveShadow = true

    // ROUTE (asphalte plus clair pour mieux contraster avec les lignes)
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength)
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222, // Un peu plus clair que 0x111111
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    })

    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.z = zPosition
    road.receiveShadow = true

    // Lignes de voie - PLUS VISIBLES
    const laneWidth = this.roadWidth / this.laneCount
    const lineGeometry = new THREE.PlaneGeometry(0.15, this.segmentLength * 0.9) // Plus larges et plus longues
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00, // Jaune plus vif
      transparent: true,
      opacity: 0.9 // Moins transparent
    })

    // Lignes séparatrices
    for (let i = 1; i < this.laneCount; i++) {
      const x = -this.roadWidth / 2 + laneWidth * i
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.set(x, 0.03, zPosition) // Légèrement surélevé
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

    this.addNaturalElements(zPosition)
  }

  private addNaturalElements(zPosition: number): void {
    // ... (le reste reste identique)
  }

  public update(delta: number, carSpeed: number): void {
    const move = carSpeed * 60 * delta
    
    this.mesh.children.forEach(child => {
      child.position.z += move

      if (child.position.z > 120) {
        child.position.z -= this.segmentLength * 6
      }
    })
  }
}