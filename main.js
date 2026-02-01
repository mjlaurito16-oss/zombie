import * as THREE from 'three';
import { setupCamera, updateCameraLook, getCameraForward, getCameraRight, handleResize } from './components/camera.js';
import { createGround } from './components/ground.js';
import { initControls, getMoveState, checkJump } from './components/controls.js';
import { initHand, updateHandSwing } from './components/hand.js';
import { createHouse, updateHouse, checkCollision, toggleDoor, toggleLight } from './components/house.js';
import { createZombies, updateZombies } from './components/zombie.js';

// --- SCENE SETUP ---
const container = document.getElementById('game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Almost black, not pitch black
scene.fog = new THREE.Fog(0x050505, 10, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
// IMPORTANT: This makes colors look real instead of washed out
renderer.outputEncoding = THREE.sRGBEncoding; 
container.appendChild(renderer.domElement);

// --- LIGHTING (THE FIX FOR "STICKER" LOOK) ---

// 1. Ambient Light (Fill): Low intensity to keep shadows dark
const ambLight = new THREE.AmbientLight(0xffffff, 0.2); 
scene.add(ambLight);

// 2. Moon Light (Key): Main light casting shadows
const dirLight = new THREE.DirectionalLight(0xaaccff, 1.2); 
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
scene.add(dirLight);

// 3. Rim Light (Backlight): This is the SECRET SAUCE. 
// It hits the zombie from behind to outline its shape.
const rimLight = new THREE.DirectionalLight(0x4444ff, 1.5); // Blue rim
rimLight.position.set(-50, 20, -50); // Behind and left
scene.add(rimLight);

// --- COMPONENTS ---
const camera = setupCamera();
scene.add(camera);

createGround(scene);
createHouse(scene);

// SPAWN ZOMBIES
createZombies(scene, 3); 

initControls();
initHand(camera);

// --- INTERACTION ---
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

window.addEventListener('mousedown', () => {
    if (document.pointerLockElement === document.body) {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0 && intersects[0].distance < 25) {
            const obj = intersects[0].object;
            if (obj.userData && obj.userData.isInteractable) {
                if (obj.userData.type === 'DOOR') toggleDoor();
                else if (obj.userData.type === 'SWITCH') toggleLight();
            }
        }
    }
});

// --- PHYSICS ---
const playerHeight = 15;
const moveSpeed = 0.75; 
let velocity = new THREE.Vector3();
let isJumping = false;

window.addEventListener('resize', () => handleResize(renderer, camera));

// --- GAME LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    if (scene.userData.grassMesh) scene.userData.grassMesh.material.uniforms.uTime.value = time;
    
    updateZombies(dt, camera.position);
    updateHouse(dt);
    updateCameraLook();
    
    const { moveFwd, moveRight } = getMoveState();
    const wantsToJump = checkJump();
    const isMoving = (moveFwd !== 0 || moveRight !== 0);

    updateHandSwing(dt, isMoving, camera);

    const fwd = getCameraForward();
    const rgt = getCameraRight();

    if (wantsToJump && !isJumping) {
        velocity.y = 25;
        isJumping = true;
    }

    let moveX = 0;
    let moveZ = 0;
    if(isMoving) {
        moveX = (fwd.x * moveFwd + rgt.x * moveRight) * moveSpeed;
        moveZ = (fwd.z * moveFwd + rgt.z * moveRight) * moveSpeed;
    }

    const nextX = camera.position.x + moveX;
    const nextZ = camera.position.z + moveZ;

    if (checkCollision(nextX, camera.position.z)) { moveX = 0; velocity.x = 0; }
    if (checkCollision(camera.position.x + moveX, nextZ)) { moveZ = 0; velocity.z = 0; }

    velocity.x = moveX;
    velocity.z = moveZ;
    camera.position.x += velocity.x;
    camera.position.z += velocity.z;
    velocity.y -= 1.0;
    camera.position.y += velocity.y * 0.1;

    if(camera.position.y < playerHeight) {
        camera.position.y = playerHeight;
        velocity.y = 0;
        isJumping = false;
    }

    renderer.render(scene, camera);
}
animate();