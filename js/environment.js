// ==========================================
// ENVIRONMENT MODULE: Floating Earth Island, Gantry Tower & Isometric Lighting
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
    // 1. Soft sky and ground bounce via HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0xcae9ff, 0x3d3522, 0.7);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    // 2. Clear ambient fill to soften dark contours
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // 3. Warm directional sunlight with calibrated PCF soft shadows
    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.65);
    sunLight.position.set(18, 30, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 70;

    const d = 26;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;

    scene.add(sunLight);

    // 4. Fresh stylized atmospheric sky tone
    scene.background = new THREE.Color(0xbde0fe);
}

// Procedural high-contrast yellow & black hazard stripes texture
function createHazardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffb703'; // High-visibility hazard yellow
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = '#141414'; // Industrial matte black
    const stripeW = 32;
    for (let x = -64; x < 512 + 64; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x, 64);
        ctx.lineTo(x - stripeW, 64);
        ctx.closePath();
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 1);
    return texture;
}

export function createEarthGround(scene) {
    const earthGroup = new THREE.Group();

    // ==========================================
    // 1. CIRCULAR LAYERED FLOATING EARTH ISLAND
    // ==========================================
    // Top Grass Disc (Lush stylized green, Bruno Simon inspired)
    const grassGeo = new THREE.CylinderGeometry(28, 28, 1.2, 96);
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x3d7e48,
        roughness: 0.85,
        metalness: 0.05
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -0.6;
    grass.receiveShadow = true;
    earthGroup.add(grass);

    // Middle Sub-soil Tier (Dark earthy loam)
    const dirtGeo = new THREE.CylinderGeometry(27.8, 26.2, 2.0, 64);
    const dirtMat = new THREE.MeshStandardMaterial({
        color: 0x4d382c,
        roughness: 0.95
    });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -2.1;
    dirt.castShadow = true;
    dirt.receiveShadow = true;
    earthGroup.add(dirt);

    // Deep Tapered Bedrock Core (Elevated floating island cliff)
    const rockGeo = new THREE.CylinderGeometry(26.0, 16.0, 3.8, 32);
    const rockMat = new THREE.MeshStandardMaterial({
        color: 0x2b201a,
        roughness: 0.95,
        flatShading: true
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = -4.9;
    rock.castShadow = true;
    rock.receiveShadow = true;
    earthGroup.add(rock);

    // Launch Area Concrete Apron Clearing
    const apronGeo = new THREE.CylinderGeometry(7.2, 7.5, 0.08, 48);
    const apronMat = new THREE.MeshStandardMaterial({
        color: 0x5a6268,
        roughness: 0.8
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.y = 0.04;
    apron.receiveShadow = true;
    earthGroup.add(apron);

    // ==========================================
    // 2. LAYERED LAUNCHPAD WITH HAZARD STRIPES
    // ==========================================
    // Platform Riser Base
    const riserGeo = new THREE.CylinderGeometry(5.4, 5.7, 0.35, 64);
    const riserMat = new THREE.MeshStandardMaterial({
        color: 0x343a40,
        roughness: 0.7
    });
    const riser = new THREE.Mesh(riserGeo, riserMat);
    riser.position.y = 0.22;
    riser.castShadow = true;
    riser.receiveShadow = true;
    earthGroup.add(riser);

    // Upper Steel Blast Deck
    const deckGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.3, 64);
    const deckMat = new THREE.MeshStandardMaterial({
        color: 0x212529,
        roughness: 0.5
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.52;
    deck.castShadow = true;
    deck.receiveShadow = true;
    earthGroup.add(deck);

    // Hazard Stripes Rim (Side band & Flat upper border)
    const hazardTex = createHazardTexture();
    const hazardSideGeo = new THREE.CylinderGeometry(4.82, 4.82, 0.18, 64, 1, true);
    const hazardSideMat = new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.4
    });
    const hazardSide = new THREE.Mesh(hazardSideGeo, hazardSideMat);
    hazardSide.position.y = 0.52;
    earthGroup.add(hazardSide);

    const hazardTopGeo = new THREE.RingGeometry(4.35, 4.8, 64);
    const hazardTopMat = new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.4,
        side: THREE.DoubleSide
    });
    const hazardTop = new THREE.Mesh(hazardTopGeo, hazardTopMat);
    hazardTop.rotation.x = -Math.PI / 2;
    hazardTop.position.y = 0.68;
    hazardTop.receiveShadow = true;
    earthGroup.add(hazardTop);

    // Exhaust Blast Grate directly underneath rocket (-0.9, 0.3, -0.6)
    const blastGrateGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.06, 32);
    const blastGrateMat = new THREE.MeshStandardMaterial({
        color: 0x14181f,
        roughness: 0.4,
        metalness: 0.6
    });
    const blastGrate = new THREE.Mesh(blastGrateGeo, blastGrateMat);
    blastGrate.position.set(-0.9, 0.7, -0.6);
    blastGrate.receiveShadow = true;
    earthGroup.add(blastGrate);

    // ==========================================
    // 3. INDUSTRIAL GANTRY TOWER & SERVICE ARMS
    // ==========================================
    // Gantry positioned at (-2.5, y, -0.6) aligned with rocket at (-0.9, y, -0.6)
    const gantryGroup = new THREE.Group();
    const towerX = -2.5;
    const towerZ = -0.6;
    const towerW = 0.6; // half-width
    const towerD = 0.6; // half-depth
    const towerH = 8.2;

    const gantryMat = new THREE.MeshStandardMaterial({
        color: 0xe63946, // Industrial safety orange-red
        metalness: 0.3,
        roughness: 0.45
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
        color: 0x2b2d42,
        metalness: 0.5,
        roughness: 0.5
    });

    // 4 Vertical structural corner columns
    const colGeo = new THREE.BoxGeometry(0.16, towerH, 0.16);
    const colOffsets = [
        [-towerW, -towerD],
        [towerW, -towerD],
        [-towerW, towerD],
        [towerW, towerD]
    ];
    colOffsets.forEach(([ox, oz]) => {
        const col = new THREE.Mesh(colGeo, gantryMat);
        col.position.set(towerX + ox, 0.68 + towerH / 2, towerZ + oz);
        col.castShadow = true;
        col.receiveShadow = true;
        gantryGroup.add(col);
    });

    // Horizontal structural tie-beam frames at multiple tier heights
    const tierHeights = [2.0, 3.5, 5.0, 6.5, 8.0];
    const beamGeoX = new THREE.BoxGeometry(towerW * 2, 0.12, 0.12);
    const beamGeoZ = new THREE.BoxGeometry(0.12, 0.12, towerD * 2);

    tierHeights.forEach((h) => {
        // Back beam (+Z)
        const b1 = new THREE.Mesh(beamGeoX, gantryMat);
        b1.position.set(towerX, h, towerZ + towerD);
        b1.castShadow = true;
        gantryGroup.add(b1);

        // Left beam (-X)
        const b2 = new THREE.Mesh(beamGeoZ, gantryMat);
        b2.position.set(towerX - towerW, h, towerZ);
        b2.castShadow = true;
        gantryGroup.add(b2);

        // Right beam (+Z side, -Z)
        const b3 = new THREE.Mesh(beamGeoX, gantryMat);
        b3.position.set(towerX, h, towerZ - towerD);
        b3.castShadow = true;
        gantryGroup.add(b3);

        // Steel walkway grating on selected tiers
        if (h === 5.0 || h === 8.0) {
            const platformGeo = new THREE.BoxGeometry(towerW * 2.2, 0.08, towerD * 2.2);
            const platform = new THREE.Mesh(platformGeo, darkSteelMat);
            platform.position.set(towerX, h + 0.06, towerZ);
            platform.castShadow = true;
            platform.receiveShadow = true;
            gantryGroup.add(platform);
        }
    });

    // Diagonal X-bracing trusses on back face (+Z)
    for (let i = 0; i < tierHeights.length - 1; i++) {
        const y1 = tierHeights[i];
        const y2 = tierHeights[i + 1];
        const midY = (y1 + y2) / 2;
        const diagLen = Math.hypot(towerW * 2, y2 - y1);
        const diagGeo = new THREE.BoxGeometry(diagLen, 0.08, 0.08);

        const strutAngle = Math.atan2(y2 - y1, towerW * 2);

        const d1 = new THREE.Mesh(diagGeo, gantryMat);
        d1.position.set(towerX, midY, towerZ + towerD);
        d1.rotation.z = strutAngle;
        d1.castShadow = true;
        gantryGroup.add(d1);

        const d2 = new THREE.Mesh(diagGeo, gantryMat);
        d2.position.set(towerX, midY, towerZ + towerD);
        d2.rotation.z = -strutAngle;
        d2.castShadow = true;
        gantryGroup.add(d2);
    }

    // Umbilical Service Arms reaching toward the rocket at (-0.9, y, -0.6)
    // 1. Lower Fuel Umbilical Arm
    const lowerArmGeo = new THREE.BoxGeometry(1.4, 0.22, 0.3);
    const lowerArm = new THREE.Mesh(lowerArmGeo, gantryMat);
    lowerArm.position.set(-1.6, 3.4, -0.6);
    lowerArm.castShadow = true;
    lowerArm.receiveShadow = true;
    gantryGroup.add(lowerArm);

    // Lower Arm Clamp Collar
    const lowerClampGeo = new THREE.BoxGeometry(0.35, 0.35, 0.9);
    const lowerClamp = new THREE.Mesh(lowerClampGeo, darkSteelMat);
    lowerClamp.position.set(-1.0, 3.4, -0.6);
    lowerClamp.castShadow = true;
    gantryGroup.add(lowerClamp);

    // 2. Upper Fuselage Support Arm (holding clamp)
    const upperArmGeo = new THREE.BoxGeometry(1.5, 0.26, 0.35);
    const upperArm = new THREE.Mesh(upperArmGeo, gantryMat);
    upperArm.position.set(-1.55, 5.2, -0.6);
    upperArm.castShadow = true;
    upperArm.receiveShadow = true;
    gantryGroup.add(upperArm);

    // Upper Arm Hugging Clamp
    const upperClampGeo = new THREE.BoxGeometry(0.3, 0.4, 1.0);
    const upperClamp = new THREE.Mesh(upperClampGeo, darkSteelMat);
    upperClamp.position.set(-0.95, 5.2, -0.6);
    upperClamp.castShadow = true;
    gantryGroup.add(upperClamp);

    // Top Tower Beacon Warning Lights
    const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff0033,
        emissive: 0xff1e00,
        emissiveIntensity: 1.5,
        roughness: 0.2
    });
    const bLight1 = new THREE.Mesh(beaconGeo, beaconMat);
    bLight1.position.set(towerX - towerW, 8.88, towerZ - towerD);
    gantryGroup.add(bLight1);

    const bLight2 = new THREE.Mesh(beaconGeo, beaconMat);
    bLight2.position.set(towerX + towerW, 8.88, towerZ + towerD);
    gantryGroup.add(bLight2);

    earthGroup.add(gantryGroup);

    // ==========================================
    // 4. STYLIZED LOW-POLY TREES
    // ==========================================
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x5e412f,
        roughness: 0.95
    });

    const canopyColors = [
        0x2d6a4f, // Deep forest green
        0x40916c, // Lush emerald
        0x52b788, // Crisp light green
        0x38b000, // Vibrant spring green
        0x588157  // Warm olive green
    ];

    // Seeded coordinate distribution around the perimeter
    // Ensuring radius between 11.5 and 25.5, excluding launch clearing area
    const treeCoords = [
        // North / Back-left cluster
        [-13, -11], [-16, -9], [-11, -15], [-18, -13], [-8, -19], [-14, -18],
        // North-East / Back-right cluster
        [11, -13], [15, -10], [9, -17], [16, -15], [7, -21], [13, -19],
        // West / Left flank
        [-14, 2], [-18, 5], [-15, 8], [-19, -2], [-22, 3],
        // East / Right flank
        [14, 3], [18, 6], [15, 9], [19, -1], [22, 4],
        // South-West / Front-left cluster
        [-12, 14], [-15, 17], [-9, 19], [-16, 12],
        // South-East / Front-right cluster
        [11, 15], [15, 16], [8, 20], [14, 12]
    ];

    treeCoords.forEach(([x, z], index) => {
        const treeGroup = new THREE.Group();
        const treeType = index % 2; // Alternating pine conifer vs fluffy deciduous
        const color = canopyColors[index % canopyColors.length];
        const folMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            flatShading: true
        });

        if (treeType === 0) {
            // Variety A: Layered Conifer / Pine
            const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.7;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            treeGroup.add(trunk);

            // 3 Stacked Cones
            const tierConfigs = [
                { r: 1.25, h: 1.35, y: 1.5 },
                { r: 0.95, h: 1.2,  y: 2.3 },
                { r: 0.65, h: 1.0,  y: 3.0 }
            ];
            tierConfigs.forEach(({ r, h, y }) => {
                const coneGeo = new THREE.ConeGeometry(r, h, 8);
                const cone = new THREE.Mesh(coneGeo, folMat);
                cone.position.y = y;
                cone.castShadow = true;
                cone.receiveShadow = true;
                treeGroup.add(cone);
            });
        } else {
            // Variety B: Stylized Low-Poly Deciduous
            const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.6, 8);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.8;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            treeGroup.add(trunk);

            // Primary Low-Poly Canopy
            const mainCanopyGeo = new THREE.DodecahedronGeometry(1.3, 1);
            const mainCanopy = new THREE.Mesh(mainCanopyGeo, folMat);
            mainCanopy.position.y = 2.4;
            mainCanopy.castShadow = true;
            mainCanopy.receiveShadow = true;
            treeGroup.add(mainCanopy);

            // Secondary offset canopy clump
            const subCanopyGeo = new THREE.DodecahedronGeometry(0.85, 1);
            const subCanopy = new THREE.Mesh(subCanopyGeo, folMat);
            subCanopy.position.set(0.35, 2.7, 0.25);
            subCanopy.castShadow = true;
            subCanopy.receiveShadow = true;
            treeGroup.add(subCanopy);
        }

        // Varied scale and rotation
        const scale = 0.8 + ((index * 7) % 5) * 0.1; // 0.8 to 1.2
        const rotY = (index * 1.37) % (Math.PI * 2);
        treeGroup.scale.set(scale, scale, scale);
        treeGroup.rotation.y = rotY;
        treeGroup.position.set(x, 0, z);

        earthGroup.add(treeGroup);
    });

    scene.add(earthGroup);
    return earthGroup;
}