import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Main Application Class
class VirtualArtGallery {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.artPieces = [];
        this.door = null;
        this.animationId = null;
        this.arrowTargets = [
            { name: 'Back', position: { x: 0, y: 4, z: -7 }, lookAt: { x: 0, y: 4, z: -15 } },
            { name: 'Front', position: { x: 0, y: 4, z: 7 }, lookAt: { x: 0, y: 4, z: 15 } },
            { name: 'Left', position: { x: -12, y: 4, z: 0 }, lookAt: { x: -20, y: 4, z: 0 } },
            { name: 'Right', position: { x: 12, y: 4, z: 0 }, lookAt: { x: 20, y: 4, z: 0 } }
        ];
        this.moveState = { forward: false, backward: false, left: false, right: false };
        this.moveSpeed = 0.2; // Adjust for desired speed
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupGallery();
        this.setupEventListeners();
        this.setupUI();
        this.animate();

        // Hide loading screen since no assets are loaded
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 100);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 50;
    }

    setupLighting() {
        // Ambient Light (brighter)
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        this.scene.add(ambientLight);

        // Main Directional Light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Spot Lights for Art Pieces
        const spotLight1 = new THREE.SpotLight(0xffffff, 1.2);
        spotLight1.position.set(-5, 8, 0);
        spotLight1.angle = Math.PI / 6;
        spotLight1.penumbra = 0.3;
        spotLight1.castShadow = true;
        this.scene.add(spotLight1);

        const spotLight2 = new THREE.SpotLight(0xffffff, 1.2);
        spotLight2.position.set(5, 8, 0);
        spotLight2.angle = Math.PI / 6;
        spotLight2.penumbra = 0.3;
        spotLight2.castShadow = true;
        this.scene.add(spotLight2);

        // Point Light for Center
        const pointLight = new THREE.PointLight(0xffffff, 1.2, 80);
        pointLight.position.set(0, 6, 0);
        this.scene.add(pointLight);

        // Additional Point Lights for front and right walls
        const frontWallLight = new THREE.PointLight(0xffffff, 1.5, 60);
        frontWallLight.position.set(0, 5, 13);
        this.scene.add(frontWallLight);

        const rightWallLight = new THREE.PointLight(0xffffff, 1.5, 60);
        rightWallLight.position.set(13, 5, 0);
        this.scene.add(rightWallLight);

        // Extra intense point light at the center of the right wall
        const rightWallCenterLight = new THREE.PointLight(0xffffff, 2.2, 40);
        rightWallCenterLight.position.set(20, 5, 0);
        this.scene.add(rightWallCenterLight);

        // Four more point lights at the corners
        const corners = [
            { x: -18, y: 5, z: -13 },
            { x: 18, y: 5, z: -13 },
            { x: -18, y: 5, z: 13 },
            { x: 18, y: 5, z: 13 }
        ];
        corners.forEach(corner => {
            const cornerLight = new THREE.PointLight(0xffffff, 1.2, 50);
            cornerLight.position.set(corner.x, corner.y, corner.z);
            this.scene.add(cornerLight);
        });
    }

    setupGallery() {
        // Floor with checkerboard texture (now 40x30)
        const width = 40;
        const depth = 30;
        const floorGeometry = new THREE.PlaneGeometry(width, depth);
        const checkerboardTexture = this.createCheckerboardTexture(10, 10, 1024, 768);
        checkerboardTexture.wrapS = THREE.RepeatWrapping;
        checkerboardTexture.wrapT = THREE.RepeatWrapping;
        checkerboardTexture.repeat.set(1, 1);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            map: checkerboardTexture,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        const floorY = 0; // Align floor with bottom of door
        floor.position.y = floorY;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Walls
        this.createWalls(width, depth);
        
        // Art Pieces
        this.createArtPieces();
        
        // Decorative Elements
        this.createDecorations();
    }

    createCheckerboardTexture(rows, cols, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#fff' : '#000';
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

// Initialize the application
const gallery = new VirtualArtGallery();
