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

    createArtPieces() {
        const depth = 30;
        const wallZ = -depth / 2 + 0.1; // Slightly in front of the wall
        const wallY = 4;
        const gltfLoader = new GLTFLoader();
        const artData = [
            {
                title: "Madonna and the Sacred Chalice",
                artist: "Inspired by 19th Century European Religious Art",
                year: "c. 1800s",
                description: "A serene depiction of the Madonna in prayer, flanked by angels and sacred vessels, symbolizing purity and devotion.",
                position: [-12, wallY, wallZ],
                image: "/art/1.jpg"
            },
            {
                title: "Ethiopian Last Supper",
                artist: "Traditional Ethiopian Iconography",
                year: "c. 1900s",
                description: "A vibrant Ethiopian icon showing Christ and his disciples at the Last Supper, rendered in bold colors and stylized forms.",
                position: [-4, wallY, wallZ],
                image: "/art/2.jpg"
            },
            {
                title: "Portrait of a Renaissance Nobleman",
                artist: "After Raphael",
                year: "c. 1500s",
                description: "A detailed Renaissance portrait of a nobleman in luxurious red and gold attire, exuding power and confidence.",
                position: [4, wallY, wallZ],
                image: "/art/3.png"
            },
            {
                title: "Baroque Gentleman in Black and Gold",
                artist: "Circle of Van Dyck",
                year: "c. 1600s",
                description: "A Baroque-era portrait of a gentleman in black and gold, with a contemplative gaze and elaborate costume.",
                position: [12, wallY, wallZ],
                image: "/art/4.jpg"
            },
            {
                title: "Napoleon Crossing the Alps",
                artist: "Jacques-Louis David",
                year: "1801",
                description: "One of the most iconic portraits of Napoleon Bonaparte, this neoclassical masterpiece by Jacques-Louis David depicts the French leader heroically crossing the Alps on a rearing horse. The dramatic pose, flowing red cloak, and stormy landscape emphasize Napoleon's power, determination, and legendary status as a military leader.",
                position: [-8, wallY, depth / 2 - 0.1], // left of the door, front wall, same distance as metal sculpture
                image: "/art/10.jpg"
            }
        ];

        const textureLoader = new THREE.TextureLoader();

        artData.forEach(art => {
            const geometry = new THREE.PlaneGeometry(2, 3);
            let material;
            if (art.image) {
                // Add debug logging for Napoleon painting
                if (art.title === "Napoleon Crossing the Alps") {
                    const texture = textureLoader.load(
                        art.image,
                        () => { console.log('Napoleon image loaded successfully:', art.image); },
                        undefined,
                        (err) => { console.error('Error loading Napoleon image:', art.image, err); }
                    );
                    material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
                } else {
                    const texture = textureLoader.load(art.image);
                    material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
                }
            } else {
                material = new THREE.MeshLambertMaterial({ color: art.color || 0xffffff, side: THREE.DoubleSide });
            }
            // Frame: thin box, slightly larger than painting
            const frameWidth = 2.2;
            const frameHeight = 3.2;
            const frameDepth = 0.12;
            const frameColor = 0x8d6748; // warm wood color
            const frameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
            const frameMat = new THREE.MeshPhysicalMaterial({
                color: frameColor,
                roughness: 0.4,
                metalness: 0.3,
                clearcoat: 0.2,
                reflectivity: 0.2
            });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            // Offset for wall normal
            let offset = new THREE.Vector3(0, 0, 0);
            const pos = art.position;
            let framePos = [pos[0], pos[1], pos[2]];
            let paintingPos = [pos[0], pos[1], pos[2]];
            if (Math.abs(pos[2]) > Math.abs(pos[0])) {
                // Back or front wall
                if (pos[2] < 0) {
                    // Back wall
                    framePos[2] = pos[2] + frameDepth / 2;
                    paintingPos[2] = pos[2] + frameDepth / 2 + 0.001;
                } else {
                    // Front wall
                    framePos[2] = pos[2] - frameDepth / 2;
                    paintingPos[2] = pos[2] - frameDepth / 2 - 0.001;
                }
            } else {
                // Left or right wall
                if (pos[0] < 0) {
                    // Left wall
                    framePos[0] = pos[0] + frameDepth / 2;
                    paintingPos[0] = pos[0] + frameDepth / 2 + 0.001;
                } else {
                    // Right wall
                    framePos[0] = pos[0] - frameDepth / 2;
                    paintingPos[0] = pos[0] - frameDepth / 2 - 0.001;
                }
            }
            // Frame position (centered on wall)
            frame.position.set(pos[0] + offset.x, pos[1] + offset.y, pos[2] + offset.z);
            frame.castShadow = true;
            frame.receiveShadow = true;
            this.scene.add(frame);
            // Painting position (slightly in front of frame)
            let paintingOffset = offset.clone();
            if (Math.abs(pos[2]) > Math.abs(pos[0])) {
                // Back or front wall
                if (pos[2] < 0) {
                    paintingOffset = new THREE.Vector3(0, 0, 0.07); // back wall
                } else {
                    // front wall (Napoleon painting and others)
                    paintingOffset = new THREE.Vector3(0, 0, -0.1); // much larger gap for front wall
                }
            } else {
                // Left or right wall
                paintingOffset = pos[0] < 0 ? new THREE.Vector3(0.07, 0, 0) : new THREE.Vector3(-0.07, 0, 0);
            }
            const artPiece = new THREE.Mesh(geometry, material);
            artPiece.position.set(pos[0] + paintingOffset.x, pos[1] + paintingOffset.y, pos[2] + paintingOffset.z);
            // Rotate painting to face into the room if on the front wall
            if (pos[2] > 0 && Math.abs(pos[2]) > Math.abs(pos[0])) {
                artPiece.rotation.y = Math.PI;
            }
            artPiece.castShadow = true;
            artPiece.receiveShadow = true;
            artPiece.userData = art;
            this.scene.add(artPiece);
            this.artPieces.push(artPiece);
        });

        // --- Add 3D art objects on pedestals ---
        this.sculptures = [];
        const pedestalData = [
            {
                pos: [-10, 1, 0],
                color: 0xffffff,
                artType: 'torusKnot',
                artColor: 0x8e44ad,
                title: "Infinity Loop",
                artist: "Contemporary Abstract",
                year: "2022",
                description: "A mesmerizing torus knot sculpture symbolizing infinity and the interconnectedness of all things. Its metallic purple sheen evokes a sense of modern elegance."
            },
            {
                pos: [0, 1, 8],
                color: 0xffffff,
                artType: 'dodecahedron',
                artColor: 0xe67e22,
                title: "Platonic Harmony",
                artist: "Geometric Modernist",
                year: "2021",
                description: "A bold dodecahedron sculpture representing mathematical beauty and harmony. The vibrant orange finish highlights its geometric perfection."
            },
            {
                pos: [10, 1, -5],
                color: 0xffffff,
                artType: 'icosahedron',
                artColor: 0x16a085,
                title: "Crystal Form",
                artist: "Futurist Studio",
                year: "2023",
                description: "A teal icosahedron sculpture inspired by natural crystal structures, blending futuristic design with organic symmetry."
            },
            // Golden Sculpture
            {
                pos: [-8, 1, 10],
                color: 0xffffff,
                title: "Emblem of 'The Golden Head' Pharmacy in Kraków",
                artist: "Unknown",
                year: "18th Century (approx.)",
                description: "This sculpture is a digital replica of the emblem from the historic 'Golden Head' pharmacy in Kraków, Poland. The original emblem is a symbol of the city's rich medical and cultural heritage, and has adorned the pharmacy since the 18th century.",
                glb: '/models/golden_sculpture.glb'
            },
            // The Thinker
            {
                pos: [7, 1, -10],
                color: 0xffffff,
                title: "The Thinker (Replica)",
                artist: "After Auguste Rodin",
                year: "1902 (Replica)",
                description: "A faithful replica of Rodin's iconic sculpture, symbolizing deep contemplation and the power of human thought.",
                glb: '/models/the_thinker_by_auguste_rodin.glb'
            },
            // Empty Stand 3 (now with Roza Loewenfeld bust)
            {
                pos: [13, 1, 7],
                color: 0xffffff,
                title: "Bust of Roza Loewenfeld",
                artist: "Unknown",
                year: "19th Century",
                description: "A digital replica of the sculpture bust of Roza Loewenfeld, capturing the dignified features and artistic style of the 19th century.",
                glb: '/models/sculpture_bust_of_roza_loewenfeld.glb'
            }
        ];
    pedestalData.forEach((ped, i) => {
            // Pedestal (rectangular cube)
            const pedestalGeo = new THREE.BoxGeometry(2, 2, 2);
            const pedestalMat = new THREE.MeshLambertMaterial({ color: ped.color });
            const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
            pedestal.position.set(...ped.pos);
            pedestal.castShadow = true;
            pedestal.receiveShadow = true;
            this.scene.add(pedestal);

            let sculptureObject = null;
            // Only add art object if it's a Three.js art or a GLB
            if (ped.artType) {
                let artGeo, artMat;
                if (ped.artType === 'torusKnot') {
                    artGeo = new THREE.TorusKnotGeometry(1, 0.35, 128, 16);
                } else if (ped.artType === 'dodecahedron') {
                    artGeo = new THREE.DodecahedronGeometry(1.1);
                } else if (ped.artType === 'icosahedron') {
                    artGeo = new THREE.IcosahedronGeometry(1.1, 1);
                } else {
                    artGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                }
                artMat = new THREE.MeshPhysicalMaterial({
                    color: ped.artColor,
                    roughness: 0.25,
                    metalness: 0.7,
                    clearcoat: 0.5,
                    clearcoatRoughness: 0.15,
                    reflectivity: 0.6,
                    sheen: 1.0,
                    sheenColor: new THREE.Color(0xffffff)
                });
                const artObj = new THREE.Mesh(artGeo, artMat);
                artObj.position.set(ped.pos[0], ped.pos[1] + 1.7, ped.pos[2]);
                artObj.castShadow = true;
                artObj.receiveShadow = true;
                artObj.userData.isSculpture = true;
                artObj.userData.title = ped.title;
                artObj.userData.artist = ped.artist;
                artObj.userData.year = ped.year;
                artObj.userData.description = ped.description;
                this.scene.add(artObj);
                this.sculptures.push(artObj);
                sculptureObject = artObj;
// Add a spotlight above each procedural sculpture
                const spot = new THREE.SpotLight(ped.artColor, 1.2, 10, Math.PI / 6, 0.3, 1);
                spot.position.set(ped.pos[0], ped.pos[1] + 7, ped.pos[2]);
                spot.target = artObj;
                spot.castShadow = true;
                this.scene.add(spot);
            } else if (ped.glb) {
                gltfLoader.load(ped.glb, (gltf) => {
                    const model = gltf.scene;
                      // Center and scale the model
                                        const box = new THREE.Box3().setFromObject(model);
                                        const size = new THREE.Vector3();
                                        box.getSize(size);
                                        const maxDim = Math.max(size.x, size.y, size.z);
                                        let scale = 1.2 / maxDim;
                                        // If this is the golden sculpture, The Thinker, or Roza Loewenfeld, scale it 2x
                                        if (
                                            ped.title === "Emblem of 'The Golden Head' Pharmacy in Kraków" ||
                                            ped.title === "The Thinker (Replica)" ||
                                            ped.title === "Bust of Roza Loewenfeld"
                                        ) {
                                            scale *= 2;
                                        }
                                        model.scale.set(scale, scale, scale);