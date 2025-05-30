import * as THREE from 'three';

export class OrbitalControls {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private radius: number;
  private angle: number;
  private elevation: number;
  private keyStates: { [key: string]: boolean } = {};
  private rotationSpeed: number;

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Vector3 = new THREE.Vector3(0, 0, 0), rotationSpeed: number = 0.02) {
    this.camera = camera;
    this.target = target;
    this.rotationSpeed = rotationSpeed;

    // Calculate initial orbital parameters from current camera position
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    //console.log("Initial offset:", offset);
    const offsetPlane = new THREE.Vector2(offset.x, offset.z);
    this.radius = offsetPlane.length();
    this.angle = Math.atan2(offset.x, offset.z);
    this.elevation = camera.position.y; // Keep the camera's current Y position


    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent) {
    this.keyStates[event.code] = true;
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keyStates[event.code] = false;
  }

  update() {
    let angleChanged = false;

    // Handle left/right rotation
    if (this.keyStates['ArrowLeft']) {
      this.angle += this.rotationSpeed;
      angleChanged = true;
    }
    if (this.keyStates['ArrowRight']) {
      this.angle -= this.rotationSpeed;
      angleChanged = true;
    }

    // Update camera position if angle changed
    if (angleChanged) {
      this.updateCameraPosition();
    }
  }

  private updateCameraPosition() {
    // Calculate new camera position rotating only around Y-axis
    // Since angle = atan2(x, z), we need x = r*sin(angle), z = r*cos(angle)
    const x = this.radius * Math.sin(this.angle);
    const z = this.radius * Math.cos(this.angle);

    const newPos = new THREE.Vector3(
      this.target.x + x,
      this.elevation,
      this.target.z + z
    );

    this.camera.position.copy(newPos);
    this.camera.lookAt(this.target);
  }

  setTarget(target: THREE.Vector3) {
    this.target = target;
    this.updateCameraPosition();
  }

  setRadius(radius: number) {
    this.radius = radius;
    this.updateCameraPosition();
  }

  setRotationSpeed(speed: number) {
    this.rotationSpeed = speed;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
  }
}