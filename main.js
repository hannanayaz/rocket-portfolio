
import { setupCamera, setupLighting, createEarthGround } from './js/environment.js';
import { createRocket } from './js/rocket.js';

const canvas = document.getElementById('game-canvas');
const missionStatus = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownOverlay = document.getElementById('countdown-overlay');

const scene = new THREE.Scene();

const camera = setupCamera();
setupLighting(scene);

createEarthGround(scene);

let rocket = null;
let countdownStarted = false;
let countdownFinished = false;
let countdownRunning = false;

createRocket(scene, (loadedRocket) => {
    rocket = loadedRocket;
});

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the countdown once when Spacebar is pressed.
function startCountdown() {
    if (countdownStarted || countdownRunning || countdownFinished) return;

    countdownStarted = true;
    countdownRunning = true;

    missionStatus.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Preparing for launch...';

    const sequence = ['3', '2', '1', 'LIFTOFF!'];
    let index = 0;

    countdownOverlay.style.display = 'flex';

    function showNext() {
        if (index >= sequence.length) {
            countdownOverlay.style.display = 'none';
            countdownRunning = false;
            countdownFinished = true;

            missionStatus.textContent = 'STATUS: LIFTOFF SEQUENCE COMPLETE';
            instructionText.textContent = 'Flight controls are coming soon.';
            return;
        }

        countdownOverlay.textContent = sequence[index];
        index++;

        setTimeout(showNext, index === 4 ? 1200 : 1000);
    }

    showNext();
}

window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;

    // Prevent the page from scrolling when Spacebar is pressed.
    event.preventDefault();

    if (!event.repeat) {
        startCountdown();
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
