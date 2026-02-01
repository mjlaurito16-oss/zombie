import * as THREE from 'three';

// --- STATE ---
const colliders = []; 
let doorPivot = null;
let doorOpen = false;
const doorSpeed = 3.0;

// Internal Light State
let houseLight = null;
let isLightOn = true;

export function createHouse(scene) {
    colliders.length = 0; 
    const houseGroup = new THREE.Group();

    // --- PALETTE ---
    const matWall = new THREE.MeshStandardMaterial({ color: 0xEADDCA, roughness: 0.9 }); // Beige Plaster
    const matWood = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.8 }); // Dark Wood
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x8B3A3A, roughness: 0.6 }); // Red Clay
    const matGlass = new THREE.MeshStandardMaterial({ 
        color: 0x88CCFF, 
        roughness: 0.1, 
        transparent: true, 
        opacity: 0.3 
    });
    const matStone = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });

    // --- DIMENSIONS ---
    const width = 70;
    const depth = 60;
    const height = 30; // Wall height
    const thick = 2;

    // --- 1. FLOOR ---
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 1, depth), matWood);
    floor.position.y = 0.5;
    floor.receiveShadow = true;
    houseGroup.add(floor);

    // --- 2. WALLS & WINDOWS ---
    
    // Helper for collision walls
    function createSolidWall(w, h, d, x, y, z) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matWall);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        houseGroup.add(mesh);
        
        // Physics Collider
        const box = new THREE.Box3().setFromObject(mesh);
        colliders.push(box);
    }

    // -- Back Wall (Solid) --
    createSolidWall(width, height, thick, 0, height/2, -depth/2 + 1);

    // -- Right Wall (Solid) --
    createSolidWall(thick, height, depth, width/2 - 1, height/2, 0);

    // -- Left Wall (With Window) --
    // We split this wall into Top, Bottom, Left, Right parts to make a hole
    const winH = 12; const winW = 20;
    // Bottom part
    createSolidWall(thick, 10, depth, -width/2 + 1, 5, 0); 
    // Top part
    createSolidWall(thick, height - (10+winH), depth, -width/2 + 1, height - (height-(10+winH))/2, 0);
    // Side parts (pillars)
    const pillarZ = (depth - winW) / 2;
    createSolidWall(thick, winH, pillarZ, -width/2 + 1, 10 + winH/2, -depth/2 + pillarZ/2);
    createSolidWall(thick, winH, pillarZ, -width/2 + 1, 10 + winH/2, depth/2 - pillarZ/2);

    // Visual Glass Pane
    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(0.5, winH, winW), matGlass);
    windowGlass.position.set(-width/2 + 1, 10 + winH/2, 0);
    houseGroup.add(windowGlass);

    // -- Front Wall (Doorway) --
    const doorW = 16;
    const sideW = (width - doorW) / 2;
    const doorH = 22;

    // Left Section
    createSolidWall(sideW, height, thick, -width/2 + sideW/2, height/2, depth/2 - 1);
    // Right Section
    createSolidWall(sideW, height, thick, width/2 - sideW/2, height/2, depth/2 - 1);
    // Header (Above Door)
    createSolidWall(doorW, height - doorH, thick, 0, doorH + (height-doorH)/2, depth/2 - 1);


    // --- 3. ROOF (Pitched) ---
    // Using a Cylinder with 3 radial segments (Prism)
    const roofHeight = 20;
    const roofGeo = new THREE.CylinderGeometry(0, width/1.3, depth + 10, 4, 1);
    // Rotate to align corners 
    roofGeo.rotateY(Math.PI / 4); 
    // Scale to make it flat and wide
    roofGeo.scale(1.4, 0.5, 1);

    const roof = new THREE.Mesh(roofGeo, matRoof);
    roof.position.set(0, height + 10, 0);
    roof.castShadow = true;
    houseGroup.add(roof);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(6, 20, 6), matStone);
    chimney.position.set(15, height + 10, -10);
    chimney.castShadow = true;
    houseGroup.add(chimney);


    // --- 4. DOOR ---
    doorPivot = new THREE.Object3D();
    doorPivot.position.set(-doorW/2, 0, depth/2 - 1);
    
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 1.5), matWood);
    doorMesh.position.set(doorW/2, doorH/2, 0);
    doorMesh.castShadow = true;
    doorMesh.userData = { isInteractable: true, type: 'DOOR' }; // Interaction Tag

    // Door Knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(1.2), new THREE.MeshStandardMaterial({color: 0xFFD700}));
    knob.position.set(doorW - 2, doorH/2, 1);
    doorMesh.add(knob);

    doorPivot.add(doorMesh);
    houseGroup.add(doorPivot);


    // --- 5. INTERIOR ---
    
    // Fireplace (Visual only)
    const firePlace = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 5), matStone);
    firePlace.position.set(15, 7.5, -depth/2 + 4);
    houseGroup.add(firePlace);

    // Table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 15), matWood);
    tableTop.position.set(-15, 8, 0);
    houseGroup.add(tableTop);
    const tableLeg = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), matWood);
    tableLeg.position.set(-15, 4, 0);
    houseGroup.add(tableLeg);

    // --- 6. LIGHTING ---
    // Point Light inside the house
    houseLight = new THREE.PointLight(0xffaa55, 1, 80);
    houseLight.position.set(0, 25, 0);
    houseLight.castShadow = true;
    houseGroup.add(houseLight);

    // Light Switch (Interactable)
    const switchBox = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 0.5), matStone);
    switchBox.position.set(8, 14, depth/2 - 2.5); // Inside, to the right of door
    switchBox.userData = { isInteractable: true, type: 'SWITCH' }; // Interaction Tag
    houseGroup.add(switchBox);

    scene.add(houseGroup);
}

// --- LOGIC ---

export function updateHouse(dt) {
    if(!doorPivot) return;
    const targetRot = doorOpen ? -Math.PI / 2 : 0;
    doorPivot.rotation.y += (targetRot - doorPivot.rotation.y) * dt * doorSpeed;
}

export function checkCollision(x, z) {
    const playerRadius = 2.0; 
    for(let box of colliders) {
        if (x > box.min.x - playerRadius && x < box.max.x + playerRadius &&
            z > box.min.z - playerRadius && z < box.max.z + playerRadius) {
            return true; 
        }
    }
    // Door check (only when closed)
    if (!doorOpen) {
        // Approximate closed door position
        if (z > 28 && z < 32 && x > -8 && x < 8) return true;
    }
    return false; 
}

// Open/Close Door
export function toggleDoor() {
    doorOpen = !doorOpen;
}

// Turn Light On/Off
export function toggleLight() {
    if(houseLight) {
        isLightOn = !isLightOn;
        houseLight.intensity = isLightOn ? 1.0 : 0.0;
    }
}