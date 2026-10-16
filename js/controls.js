
// ROCKET CONTROLS: Speed, steering and banking

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

// Apply speed and horizontal steering.
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

    // A / Left moves left; D / Right moves right.
    const steeringSpeed = 18;
    let turnDirection = 0;

    if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) {
        rocket.position.x -= steeringSpeed * deltaTime;
        turnDirection = -1;
    }

    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) {
        rocket.position.x += steeringSpeed * deltaTime;
        turnDirection = 1;
    }

    // Stronger banking in the correct direction.
    const targetBank = -turnDirection * 0.6;
    const blend = Math.min(deltaTime * 4, 1);

    rocket.rotation.z +=
        (targetBank - rocket.rotation.z) * blend;

    return speed;
}
