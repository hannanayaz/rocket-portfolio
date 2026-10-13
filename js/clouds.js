
// ==========================================
// LOW-POLY CLOUDS
// ==========================================

const cloudGroups = [];

// Create the cloud layers around the launch island.
export function createClouds(scene) {
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xf1f4f8,
        roughness: 1,
        flatShading: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
    });

    function createCloud(x, y, z, scale = 1) {
        const cloud = new THREE.Group();
        const puffCount = 5 + Math.floor(Math.random() * 3);

        for (let i = 0; i < puffCount; i++) {
            const geometry = new THREE.IcosahedronGeometry(1, 1);
            const puff = new THREE.Mesh(
                geometry,
                cloudMaterial.clone()
            );

            puff.material.color.set(
                i % 3 === 0 ? 0xdce5f0 : 0xf4f6fa
            );

            puff.position.set(
                (i - (puffCount - 1) / 2) * 0.65,
                Math.random() * 0.35,
                (Math.random() - 0.5) * 0.8
            );

            puff.scale.set(
                0.8 + Math.random() * 0.5,
                0.65 + Math.random() * 0.4,
                0.7 + Math.random() * 0.4
            );

            puff.castShadow = false;
            puff.receiveShadow = false;
            cloud.add(puff);
        }

        cloud.position.set(x, y, z);
        cloud.scale.setScalar(scale);
        cloud.userData.fadeStartY = y + scale * 1.7;

        scene.add(cloud);
        cloudGroups.push(cloud);

        return cloud;
    }

    // Layer 1: Clouds around the launch island.
    createCloud(-13, 9, -5, 2.0);
    createCloud(14, 12, -8, 2.3);
    createCloud(-16, 16, 9, 2.5);
    createCloud(17, 18, 7, 2.0);

    // Layer 2: Higher clouds.
    createCloud(-9, 23, -16, 2.4);
    createCloud(11, 27, 15, 2.6);
    createCloud(-23, 31, -10, 2.2);
    createCloud(24, 34, -15, 2.5);

    // Layer 3: Foreground clouds.
    createCloud(-7, 13, 5, 1.8);
    createCloud(8, 17, 4, 2.0);
    createCloud(-12, 25, 8, 2.2);
    createCloud(13, 29, 6, 2.1);

    // Layer 4: Distant clouds.
    createCloud(-28, 20, -25, 2.8);
    createCloud(29, 25, -28, 2.6);
    createCloud(-20, 39, 12, 2.5);
    createCloud(21, 43, 10, 2.8);

    // Layer 5: High-altitude clouds.
    createCloud(-12, 52, -18, 2.7);
    createCloud(15, 59, 20, 3.0);
    createCloud(-30, 65, 0, 2.6);
    createCloud(30, 72, -12, 2.9);

    // Layer 6: Final clouds before the camera transition.
    createCloud(-18, 79, -14, 2.8);
    createCloud(19, 84, 16, 3.0);
    createCloud(-27, 91, 8, 2.6);
    createCloud(28, 96, -18, 2.8);

    return cloudGroups;
}

// Fade each cloud as the rocket passes its upper edge.
export function updateClouds(rocketY) {
    let allCloudsCleared = true;

    for (const cloud of cloudGroups) {
        const fadeProgress = THREE.MathUtils.clamp(
            (rocketY - cloud.userData.fadeStartY) / 16,
            0,
            1
        );

        const opacity = 0.95 * (1 - fadeProgress);
        cloud.visible = opacity > 0.01;

        for (const puff of cloud.children) {
            puff.material.opacity = opacity;
        }

        if (opacity > 0.01) {
            allCloudsCleared = false;
        }
    }

    return allCloudsCleared;
}

// Get the highest cloud edge.
export function getCloudClearanceHeight() {
    if (cloudGroups.length === 0) return 0;

    return Math.max(
        ...cloudGroups.map(
            cloud => cloud.userData.fadeStartY
        )
    );
}
