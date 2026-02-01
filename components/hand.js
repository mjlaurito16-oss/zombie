import * as THREE from 'three';

let handGroup;
let moveTimer = 0;
let breathTimer = 0;
let lastCamRotY = 0;
let swayX = 0;
let swayY = 0;

export function initHand(camera) {
    handGroup = new THREE.Group();
    
    const skinMat = new THREE.MeshStandardMaterial({
        color: 0xe0ac69, 
        roughness: 0.6,
        metalness: 0.1,
    });
    
    const sleeveMat = new THREE.MeshStandardMaterial({
        color: 0x050505, 
        roughness: 0.9
    });

    // Arm
    const armGeo = new THREE.CylinderGeometry(0.55, 0.7, 4, 16);
    armGeo.rotateX(Math.PI / 2);
    const arm = new THREE.Mesh(armGeo, sleeveMat);
    arm.position.set(0, 0, 1.8);
    handGroup.add(arm);

    // Palm
    const palmGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.scale.set(1.0, 0.5, 1.2); 
    palm.position.set(0, 0, -0.2);
    handGroup.add(palm);

    // Fingers
    function createFinger(x, y, z, length, scale, rotationY, rotationZ) {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.set(x, y, z);
        fingerGroup.rotation.y = rotationY;
        fingerGroup.rotation.z = rotationZ;

        const jointSize = 0.14 * scale;
        
        const s1Geo = new THREE.CylinderGeometry(jointSize, jointSize * 1.1, length * 0.45, 8);
        s1Geo.translate(0, length * 0.225, 0); 
        const seg1 = new THREE.Mesh(s1Geo, skinMat);
        
        const k1Geo = new THREE.SphereGeometry(jointSize * 1.1, 8, 8);
        const k1 = new THREE.Mesh(k1Geo, skinMat);
        
        const s2Geo = new THREE.CylinderGeometry(jointSize * 0.8, jointSize, length * 0.4, 8);
        s2Geo.translate(0, length * 0.2, 0);
        const seg2 = new THREE.Mesh(s2Geo, skinMat);
        seg2.position.y = length * 0.45; 
        seg2.rotation.x = 0.2; 
        
        fingerGroup.add(k1);
        fingerGroup.add(seg1);
        fingerGroup.add(seg2);
        
        fingerGroup.rotation.x = -Math.PI / 2 + 0.3; 
        return fingerGroup;
    }

    const index = createFinger(0.25, 0, -0.8,  1.4, 1.0,  -0.1, 0);
    const middle = createFinger(0.0, 0, -0.85, 1.5, 1.05, 0.0, 0);
    const ring   = createFinger(-0.25, 0, -0.8, 1.35, 1.0, 0.1, 0);
    const pinky  = createFinger(-0.48, -0.1, -0.7, 1.1, 0.9, 0.2, 0);

    handGroup.add(index);
    handGroup.add(middle);
    handGroup.add(ring);
    handGroup.add(pinky);

    // Thumb
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(0.4, 0.1, -0.4);
    thumbGroup.rotation.set(0, -0.8, 0.5); 
    
    const t1Geo = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8);
    const t1 = new THREE.Mesh(t1Geo, skinMat);
    t1.position.y = 0.3;
    
    const t2Geo = new THREE.CylinderGeometry(0.14, 0.18, 0.5, 8);
    const t2 = new THREE.Mesh(t2Geo, skinMat);
    t2.position.y = 0.85;
    t2.rotation.x = -0.3; 

    const thumbJoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
    
    thumbGroup.add(thumbJoint);
    thumbGroup.add(t1);
    thumbGroup.add(t2);
    handGroup.add(thumbGroup);

    // SETUP
    camera.add(handGroup);
    handGroup.scale.set(0.55, 0.55, 0.55);
    handGroup.position.set(0.5, -0.6, -1.0); 
    handGroup.rotation.set(0.1, -0.1, 0);
}

export function updateHandSwing(dt, isMoving, camera) {
    if(!handGroup) return;

    // Breathing
    breathTimer += dt * 2.0;
    const breathY = Math.sin(breathTimer) * 0.015;
    const breathRot = Math.cos(breathTimer) * 0.005;

    // Inertia
    const currentRotY = camera.rotation.y;
    const rotDelta = currentRotY - lastCamRotY;
    
    swayX = THREE.MathUtils.lerp(swayX, -rotDelta * 8.0, 0.1);
    swayY = THREE.MathUtils.lerp(swayY, -Math.abs(rotDelta) * 2.0, 0.1);
    swayX *= 0.9;
    swayY *= 0.9;
    
    lastCamRotY = currentRotY;

    // Walking Bob
    let walkX = 0;
    let walkY = 0;
    
    if(isMoving) {
        // CHANGED: Slowed down from 10.0 to 5.0 to match slow move speed
        moveTimer += dt * 5.0; 
        walkX = Math.cos(moveTimer) * 0.04; 
        walkY = Math.abs(Math.sin(moveTimer)) * 0.05; 
    } else {
        moveTimer = 0;
    }

    handGroup.position.x = 0.5 + walkX + swayX;
    handGroup.position.y = -0.6 + breathY + walkY + swayY;
    
    handGroup.rotation.z = walkX * 0.5 + swayX * 0.5;
    handGroup.rotation.x = 0.1 + breathRot + swayY * 0.2;
}