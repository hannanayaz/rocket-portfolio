// ==========================================
// 1. SCENE, CAMERA & LIGHTING (REAL 3D PERSPECTIVE)
// ==========================================
const canvas = document.getElementById('game-canvas');
const scene = new THREE.Scene();

// Angled isometric-style camera to show full depth and volume
const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Tilted high and slightly off-center (Isometric depth)
camera.position.set(0, -7, 13);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Bright directional sun + ambient light for deep shadows & 3D bevel highlights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
sunLight.position.set(12, 18, 10);
scene.add(sunLight);

const backLight = new THREE.DirectionalLight(0x4cc9f0, 0.6); // Cyan rim light for 3D edges
backLight.position.set(-10, -5, -5);
scene.add(backLight);

// ==========================================
// 2. DETAILED 3D ROCKET ASSEMBLY
// ==========================================
const rocketGroup = new THREE.Group();

// Fuselage (Cylinder)
const bodyGeo = new THREE.CylinderGeometry(0.5, 0.7, 3, 32);
const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf0f3f6,
    metalness: 0.2,
    roughness: 0.3
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
rocketGroup.add(body);

// Nose Cone (Gloss Red Cone)
const noseGeo = new THREE.ConeGeometry(0.5, 1.3, 32);
const redMat = new THREE.MeshStandardMaterial({
    color: 0xe63946,
    metalness: 0.1,
    roughness: 0.2
});
const nose = new THREE.Mesh(noseGeo, redMat);
nose.position.y = 2.15;
rocketGroup.add(nose);

// Left Fin
const finGeo = new THREE.BoxGeometry(0.12, 0.9, 0.8);
const leftFin = new THREE.Mesh(finGeo, redMat);
leftFin.position.set(-0.75, -0.9, 0);
rocketGroup.add(leftFin);

// Right Fin
const rightFin = new THREE.Mesh(finGeo, redMat);
rightFin.position.set(0.75, -0.9, 0);
rocketGroup.add(rightFin);

// Engine Exhaust Nozzle
const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.5, 24);
const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.8, roughness: 0.4 });
const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
nozzle.position.y = -1.65;
rocketGroup.add(nozzle);

// Flame Mesh (Glowing animated cone)
const flameGeo = new THREE.ConeGeometry(0.35, 1.4, 16);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const flame = new THREE.Mesh(flameGeo, flameMat);
flame.rotation.x = Math.PI; // Point flame downward
flame.position.y = -2.4;
flame.visible = false;
rocketGroup.add(flame);

scene.add(rocketGroup);

// ==========================================
// 3. 3D LAUNCH PAD PLATFORM
// ==========================================
const padGroup = new THREE.Group();

const platformGeo = new THREE.CylinderGeometry(3.6, 4.2, 0.8, 32);
const platformMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.7 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -2.2;
padGroup.add(platform);

const glowRingGeo = new THREE.TorusGeometry(2.4, 0.08, 16, 64);
const glowRingMat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0 });
const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
glowRing.rotation.x = Math.PI / 2;
glowRing.position.y = -1.78;
padGroup.add(glowRing);

scene.add(padGroup);

// ==========================================
// 4. 3D ASTEROID OBSTACLES (BOUNCE ON COLLISION)
// ==========================================
const asteroids = [];
const asteroidGeo = new THREE.DodecahedronGeometry(0.8, 1); // Rugged 3D rock shape
const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x7c7f89,
    roughness: 0.8,
    metalness: 0.1
});

// Spawn 10 dynamic floating asteroids
for (let i = 0; i < 10; i++) {
    const rock = new THREE.Mesh(asteroidGeo, asteroidMat);
    rock.position.set(
        (Math.random() - 0.5) * 14,
        15 + i * 8, // Spaced out above the rocket
        (Math.random() - 0.5) * 4
    );

    // Custom physics properties
    rock.velocity = new THREE.Vector3(0, -0.05, 0);
    rock.rotSpeed = {
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
    };

    scene.add(rock);
    asteroids.push(rock);
}

