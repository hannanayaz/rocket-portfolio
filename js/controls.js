
/* ROCKET CONTROLS: Speed, steering and banking */

const keysPressed = new Set();

// Register keyboard controls.
export function setupRocketControls() {
    window.addEventListener('keydown', (event) => {
        if ([
            'ArrowUp', 'ArrowDown', 'ArrowLeft',
            'ArrowRight', 'Space'
        ].includes(event.code)) {
            event.preventDefault();
        }

        keysPressed.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
        keysPressed.delete(event.code);
    });

    window.addEventListener('blur', () => {
        keysPressed.clear();
    });
}

// Apply acceleration, braking and smooth 3D turns.
export function updateRocketControls(rocket, deltaTime, normalSpeed) {
    if (!rocket) return normalSpeed;

    let speed = normalSpeed;

    // W / Up accelerates; S / Down slows down.
    if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) {
        speed = normalSpeed * 3;
    }

    if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) {
        speed = normalSpeed * 0.5;
    }

    // A / Left and D / Right steer the rocket.
    const steeringSpeed = 8;
    let turnDirection = 0;

    if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) {
        rocket.position.x -= steeringSpeed * deltaTime;
        turnDirection = 1;
    }

    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) {
        rocket.position.x += steeringSpeed * deltaTime;
        turnDirection = -1;
    }

    // Smoothly bank the rocket while turning.
    const targetBank = turnDirection * 0.45;
    rocket.rotation.z = THREE.MathUtils.lerp(
        rocket.rotation.z,
        targetBank,
        Math.min(deltaTime * 4, 1)
    );

    return speed;
}
