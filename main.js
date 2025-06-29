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
