import * as THREE from 'three';

// --- CONFIGURATION ---
const GRASS_COUNT = 60000;  // Reduced density
const AREA_SIZE = 1000;     
const BLADE_WIDTH = 0.25;   
const BLADE_HEIGHT = 4.0;   // Slightly shorter for a cleaner look
const BLADE_HEIGHT_VARIATION = 2.0;

// --- SHADERS (Unchanged) ---
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 pos = position;
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float windX = sin(uTime * 0.5 + instancePos.x * 0.02) * 1.5; 
    float windZ = cos(uTime * 0.3 + instancePos.z * 0.02) * 1.0;
    float noise = sin(instancePos.x * 0.1 + uTime * 0.1);
    float tipCurve = uv.y * uv.y; 
    pos.x += windX * tipCurve * 2.0 * noise;
    pos.z += windZ * tipCurve * 1.0 * noise;
    pos.x += sin(pos.y * 0.5) * 1.0 * tipCurve;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uBaseColor;
  uniform vec3 uTipColor;
  void main() {
    float mixStrength = vUv.y * 1.2;
    mixStrength = clamp(mixStrength, 0.0, 1.0);
    vec3 color = mix(uBaseColor, uTipColor, mixStrength);
    if(vUv.y < 0.1) color *= 0.5;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createGround(scene) {
    const loader = new THREE.TextureLoader();

    // 1. Ground Floor
    const groundTexture = loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(64, 64);
    
    const groundGeo = new THREE.PlaneGeometry(AREA_SIZE * 2, AREA_SIZE * 2, 32, 32); 
    const groundMat = new THREE.MeshStandardMaterial({ 
        map: groundTexture,
        roughness: 1, 
        color: 0x223322 
    });
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Grass
    const geometry = new THREE.PlaneGeometry(BLADE_WIDTH, BLADE_HEIGHT, 1, 4);
    geometry.translate(0, BLADE_HEIGHT / 2, 0); 

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uBaseColor: { value: new THREE.Color(0x0f2200) },
            uTipColor: { value: new THREE.Color(0x6b8c42) }
        },
        side: THREE.DoubleSide
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, GRASS_COUNT);
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let index = 0;
    
    for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * AREA_SIZE;
        const z = (Math.random() - 0.5) * AREA_SIZE;

        // --- EXCLUSION ZONE ---
        // Don't put grass where the house is (Center 60x60 area)
        if (x > -30 && x < 30 && z > -30 && z < 30) continue;

        dummy.position.set(x, 0, z);
        
        const scaleY = 1.0 + Math.random() * BLADE_HEIGHT_VARIATION;
        dummy.scale.set(1.0, scaleY, 1.0);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index++, dummy.matrix);
    }
    
    instancedMesh.count = index; // Update count to match actual placed grass
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    scene.userData.grassMesh = instancedMesh;
}