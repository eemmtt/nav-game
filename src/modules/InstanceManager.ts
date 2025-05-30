import * as THREE from 'three';

export class InstanceManager {
  private instancedMesh: THREE.InstancedMesh;
  private maxInstances: number;
  private activeInstances: number = 0;
  private availableIndices: number[] = [];
  
  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxInstances: number = 1000
  ) {
    this.maxInstances = maxInstances;
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    
    // Enable shadows
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    
    // Pre-populate available indices
    for (let i = 0; i < maxInstances; i++) {
      this.availableIndices.push(i);
    }
    
    // Hide all instances initially by placing them far away
    const hiddenMatrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
    for (let i = 0; i < maxInstances; i++) {
      this.instancedMesh.setMatrixAt(i, hiddenMatrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.computeBoundingSphere();
  }

  addInstance(position: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3): number | null {
    if (this.availableIndices.length === 0) {
      console.warn('No available instance slots');
      return null;
    }

    const index = this.availableIndices.pop()!;
    const matrix = new THREE.Matrix4();
    
    const finalScale = scale || new THREE.Vector3(1, 1, 1);
    const finalRotation = rotation || new THREE.Euler(0, 0, 0);
    
    matrix.compose(position, new THREE.Quaternion().setFromEuler(finalRotation), finalScale);
    
    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.computeBoundingSphere();
    
    this.activeInstances++;
    return index;
  }

  removeInstance(index: number): boolean {
    if (index >= this.maxInstances || this.availableIndices.includes(index)) {
      return false;
    }

    // Hide the instance by moving it far away
    const hiddenMatrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
    this.instancedMesh.setMatrixAt(index, hiddenMatrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    
    this.availableIndices.push(index);
    this.activeInstances--;
    return true;
  }

  updateInstance(index: number, position: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3): boolean {
    if (index >= this.maxInstances || this.availableIndices.includes(index)) {
      return false;
    }

    const matrix = new THREE.Matrix4();
    const finalScale = scale || new THREE.Vector3(1, 1, 1);
    const finalRotation = rotation || new THREE.Euler(0, 0, 0);
    
    matrix.compose(position, new THREE.Quaternion().setFromEuler(finalRotation), finalScale);
    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    
    return true;
  }

  getInstancedMesh(): THREE.InstancedMesh {
    return this.instancedMesh;
  }

  getActiveCount(): number {
    return this.activeInstances;
  }

  getPos(index: number): THREE.Vector3 | null {
    if (index >= this.maxInstances || this.availableIndices.includes(index)) {
      return null;
    }

    const matrix = new THREE.Matrix4();
    this.instancedMesh.getMatrixAt(index, matrix);
    
    const position = new THREE.Vector3();
    matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    
    return position;
  }
}