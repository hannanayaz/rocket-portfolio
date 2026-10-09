// ==========================================
// ENVIRONMENT MODULE: Earth Ground, Gantry Tower & Isometric Camera
// ==========================================

export function setupCamera() {
    // Isometric perspective: high up, angled down, slightly shifted
    const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(16, 14, 22);
    camera.lookAt(0, 3, 0);
    return camera;
}

export function setupLighting(scene) {
    // Balanced ambient light (prevents dark spots without washing out colors)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.5);
    scene.add(ambientLight);

    // Soft directional sun with reduced intensity
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
    sunLight.position.set(15, 25, 12);
    scene.add(sunLight);

    // Muted sky background
    scene.background = new THREE.Color(0xbdd5ea);
}

export function createEarthGround(scene) {
    const earthGroup = new THREE.Group();

    // 1. Soft, warm grassy terrain (High polygon count: 128 segments to remove choppiness)
    const groundGeo = new THREE.CylinderGeometry(28, 28, 2, 128);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0xe9c46a, // Warm golden-peach ground tone like Bruno's landscape
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    earthGroup.add(ground);

    // 2. Smooth Launch Base Pad
    const baseGeo = new THREE.CylinderGeometry(4.8, 5.2, 0.6, 64);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x57606f,
        roughness: 0.6
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    earthGroup.add(base);

    // 3. Launch Service Tower with Proper Proportions
    const towerGeo = new THREE.BoxGeometry(0.8, 7.5, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({
        color: 0xd90429,
        metalness: 0.2,
        roughness: 0.4
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-2.2, 3.8, 0);
    earthGroup.add(tower);

    // Holding Clamp Arm hugging the upper fuselage
    const armGeo = new THREE.BoxGeometry(1.8, 0.35, 0.4);
    const arm = new THREE.Mesh(armGeo, towerMat);
    arm.position.set(-1.0, 5.2, 0);
    earthGroup.add(arm);

    // 4. Stylized Fluffy Trees (Like Bruno Simon's soft foliage)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.7, flatShading: true }); // Warm autumnal peach/coral

    const treePositions = [
        [-9, 6], [-11, -3], [10, 7], [12, -4], [-7, -10], [9, -9]
    ];

    treePositions.forEach(([x, z]) => {
        // Tree Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 16);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 0.8, z);
        earthGroup.add(trunk);

        // Multi-tier fluffy canopy (Rounded Dodecahedron)
        const foliageGeo = new THREE.DodecahedronGeometry(1.4, 1);
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(x, 2.6, z);
        earthGroup.add(foliage);
    });

    scene.add(earthGroup);
    return earthGroup;
}