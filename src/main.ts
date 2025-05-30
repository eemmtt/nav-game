// Import required classes from PixiJS and Three.js
import { Container, Graphics, Rectangle, Text, WebGLRenderer } from 'pixi.js';
import * as THREE from 'three';
import { EventForwarder } from './modules/eventForwarder';
import { OrbitalControls } from './modules/orbitalControls';
import { drawGroundPlane, drawOrigin } from './modeling';
import { Ui2D, type UiProps } from './modules/Ui2D';
import { SceneManager } from './modules/SceneManager';

async function setup(){

  let WIDTH = window.innerWidth;
  let HEIGHT = window.innerHeight;
  const GRIDSIZE = 12;
  const CELLSCALE = 5;

  // THREE
  const threeRenderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
  threeRenderer.setSize(WIDTH, HEIGHT);
  threeRenderer.setClearColor(0xdddddd, 1);
  threeRenderer.shadowMap.enabled = true;
  threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  document.body.appendChild(threeRenderer.domElement);

  // init scene setup
  const scene = new THREE.Scene();
  const threeCamera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT);
  threeCamera.position.set(0,50,50);
  threeCamera.lookAt(new THREE.Vector3(0,0,0));
  scene.add(threeCamera);

  const directionalLight = new THREE.DirectionalLight(0xffffee, 5);
  directionalLight.position.set(15, 50, 15);
  directionalLight.rotateX(Math.PI * 0.1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  drawGroundPlane(scene, GRIDSIZE, CELLSCALE);
  drawOrigin(scene);

  const sceneManager = new SceneManager(scene, GRIDSIZE, CELLSCALE);
  try {
    await sceneManager.init();
  } catch (err) {
    console.log("SceneManager.init() error:", err);
  }
 

  // PIXI
  const pixiRenderer = new WebGLRenderer();
  await pixiRenderer.init({
      context: threeRenderer.getContext() as WebGL2RenderingContext,
      width: WIDTH,
      height: HEIGHT,
      clearBeforeRender: false, // Don't clear the canvas as Three.js will handle that
  });

  // Create PixiJS scene graph
  const stage = new Container();
  stage.hitArea = pixiRenderer.screen;
  stage.eventMode = 'static';

  // Set up event forwarding from Three.js canvas to Pixi.js
  const eventForwarder = new EventForwarder(threeRenderer.domElement, stage);

  // Set up orbital controls for the camera
  const controls = new OrbitalControls(threeCamera, new THREE.Vector3(0, 0, 0));

  
  const uiprops: UiProps = {
    parent: stage,
    rect: new Rectangle(50, 50, 300, 300),
    sceneManager: sceneManager,
  } 
  const ui = new Ui2D(uiprops);

  function loop()
  {
      // Update orbital controls
      controls.update();
     
      // Render Three.js scene
      threeRenderer.resetState();
      threeRenderer.render(scene, threeCamera);

      // Render PixiJS scene
      pixiRenderer.resetState();
      pixiRenderer.render({ container: stage });

      // Continue animation loop
      requestAnimationFrame(loop);
  }

  // Start animation loop
  requestAnimationFrame(loop);

  // Handle window resizing
  window.addEventListener('resize', () =>
  {
      WIDTH = window.innerWidth;
      HEIGHT = window.innerHeight;

      // Update Three.js renderer
      threeRenderer.setSize(WIDTH, HEIGHT);
      // Update Three.js camera aspect ratio so it renders correctly
      threeCamera.aspect = WIDTH / HEIGHT;
      threeCamera.updateProjectionMatrix();

      // Update PixiJS renderer
      pixiRenderer.resize(WIDTH, HEIGHT);
  });
};

setup();
