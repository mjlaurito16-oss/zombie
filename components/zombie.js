import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

const zombies = [];

export function createZombies(scene, count = 3) {
    const loader = new GLTFLoader();
    
    loader.load('./zombie_model.glb', (gltf) => {
        const originalMesh = gltf.scene;
        const animations = gltf.animations;

        // SCALE
        const box = new THREE.Box3().setFromObject(originalMesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const targetHeight = 25.0; 
        const scaleFactor = targetHeight / size.y;
        originalMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // FLOOR FIX
        originalMesh.updateMatrixWorld();
        const newBox = new THREE.Box3().setFromObject(originalMesh);
        let yOffset = 0;
        if (newBox.min.y < 0) yOffset = -newBox.min.y;

        for (let i = 0; i < count; i++) {
            spawnZombieClone(scene, originalMesh, animations, i, yOffset);
        }
    }, undefined, (error) => { console.error(error); });
}

function spawnZombieClone(scene, meshTemplate, animations, index, liftAmount) {
    const zombieGroup = meshTemplate.clone();

    // --- MATERIAL FIX FOR "STICKER" LOOK ---
    zombieGroup.traverse((object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;

            if (object.material) {
                // 1. Force Solid (No Ghosting)
                object.material.transparent = false;
                object.material.opacity = 1.0;
                
                // 2. Skin Settings
                object.material.roughness = 0.5; // Slightly shiny skin
                object.material.metalness = 0.0; // Not metal
                object.material.emissive = new THREE.Color(0x000000); // No glowing
                
                // 3. Update Textures
                if (object.material.map) object.material.map.encoding = THREE.sRGBEncoding;
                object.material.needsUpdate = true;
            }
        }
    });

    // POSITIONS
    if (index === 0) {
        zombieGroup.position.set(0, liftAmount, 40); 
    } else {
        const angle = (index / 3) * Math.PI * 2;
        const radius = 50;
        zombieGroup.position.set(Math.cos(angle) * radius, liftAmount, Math.sin(angle) * radius);
    }

    scene.add(zombieGroup);

    // ANIMATION
    const mixer = new THREE.AnimationMixer(zombieGroup);
    if (animations.length > 0) {
        let clip = animations.find(a => a.name.toLowerCase().includes('walk')) || animations[0];
        const action = mixer.clipAction(clip);
        action.play();
        action.timeScale = 0.8;
    }

    // ARMS
    let rightArm = null;
    let leftArm = null;
    zombieGroup.traverse((node) => {
        if (node.isBone) {
            const n = node.name.toLowerCase();
            if (n.includes('right') && (n.includes('forearm') || n.includes('arm'))) rightArm = node;
            if (n.includes('left') && (n.includes('forearm') || n.includes('arm'))) leftArm = node;
        }
    });

    zombies.push({
        group: zombieGroup,
        mixer: mixer,
        speed: 5.0 + Math.random() * 3.0,
        limbs: { right: rightArm, left: leftArm },
        swayTimer: Math.random() * 10
    });
}

export function updateZombies(dt, playerPos) {
    zombies.forEach(zombie => {
        if (zombie.mixer) zombie.mixer.update(dt);
        
        if (zombie.group) {
            const dist = zombie.group.position.distanceTo(playerPos);
            if (dist < 150) {
                const lookTarget = new THREE.Vector3(playerPos.x, zombie.group.position.y, playerPos.z);
                zombie.group.lookAt(lookTarget);
                const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(zombie.group.quaternion);
                zombie.group.position.addScaledVector(dir, zombie.speed * dt);
                
                // Arm Sway
                zombie.swayTimer += dt * 3;
                const armWave = -1.4 + Math.sin(zombie.swayTimer) * 0.2;
                if (zombie.limbs.right) zombie.limbs.right.rotation.x = armWave;
                if (zombie.limbs.left) zombie.limbs.left.rotation.x = armWave;
            }
        }
    });
}