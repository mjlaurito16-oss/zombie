import * as THREE from 'three';

let camera;
let lat = 0;
let lon = -90;
const SENSITIVITY = 0.15; // Mouse sensitivity

export function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 50);
    
    // Initialize Pointer Lock logic
    initPointerLock();
    
    return camera;
}

function initPointerLock() {
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    // Click to lock cursor
    blocker.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            // Game Active
            blocker.style.display = 'none';
            document.addEventListener('mousemove', onMouseMove);
        } else {
            // Game Paused
            blocker.style.display = 'flex';
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
}

function onMouseMove(event) {
    // Update rotation based on mouse movement
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    lon += movementX * SENSITIVITY;
    lat -= movementY * SENSITIVITY;

    // Constrain looking up/down
    lat = Math.max(-85, Math.min(85, lat));
}

export function updateCameraLook() {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    const target = new THREE.Vector3();
    target.x = 500 * Math.sin(phi) * Math.cos(theta);
    target.y = 500 * Math.cos(phi);
    target.z = 500 * Math.sin(phi) * Math.sin(theta);
    
    camera.lookAt(camera.position.clone().add(target));
}

export function getCameraForward() {
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0; 
    fwd.normalize();
    return fwd;
}

export function getCameraRight() {
    const fwd = getCameraForward();
    const rgt = new THREE.Vector3();
    rgt.crossVectors(fwd, new THREE.Vector3(0,1,0)); // Cross with UP vector
    return rgt;
}

export function handleResize(renderer, camera) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Standard resize for PC
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}