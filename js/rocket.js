// ==========================================
// ROCKET MODULE: 3D Model & Thruster Engine
// ==========================================

export function createRocket(scene) {
    const rocketGroup = new THREE.Group();

    // 1. Rocket Fuselage (White Body)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.7, 3, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.2,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    rocketGroup.add(body);

    // 2. Nose Cone (Red Top)
    const noseGeo = new THREE.ConeGeometry(0.5, 1.2, 32);
    const redMat = new THREE.MeshStandardMaterial({
        color: 0xe63946,
        metalness: 0.1,
        roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeo, redMat);
    nose.position.y = 3.6;
    rocketGroup.add(nose);

    // 3. Fins (Left and Right Stabilization Wings)
    const finGeo = new THREE.BoxGeometry(0.12, 0.8, 0.8);
    const leftFin = new THREE.Mesh(finGeo, redMat);
    leftFin.position.set(-0.75, 0.6, 0);
    rocketGroup.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, redMat);
    rightFin.position.set(0.75, 0.6, 0);
    rocketGroup.add(rightFin);

    // 4. Exhaust Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.4, 24);
    const nozzleMat = new THREE.MeshStandardMaterial({
        color: 0x222225,
        metalness: 0.8,
        roughness: 0.4
    });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.y = -0.2;
    rocketGroup.add(nozzle);

    // 5. Dock the rocket on the Launchpad platform & Scale to match the tower
    rocketGroup.scale.set(1.5, 1.5, 1.5); // Makes the rocket 50% larger and thicker
    rocketGroup.position.set(0, 0.4, 0);

    scene.add(rocketGroup);
    return rocketGroup;
}
