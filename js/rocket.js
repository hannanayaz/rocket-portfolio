// ==========================================
// ROCKET MODULE: Full 5-Piece Assembled Rocket
// ==========================================

export function createRocket(scene, onLoadedCallback) {
    const loader = new THREE.GLTFLoader();
    const rocketGroup = new THREE.Group();

    const loadPart = (filename) => {
        return new Promise((resolve, reject) => {
            loader.load(
                `assets/${filename}`,
                (gltf) => {
                    const model = gltf.scene;

                    // Enable shadow casting and receiving on all child meshes
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Measure bounding box to normalize X/Z centering and bottom Y
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());

                    // Compensate for exporter translation offset so the part is centered at (0, 0)
                    model.position.x -= center.x;
                    model.position.z -= center.z;
                    model.position.y -= box.min.y;

                    // Wrap in a dedicated part pivot group
                    const partGroup = new THREE.Group();
                    partGroup.add(model);

                    const height = box.max.y - box.min.y;
                    resolve({ group: partGroup, height: height });
                },
                undefined,
                (err) => reject(err)
            );
        });
    };

    Promise.all([
        loadPart('rocket_baseA.glb'),
        loadPart('rocket_fuelA.glb'),
        loadPart('rocket_topA.glb'),
        loadPart('rocket_sidesA.glb'),
        loadPart('rocket_finsA.glb')
    ])
        .then(([baseData, fuelData, topData, sidesData, finsData]) => {
            const base = baseData.group;
            const fuel = fuelData.group;
            const top = topData.group;
            const sides = sidesData.group;
            const fins = finsData.group;

            // 1. Base booster module (measured height: 1.6)
            base.position.set(0, 0, 0);
            rocketGroup.add(base);

            // 2. Fins locked onto base fuselage collar (measured height: 0.7, spans y=0.8 to 1.5)
            fins.position.set(0, 0.8, 0);
            rocketGroup.add(fins);

            // 3. Lower fuselage with side details (measured height: 1.0, spans y=1.6 to 2.6)
            // Sits flush on top of the base booster
            const sidesY = baseData.height;
            sides.position.set(0, sidesY, 0);
            rocketGroup.add(sides);

            // 4. Upper fuel tank stage (measured height: 0.5, spans y=2.6 to 3.1)
            // Sits flush on top of the sides module
            const fuelY = sidesY + sidesData.height;
            fuel.position.set(0, fuelY, 0);
            rocketGroup.add(fuel);

            // 5. Nose cone sitting flush on top of fuel tank (measured height: 0.8, spans y=3.1 to 3.9)
            // Completely eliminates the previous 0.8-unit gap
            const topY = fuelY + fuelData.height;
            top.position.set(0, topY, 0);
            rocketGroup.add(top);

            // Scale and dock the rocket on the launchpad at (-0.9, 0.72, -0.6)
            // Flush with the blast deflector grate and embraced by the gantry service arms
            rocketGroup.scale.set(1.9, 1.9, 1.9);
            rocketGroup.position.set(-0.9, 0.72, -0.6);

            scene.add(rocketGroup);

            if (onLoadedCallback) onLoadedCallback(rocketGroup);
        })
        .catch((err) => {
            console.error('Error loading rocket parts:', err);
        });
}