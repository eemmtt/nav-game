import { Mesh, SphereGeometry, MeshBasicMaterial, CylinderGeometry, PlaneGeometry, type Scene, MeshPhysicalMaterial } from "three";

export function drawOrigin(scene: Scene){
    const origin = new Mesh(
        new SphereGeometry( 1, 6, 6),
        new MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
      );
    
    const axisY = new Mesh(
    new CylinderGeometry(0.25,0.25,10,6,10,false),
    new MeshBasicMaterial( { color: 0x00ff00, wireframe: true } )
    );
    axisY.position.set(0,5,0);

    const axisX = new Mesh(
    new CylinderGeometry(0.25,0.25,10,6,10,false),
    new MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
    );
    axisX.position.set(5,0,0);
    axisX.rotateZ(-Math.PI * 0.5);

    const axisZ = new Mesh(
    new CylinderGeometry(0.25,0.25,10,6,10,false),
    new MeshBasicMaterial( { color: 0x0000ff, wireframe: true } )
    );
    axisZ.position.set(0,0,5);
    axisZ.rotateX(-Math.PI * 0.5);
    scene.add( origin, axisY, axisX, axisZ );

}

export function drawGroundPlane(scene: Scene, gridSize: number, cellScale: number){
    const ground = new Mesh(
        new PlaneGeometry( gridSize * cellScale * 2, gridSize * cellScale * 2, gridSize, gridSize),
        new MeshPhysicalMaterial( { color: 0x777877, wireframe: true } )
    );
    ground.rotateX(-Math.PI * 0.5);
    //ground.receiveShadow = true;
    scene.add(ground);
}