// ==========================================
// 5. STARFIELD BACKGROUND
// ==========================================
const starCount = 1500;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 100;
    starPositions[i + 1] = (Math.random() - 0.5) * 140;
    starPositions[i + 2] = (Math.random() - 0.5) * 60;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 });
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// ==========================================
// 6. STATE & CONTROLS
// ==========================================
const STATES = { PRE_LAUNCH: 'PRE_LAUNCH', COUNTDOWN: 'COUNTDOWN', IN_FLIGHT: 'IN_FLIGHT' };
let currentState = STATES.PRE_LAUNCH;

const keys = { ArrowUp: false, ArrowLeft: false, ArrowRight: false };
const statusText = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownEl = document.getElementById('countdown-overlay');

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && currentState === STATES.PRE_LAUNCH) {
        startCountdown();
    }
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function startCountdown() {
    currentState = STATES.COUNTDOWN;
    statusText.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Hold tight for ignition!';

    let count = 3;
    countdownEl.textContent = count;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else if (count === 0) {
            countdownEl.textContent = 'LIFTOFF!';
        } else {
            clearInterval(timer);
            countdownEl.textContent = '';
            currentState = STATES.IN_FLIGHT;
            flame.visible = true;
            statusText.textContent = 'STATUS: IN FLIGHT';
            instructionText.innerHTML = 'Use <b>Left/Right</b> to Steer & Roll | Hold <b>Up Arrow</b> for Thrusters';
        }
    }, 1000);
}

// ==========================================
// 7. ANIMATION & PHYSICS LOOP
// ==========================================
let velocityX = 0;

function animate() {
    requestAnimationFrame(animate);

    if (currentState === STATES.COUNTDOWN) {
        rocketGroup.position.x = (Math.random() - 0.5) * 0.08; // Rumble vibration
    }
    else if (currentState === STATES.IN_FLIGHT) {
        // Drop launchpad away into deep space
        if (padGroup.position.y > -60) padGroup.position.y -= 0.35;

        // Thruster flame flicker animation
        flame.scale.set(
            0.8 + Math.random() * 0.4,
            (keys.ArrowUp ? 1.8 : 1.0) + Math.random() * 0.3,
            0.8 + Math.random() * 0.4
        );

        // Lateral steering with inertia
        if (keys.ArrowLeft) velocityX = -0.14;
        else if (keys.ArrowRight) velocityX = 0.14;
        else velocityX *= 0.88;

        rocketGroup.position.x += velocityX;
        if (rocketGroup.position.x > 7.5) rocketGroup.position.x = 7.5;
        if (rocketGroup.position.x < -7.5) rocketGroup.position.x = -7.5;

        // TRUE 3D ROTATION: Roll around Y axis and tilt along Z axis when steering
        rocketGroup.rotation.z = -velocityX * 2.5;
        rocketGroup.rotation.y = velocityX * 4.0; // Dynamic 3D roll showing all sides

        const flightSpeed = keys.ArrowUp ? 0.8 : 0.3;

        // Starfield streaming
        const starCoords = starField.geometry.attributes.position.array;
        for (let i = 1; i < starCount * 3; i += 3) {
            starCoords[i] -= flightSpeed;
            if (starCoords[i] < -70) starCoords[i] = 70;
        }
        starField.geometry.attributes.position.needsUpdate = true;

        // Asteroids movement & bouncy collisions
        asteroids.forEach((rock) => {
            rock.position.y -= flightSpeed;
            rock.position.add(rock.velocity);
            rock.velocity.multiplyScalar(0.96); // Inertia drag

            // 3D tumble rotation
            rock.rotation.x += rock.rotSpeed.x;
            rock.rotation.y += rock.rotSpeed.y;
            rock.rotation.z += rock.rotSpeed.z;

            // Reset rock to the top once passed
            if (rock.position.y < -15) {
                rock.position.y = 35 + Math.random() * 20;
                rock.position.x = (Math.random() - 0.5) * 14;
                rock.velocity.set(0, 0, 0);
            }

            // 3D Collision Detection: Distance between rocket and asteroid center
            const dist = rocketGroup.position.distanceTo(rock.position);
            if (dist < 1.4) {
                // Impact reaction: rock bounces away, rocket wobbles!
                const hitDirection = rock.position.clone().sub(rocketGroup.position).normalize();
                rock.velocity.copy(hitDirection.multiplyScalar(0.4)); // Push rock away
                velocityX = -hitDirection.x * 0.2; // Rocket recoil recoil
            }
        });
    }

    renderer.render(scene, camera);
}

animate();