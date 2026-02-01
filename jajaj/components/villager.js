import * as THREE from 'three';

const villagers = []; // Array to store all 5 NPCs

// Random shirt colors for variety
const shirtColors = [0xd93333, 0x334488, 0x338833, 0xe6b800, 0x883388]; 
const pantsColors = [0x224488, 0x887755, 0x222222, 0x555555, 0x334455]; 

export function createVillagers(scene, count = 5) {
    for (let i = 0; i < count; i++) {
        spawnSingleVillager(scene, i);
    }
}

function spawnSingleVillager(scene, index) {
    const group = new THREE.Group();

    // --- MATERIALS ---
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ 
        color: shirtColors[index % shirtColors.length], 
        roughness: 0.9 
    });
    const pantsMat = new THREE.MeshStandardMaterial({ 
        color: pantsColors[index % pantsColors.length], 
        roughness: 0.9 
    });

    // 1. HEAD
    const headGroup = new THREE.Group();
    headGroup.position.y = 2.9;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
    headGroup.add(headMesh);
    group.add(headGroup);

    // 2. TORSO
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.4, 12), shirtMat);
    body.position.y = 1.9;
    group.add(body);

    // 3. ARMS
    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 1.3, 8);
    armGeo.translate(0, -0.5, 0); 

    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(0.6, 2.5, 0);
    leftArm.rotation.z = -0.1; 
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(-0.6, 2.5, 0);
    rightArm.rotation.z = 0.1;
    group.add(rightArm);

    // 4. LEGS
    const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.5, 8);
    legGeo.translate(0, -0.75, 0); 

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(0.25, 1.2, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(-0.25, 1.2, 0);
    group.add(rightLeg);

    // Shadows
    group.traverse(obj => { if(obj.isMesh) obj.castShadow = true; });

    // --- GIANT SIZE ---
    // Player is height 15. Villager is ~3. 
    // Scale 5.0 makes them 15 units tall (Same as you).
    group.scale.set(5, 5, 5);

    // --- RANDOM POSITION ---
    // Scatter them around the map
    const angle = (index / 5) * Math.PI * 2; // Circle pattern
    const radius = 30 + Math.random() * 20;
    
    group.position.set(
        Math.cos(angle) * radius, 
        0, 
        Math.sin(angle) * radius + 40 // Offset so they are in front of you
    );

    scene.add(group);

    // STORE DATA FOR THIS SPECIFIC VILLAGER
    const npcData = {
        group: group,
        state: 'IDLE',
        stateTimer: Math.random() * 5,
        moveTarget: new THREE.Vector3(),
        walkSpeed: 3.5 + Math.random(), // Varied speeds
        legSwingTimer: Math.random() * 10,
        limbs: { leftArm, rightArm, leftLeg, rightLeg, headGroup }
    };
    
    pickRandomTarget(npcData);
    villagers.push(npcData);
}

export function updateVillagers(dt, playerPos) {
    villagers.forEach(npc => {
        updateSingleVillager(npc, dt, playerPos);
    });
}

function updateSingleVillager(npc, dt, playerPos) {
    const distToPlayer = npc.group.position.distanceTo(playerPos);

    // 1. WATCH PLAYER
    // Note: Since they are giant, we increase detection range to 50
    if (distToPlayer < 50) { 
        npc.state = 'WATCH';
        lookAtSmoothly(npc.group, playerPos, dt * 2.0);
        npc.limbs.headGroup.lookAt(playerPos);
        resetLimbs(npc, dt);
        return; 
    }

    // 2. AI LOGIC
    npc.stateTimer -= dt;

    if (npc.state === 'WATCH' || npc.state === 'IDLE') {
        if (npc.state === 'WATCH') npc.state = 'IDLE'; 
        resetLimbs(npc, dt);

        if (npc.stateTimer <= 0) {
            pickRandomTarget(npc);
            npc.state = 'WALK';
            npc.stateTimer = 4 + Math.random() * 5; 
        }
    } 
    else if (npc.state === 'WALK') {
        const dir = new THREE.Vector3().subVectors(npc.moveTarget, npc.group.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 2.0 || npc.stateTimer <= 0) {
            npc.state = 'IDLE';
            npc.stateTimer = 2 + Math.random() * 3; 
            return;
        }

        dir.normalize();
        const angle = Math.atan2(dir.x, dir.z);
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), angle);
        npc.group.quaternion.slerp(q, dt * 3.0); // Slower turn for giants
        npc.group.position.addScaledVector(dir, npc.walkSpeed * dt * 5.0); // Move faster because they are big!

        // ANIMATION
        npc.legSwingTimer += dt * 6; // Slower steps for giants
        const swing = Math.sin(npc.legSwingTimer) * 0.8;
        
        npc.limbs.leftLeg.rotation.x = swing;
        npc.limbs.rightLeg.rotation.x = -swing;
        npc.limbs.leftArm.rotation.x = -swing * 0.5;
        npc.limbs.rightArm.rotation.x = swing * 0.5;
    }
}

function lookAtSmoothly(object, target, speed) {
    const direction = new THREE.Vector3().subVectors(target, object.position);
    direction.y = 0;
    direction.normalize();
    const angle = Math.atan2(direction.x, direction.z);
    const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), angle);
    object.quaternion.slerp(targetQ, speed);
}

function resetLimbs(npc, dt) {
    const lerpSpeed = dt * 5.0;
    npc.limbs.leftLeg.rotation.x = THREE.MathUtils.lerp(npc.limbs.leftLeg.rotation.x, 0, lerpSpeed);
    npc.limbs.rightLeg.rotation.x = THREE.MathUtils.lerp(npc.limbs.rightLeg.rotation.x, 0, lerpSpeed);
    npc.limbs.leftArm.rotation.x = THREE.MathUtils.lerp(npc.limbs.leftArm.rotation.x, 0, lerpSpeed);
    npc.limbs.rightArm.rotation.x = THREE.MathUtils.lerp(npc.limbs.rightArm.rotation.x, 0, lerpSpeed);
}

function pickRandomTarget(npc) {
    npc.moveTarget.x = (Math.random() - 0.5) * 150; // Wider wander area
    npc.moveTarget.z = (Math.random() - 0.5) * 150; 
    npc.moveTarget.y = 0;
}