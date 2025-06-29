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
 // Recalculate bounding box and center after scaling for perfect centering
                    if (
                        ped.title === "The Thinker (Replica)" ||
                        ped.title === "Bust of Roza Loewenfeld"
                    ) {
                        const newBox = new THREE.Box3().setFromObject(model);
                        const newCenter = new THREE.Vector3();
                        newBox.getCenter(newCenter);
                        model.position.set(
                            ped.pos[0] - newCenter.x,
                            ped.pos[1] + 2.1 - newCenter.y,
                            ped.pos[2] - newCenter.z
                        );
                    } else {
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        model.position.set(
                            ped.pos[0] - center.x * scale,
                            ped.pos[1] + 2.1 - center.y * scale,
                            ped.pos[2] - center.z * scale
                        );
                    }  
                    // Only apply debug material to The Thinker
                                        model.traverse((child) => {
                                            if (child.isMesh) {
                                                if (ped.title === "The Thinker (Replica)") {
                                                    child.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                                                    child.visible = true;
                                                    child.material.opacity = 1;
                                                    child.material.transparent = false;
                                                }
                                                if (ped.title === "Emblem of 'The Golden Head' Pharmacy in Kraków") {
                                                    child.material = new THREE.MeshStandardMaterial({
                                                        color: 0xffd700, // gold
                                                        metalness: 1,
                                                        roughness: 0.3
                                                    });
                                                    child.visible = true;
                                                    child.material.opacity = 1;
                                                    child.material.transparent = false;
                                                    setTimeout(() => {
                                                        if (!child.material || !child.material.isMeshStandardMaterial || !child.visible) {
                                                            child.material = new THREE.MeshNormalMaterial();
                                                            child.visible = true;
                                                        }
                                                    }, 100);
                                                }
                                                child.castShadow = true;
                                                child.receiveShadow = true;
                                                child.userData = {
                                                    isSculpture: true,
                                                    title: ped.title,
                                                    artist: ped.artist,
                                                    year: ped.year,
                                                    description: ped.description
                                                };
                                            }
                                        });
                                        if (ped.title === "Golden Sculpture") {
                                            console.log('Golden Sculpture model added to scene:', model);
                                        }
                                        this.scene.add(model);
                                        this.sculptures.push(model);
                                        sculptureObject = model;
                                        // Add a spotlight above the GLB sculpture
                                        const spot = new THREE.SpotLight(0xffffff, 1.2, 10, Math.PI / 6, 0.3, 1);
                                        spot.position.set(ped.pos[0], ped.pos[1] + 7, ped.pos[2]);
                                        spot.target = model;
                                        spot.castShadow = true;
                                        this.scene.add(spot);
                                        // Add 4 point lights around the GLB sculpture
                                        const pointLightPositions = [
                                            { x: ped.pos[0],     y: ped.pos[1] + 4, z: ped.pos[2] },      // above
                                            { x: ped.pos[0] + 2, y: ped.pos[1] + 2, z: ped.pos[2] },      // right
                                            { x: ped.pos[0] - 2, y: ped.pos[1] + 2, z: ped.pos[2] },      // left
                                            { x: ped.pos[0],     y: ped.pos[1] + 2, z: ped.pos[2] + 2 }   // front
                                        ];
                                        pointLightPositions.forEach(pos => {
                                            const pt = new THREE.PointLight(0xffffff, 0.7, 6);
                                            pt.position.set(pos.x, pos.y, pos.z);
                                            pt.castShadow = false;
                                            this.scene.add(pt);
                                        });
                                    });
                                }
                                // No art object for the other stand (leave empty)
                            });

            // Add two benches near the left and right walls
                    const benchPositions = [
                        { x: -16, y: 1, z: 0 }, // left wall
                        { x: 16, y: 1, z: 0 }   // right wall
                    ];
                    benchPositions.forEach((pos, idx) => {
                        gltfLoader.load('/models/bench.glb', (gltf) => {
                            const model = gltf.scene;
                            // Center and scale the bench
                            const box = new THREE.Box3().setFromObject(model);
                            const size = new THREE.Vector3();
                            box.getSize(size);
                            const maxDim = Math.max(size.x, size.y, size.z);
                            let scale = 2.5 / maxDim; // scale so bench is ~2.5 units wide
                            scale *= 3; // scale benches 3x larger
                            model.scale.set(scale, scale, scale);
                            // Recenter to sit on the floor
                            const center = new THREE.Vector3();
                            box.getCenter(center);
                            // Calculate scaled minY for precise floor placement
                            const minY = box.min.y * scale;
                            model.position.set(
                                pos.x - center.x * scale,
                                0.01 - minY, // minimal gap above floor
                                pos.z - center.z * scale
                            );
                            model.traverse(child => {
                                if (child.isMesh) {
                                    // Force a simple brown material to avoid too many textures
                                    child.material = new THREE.MeshStandardMaterial({ color: 0x8d6748 });
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });
                            this.scene.add(model);
                        });
                    });
            
                    // Add paintings to the left wall, preserving aspect ratio, all at same height and evenly spaced and centered as a group
                    const leftWallImages = [
                        { 
                            file: '/art/5.jpg', 
                            title: 'The Starry Night', 
                            artist: 'Vincent van Gogh', 
                            year: '1889', 
                            description: 'A masterpiece of Post-Impressionism depicting a swirling night sky over a peaceful village. Van Gogh\'s expressive brushwork and vibrant colors create a sense of movement and emotion that transcends the ordinary landscape.' 
                        },
                        { 
                            file: '/art/6.jpg', 
                            title: 'Mona Lisa', 
                            artist: 'Leonardo da Vinci', 
                            year: '1503-1519', 
                            description: 'The world\'s most famous portrait, known for the subject\'s enigmatic smile and Leonardo\'s revolutionary sfumato technique. This Renaissance masterpiece continues to captivate viewers with its mysterious beauty and technical perfection.' 
                        },
                        { 
                            file: '/art/7.jpg', 
                            title: 'The Persistence of Memory', 
                            artist: 'Salvador Dalí', 
                            year: '1931', 
                            description: 'A surrealist icon featuring melting clocks draped over a barren landscape. Dalí\'s exploration of time, memory, and the subconscious mind creates a dreamlike atmosphere that challenges our perception of reality.' 
                        },
                        { 
                            file: '/art/1.webp', 
                            title: 'The Scream', 
                            artist: 'Edvard Munch', 
                            year: '1893', 
                            description: 'A powerful expressionist work capturing the anxiety and existential dread of modern life. The figure\'s anguished expression against a swirling, colorful sky has become a universal symbol of human emotion and psychological turmoil.' 
                        }
                    ];     
         const leftWallY = 4;
                const wallX = -20 + 0.06; // frameThickness/2, will be updated per frame
                const wallZMin = -12; // start of left wall (adjust as needed)
                const wallZMax = 12;  // end of left wall (adjust as needed)
                const wallUsableLength = wallZMax - wallZMin;
                const paintingHeight = 2.5;
                const frameThickness = 0.12;
                // Preload all images to get aspect ratios
                Promise.all(leftWallImages.map(img => {
                    return new Promise(resolve => {
                        const image = new window.Image();
                        image.src = img.file;
                        image.onload = () => {
                            const aspect = image.width / image.height;
                            const paintingWidth = paintingHeight * aspect;
                            const frameWidth = paintingWidth + 0.2;
                            resolve({ ...img, aspect, paintingWidth, frameWidth });
                        };
                    });
                })).then(paintings => {
                    // Calculate total width of all frames
                    const totalFramesWidth = paintings.reduce((sum, p) => sum + p.frameWidth, 0);
                    const numGaps = paintings.length - 1;
                    // Choose a reasonable gap (or maximize it to fill the wall)
                    let gap = 1.0; // initial guess
                    let groupWidth = totalFramesWidth + numGaps * gap;
                    if (groupWidth < wallUsableLength) {
                        gap = (wallUsableLength - totalFramesWidth) / (paintings.length + 1);
                        groupWidth = totalFramesWidth + numGaps * gap;
                    }
                    // Center the group
                    const groupStartZ = (wallZMin + wallZMax) / 2 - groupWidth / 2;
                    let currentZ = groupStartZ;
                    paintings.forEach((p, idx) => {
                        // Frame
                        const frameGeo = new THREE.BoxGeometry(p.frameWidth, paintingHeight + 0.2, frameThickness);
                        const frameMat = new THREE.MeshPhysicalMaterial({
                            color: 0x8d6748,
                            roughness: 0.4,
                            metalness: 0.3,
                            clearcoat: 0.2,
                            reflectivity: 0.2
                        });
                        const frame = new THREE.Mesh(frameGeo, frameMat);
                        frame.position.set(wallX, leftWallY, currentZ + p.frameWidth / 2);
                        frame.rotation.y = Math.PI / 2;
                        frame.castShadow = true;
                        frame.receiveShadow = true;
                        this.scene.add(frame);
                        // Painting - positioned slightly in front of the frame
                        const paintingGeo = new THREE.PlaneGeometry(p.paintingWidth, paintingHeight);
                        const texture = textureLoader.load(p.file);
                        const paintingMat = new THREE.MeshLambertMaterial({ map: texture });
                        const painting = new THREE.Mesh(paintingGeo, paintingMat);
                        // Position the painting slightly in front of the frame (along X-axis for left wall)
                        painting.position.set(wallX + frameThickness / 2 + 0.01, leftWallY, currentZ + p.frameWidth / 2);
                        painting.rotation.y = Math.PI / 2;
                        painting.castShadow = true;
                        painting.receiveShadow = true;
                        painting.userData = {
                            title: p.title,
                            artist: p.artist,
                            year: p.year,
                            description: p.description
                        };
                        this.scene.add(painting);
                        this.artPieces.push(painting);
                        // Move to next position
                        currentZ += p.frameWidth + gap;
                    });
                });
        
                // Add a single painting to the center of the right wall
                const rightWallImage = { 
                    file: '/art/9.png', 
                    title: 'Girl with a Pearl Earring', 
                    artist: 'Johannes Vermeer', 
                    year: '1665', 
                    description: 'Often called the "Mona Lisa of the North," this captivating portrait showcases Vermeer\'s mastery of light and detail. The subject\'s enigmatic gaze and the luminous pearl earring create an intimate, timeless moment that has fascinated viewers for centuries.' 
                };  
        const rightWallY = 4;
        const rightWallX = 20 - 0.06; // frameThickness/2 from the right wall
        const rightWallZ = 0; // center of the wall
        
        const rightImage = new window.Image();
        rightImage.src = rightWallImage.file;
        rightImage.onload = () => {
            const aspect = rightImage.width / rightImage.height;
            const paintingHeight = 2.5;
            const paintingWidth = paintingHeight * aspect;
            const frameThickness = 0.12;
            const frameWidth = paintingWidth + 0.2;
            
            // Frame
            const frameGeo = new THREE.BoxGeometry(frameWidth, paintingHeight + 0.2, frameThickness);
            const frameMat = new THREE.MeshPhysicalMaterial({
                color: 0x8d6748,
                roughness: 0.4,
                metalness: 0.3,
                clearcoat: 0.2,
                reflectivity: 0.2
            });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(rightWallX, rightWallY, rightWallZ);
            frame.rotation.y = -Math.PI / 2; // Face inward
            frame.castShadow = true;
            frame.receiveShadow = true;
            this.scene.add(frame);
            
            // Painting - positioned slightly in front of the frame
            const paintingGeo = new THREE.PlaneGeometry(paintingWidth, paintingHeight);
            const texture = textureLoader.load(rightWallImage.file);
            const paintingMat = new THREE.MeshLambertMaterial({ map: texture });
            const painting = new THREE.Mesh(paintingGeo, paintingMat);
            // Position the painting slightly in front of the frame (along X-axis for right wall)
            painting.position.set(rightWallX - frameThickness / 2 - 0.01, rightWallY, rightWallZ);
            painting.rotation.y = -Math.PI / 2; // Face inward
            painting.castShadow = true;
            painting.receiveShadow = true;
            painting.userData = {
                title: rightWallImage.title,
                artist: rightWallImage.artist,
                year: rightWallImage.year,
                description: rightWallImage.description
            };
            this.scene.add(painting);
            this.artPieces.push(painting);

            // Add spotlight fixture and lighting for the right wall painting
            const rightWallLightX = 20 - 0.06; // Same X as the painting
            const rightWallLightY = 6.5; // Above the painting
            const rightWallLightZ = 0; // Same Z as the painting
            
            // Cylindrical light fixture
            const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
            const fixtureMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2c2c2c,
                roughness: 0.8,
                metalness: 0.9,
                clearcoat: 0.3
            });
            const lightFixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            lightFixture.position.set(rightWallLightX, rightWallLightY, rightWallLightZ);
            lightFixture.rotation.z = Math.PI / 2; // Rotate to point downward
            lightFixture.castShadow = true;
            lightFixture.receiveShadow = true;
            this.scene.add(lightFixture);
            
            // Rod connecting fixture to wall
            const rodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
            const rodMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x1a1a1a,
                roughness: 0.6,
                metalness: 0.8
            });
            const rod = new THREE.Mesh(rodGeometry, rodMaterial);
            rod.position.set(rightWallLightX - 1, rightWallLightY, rightWallLightZ);
            rod.castShadow = true;
            rod.receiveShadow = true;
            this.scene.add(rod);
            
            // Spotlight from the fixture
            const rightWallSpotlight = new THREE.SpotLight(0xffffff, 2.0, 15, Math.PI / 6, 0.3, 1);
            rightWallSpotlight.position.set(rightWallLightX, rightWallLightY - 0.2, rightWallLightZ);
            rightWallSpotlight.target.position.set(rightWallLightX, rightWallLightY - 2, rightWallLightZ);
            rightWallSpotlight.castShadow = true;
            rightWallSpotlight.shadow.mapSize.width = 1024;
            rightWallSpotlight.shadow.mapSize.height = 1024;
            rightWallSpotlight.shadow.camera.near = 0.5;
            rightWallSpotlight.shadow.camera.far = 20;
            this.scene.add(rightWallSpotlight);
            this.scene.add(rightWallSpotlight.target);
            
            // Additional wall-mounted lights for better illumination
            const wallLightPositions = [
                { x: 19.5, y: 6, z: -3 },
                { x: 19.5, y: 6, z: 3 },
                { x: 19.5, y: 3, z: -1.5 },
                { x: 19.5, y: 3, z: 1.5 }
            ];
            
            wallLightPositions.forEach(pos => {
                // Small wall-mounted light fixture
                const wallFixtureGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 6);
                const wallFixtureMat = new THREE.MeshPhysicalMaterial({
                    color: 0x3a3a3a,
                    roughness: 0.7,
                    metalness: 0.6
                });
                const wallFixture = new THREE.Mesh(wallFixtureGeo, wallFixtureMat);
                wallFixture.position.set(pos.x, pos.y, pos.z);
                wallFixture.rotation.z = Math.PI / 2;
                wallFixture.castShadow = true;
                wallFixture.receiveShadow = true;
                this.scene.add(wallFixture);
                
                // Point light from wall fixture
                const wallLight = new THREE.PointLight(0xffffff, 0.8, 8, 2);
                wallLight.position.set(pos.x - 0.1, pos.y, pos.z);
                wallLight.castShadow = true;
                this.scene.add(wallLight);
            });
        };

        // Load and position the door on the front wall
        const doorPath = '/models/door.glb';
        const width = 40;
        const frontWallZ = depth / 2; // Front wall position (15)
        const wallHeight = 8; // Ceiling height
        const floorY = 0;
        
        // Create wall material for door segments
        const wallTexture = this.createRoughTexture(512, 128, '#e0e0e0', '#b0b0b0');
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(4, 1);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xe0e0e0, // greish white
            map: wallTexture,
            side: THREE.DoubleSide
        });
        
        gltfLoader.load(doorPath, (gltf) => {
            const door = gltf.scene;
            // Store reference to door and add metadata
            this.door = door;
            door.userData = {
                title: "Grand Entrance Door",
                artist: "Architectural Design",
                year: "2024",
                description: "A magnificent entrance door crafted with precision and elegance. This architectural masterpiece serves as the gateway to our virtual art gallery, featuring intricate details and a timeless design that welcomes visitors into the world of artistic wonder.",
                isDoor: true
            };
            
            // Ensure door is properly positioned and scaled
            // Compute door bounding box
            const box = new THREE.Box3().setFromObject(door);
            const doorMinY = box.min.y;
            const doorMaxY = box.max.y;
            const doorHeight = doorMaxY - doorMinY;
            const scale = (wallHeight / doorHeight) * 1.10; // 10% overscale
            door.scale.set(scale, scale, scale);
            
            // Position the door properly on the front wall
            door.position.set(0, floorY + wallHeight / 2, frontWallZ - 0.1); // Slightly in front of wall
            
            // Make all door meshes clickable
            door.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Copy userData to each mesh for click detection
                    child.userData = { ...door.userData };
                }
            });
            this.scene.add(door);

            const doorWidth = 6; // reduced width for a smaller doorway
            const scaledDoorHeight = doorHeight * scale;
            
            // Left segment (beside door)
            const frontWallLeft = new THREE.Mesh(
                new THREE.PlaneGeometry((width - doorWidth) / 2, scaledDoorHeight),
                wallMaterial
            );
            frontWallLeft.position.set(-(width + doorWidth) / 4, floorY + scaledDoorHeight / 2, frontWallZ);
            frontWallLeft.rotation.y = Math.PI;
            frontWallLeft.receiveShadow = true;
            this.scene.add(frontWallLeft);
            
            // Right segment (beside door)
            const frontWallRight = new THREE.Mesh(
                new THREE.PlaneGeometry((width - doorWidth) / 2, scaledDoorHeight),
                wallMaterial
            );
            frontWallRight.position.set((width + doorWidth) / 4, floorY + scaledDoorHeight / 2, frontWallZ);
            frontWallRight.rotation.y = Math.PI;
            frontWallRight.receiveShadow = true;
            this.scene.add(frontWallRight);
            
            // Header segment (above door)
            if (wallHeight > scaledDoorHeight) {
                const headerHeight = wallHeight - scaledDoorHeight;
                const frontWallHeader = new THREE.Mesh(
                    new THREE.PlaneGeometry(doorWidth, headerHeight),
                    wallMaterial
                );
                frontWallHeader.position.set(0, floorY + scaledDoorHeight + headerHeight / 2, frontWallZ);
                frontWallHeader.rotation.y = Math.PI;
                frontWallHeader.receiveShadow = true;
                this.scene.add(frontWallHeader);
            }
            
            console.log('Door loaded successfully at position:', door.position);
        }, (progress) => {
            console.log('Loading door...', (progress.loaded / progress.total * 100) + '%');
        }, (error) => {
            console.error('Error loading door:', error);
            // Create a fallback door if loading fails
            this.createFallbackDoor(width, depth, frontWallZ, wallHeight, floorY, wallMaterial);
        });

        // Add wall-mounted sculptures to the front wall (left and right of the door)
        const wallSculptures = [
            {
                glb: '/models/metal_sculptures_01.glb',
                title: 'Metal Sculpture (Buddhist Temple)',
                artist: 'Unknown',
                year: 'Modern',
                description: 'A sculpture on the wall of a Buddhist temple. This is one of two symmetrical pictures.',
                pos: [8, 4, 14.7], // right of door, just in front of wall
                rotY: 0 // face into the room
            }
        ];
        wallSculptures.forEach((sculpt) => {
            gltfLoader.load(sculpt.glb, (gltf) => {
                const model = gltf.scene;
                // Scale and center the model
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                let scale = 4 / size.x; // Scale up more for visibility
                model.scale.set(scale, scale, scale);
                // Center the model on the wall
                const center = new THREE.Vector3();
                box.getCenter(center);
                // For Baroque Faun, align the back of the model to the wall (z=15)
                if (sculpt.title === 'Baroque Faun Sculpture') {
                    // Recompute bounding box after scaling
                    model.updateMatrixWorld(true);
                    const scaledBox = new THREE.Box3().setFromObject(model);
                    const boxCenter = new THREE.Vector3();
                    scaledBox.getCenter(boxCenter);
                    const maxZ = scaledBox.max.z;
                    const wallZ = 15;
                    // Set position so center x/y matches config, and back is flush with wall
                    model.position.x += (sculpt.pos[0] - boxCenter.x);
                    model.position.y += (sculpt.pos[1] - boxCenter.y);
                    model.position.z += (wallZ - maxZ);
                    // Manual z-offset to bring it inside the room
                    model.position.z += 3;
                } else {
                    model.position.set(
                        sculpt.pos[0] - center.x * scale,
                        sculpt.pos[1] - center.y * scale,
                        sculpt.pos[2] - center.z * scale
                    );
                }
                model.rotation.y = sculpt.rotY;
                model.traverse((child) => {
                    if (child.isMesh) {
                        if (sculpt.title === 'Metal Sculpture (Buddhist Temple)') {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x8c7853, // classic bronze
                                metalness: 0.85,
                                roughness: 0.45
                            });
                            child.visible = true;
                            child.material.opacity = 1;
                            child.material.transparent = false;
                        }
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData = {
                            isSculpture: true,
                            title: sculpt.title,
                            artist: sculpt.artist,
                            year: sculpt.year,
                            description: sculpt.description
                        };
                    }
                });
                this.scene.add(model);
                this.sculptures.push(model);
                // Add multiple point lights around the wall sculpture for full visibility
                if (sculpt.title === 'Metal Sculpture (Buddhist Temple)') {
                    const lightPositions = [
                        { x: sculpt.pos[0],     y: sculpt.pos[1] + 2, z: sculpt.pos[2] },      // above
                        { x: sculpt.pos[0],     y: sculpt.pos[1] - 2, z: sculpt.pos[2] },      // below
                        { x: sculpt.pos[0] + 2, y: sculpt.pos[1],     z: sculpt.pos[2] },      // right
                        { x: sculpt.pos[0] - 2, y: sculpt.pos[1],     z: sculpt.pos[2] },      // left
                        { x: sculpt.pos[0],     y: sculpt.pos[1],     z: sculpt.pos[2] + 2 },  // front
                        { x: sculpt.pos[0],     y: sculpt.pos[1],     z: sculpt.pos[2] - 2 }   // back
                    ];
                    lightPositions.forEach(pos => {
                        const pt = new THREE.PointLight(0xffffff, 1.0, 6);
                        pt.position.set(pos.x, pos.y, pos.z);
                        pt.castShadow = false;
                        this.scene.add(pt);
                    });
                    // Add ambient and directional light for the metal sculpture
                    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
                    this.scene.add(ambient);
                    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    dirLight.position.set(sculpt.pos[0], sculpt.pos[1] + 8, sculpt.pos[2] + 5);
                    dirLight.target.position.set(sculpt.pos[0], sculpt.pos[1], sculpt.pos[2]);
                    this.scene.add(dirLight);
                    this.scene.add(dirLight.target);
                } else {
                    // Add a point light above each wall sculpture (default)
                    const pt = new THREE.PointLight(0xffffff, 1.0, 6);
                    pt.position.set(sculpt.pos[0], sculpt.pos[1] + 2, sculpt.pos[2] - 0.5);
                    pt.castShadow = false;
                    this.scene.add(pt);
                }
            });
        });
    }

    setupEventListeners() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.handleMouseMove();
        });

        window.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.handleClick();
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveState.forward = true; break;
                case 'KeyS': this.moveState.backward = true; break;
                case 'KeyA': this.moveState.left = true; break;
                case 'KeyD': this.moveState.right = true; break;
            }
        });
        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveState.forward = false; break;
                case 'KeyS': this.moveState.backward = false; break;
                case 'KeyA': this.moveState.left = false; break;
                case 'KeyD': this.moveState.right = false; break;
            }
        });
    }

    setupUI() {
        document.getElementById('reset-camera').addEventListener('click', () => {
            this.camera.position.set(0, 5, 10);
            this.controls.reset();
        });

        document.getElementById('close-info').addEventListener('click', () => {
            this.hideArtInfo();
        });

        // Add navigation button listeners
        const navIds = [
            { id: 'nav-back', target: 0 },
            { id: 'nav-front', target: 1 },
            { id: 'nav-left', target: 2 },
            { id: 'nav-right', target: 3 }
        ];
        navIds.forEach(nav => {
            const btn = document.getElementById(nav.id);
            if (btn) {
                btn.addEventListener('click', () => {
                    const target = this.arrowTargets[nav.target];
                    this.animateCameraTo(target.position, target.lookAt);
                });
            }
        });
    }

    handleMouseMove() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Get all objects in the scene for better door detection
        const allObjects = [];
        this.scene.traverse((object) => {
            if (object.isMesh && (object.userData.title || object.userData.isDoor || object.userData.isSculpture)) {
                allObjects.push(object);
            }
        });
        const intersects = this.raycaster.intersectObjects(allObjects);

        // Only reset scale for art pieces
        this.artPieces.forEach(piece => {
            piece.scale.set(1, 1, 1);
        });

        if (intersects.length > 0) {
            const hovered = intersects[0].object;
            // Only scale art pieces, not the door
            if (!hovered.userData.isDoor) {
                hovered.scale.set(1.05, 1.05, 1.05);
            }
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    handleClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Get all objects in the scene for better door detection
        const allObjects = [];
        this.scene.traverse((object) => {
            if (object.isMesh && (object.userData.title || object.userData.isDoor || object.userData.isSculpture)) {
                allObjects.push(object);
            }
        });
        const intersects = this.raycaster.intersectObjects(allObjects);

        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            if (clicked.userData && clicked.userData.isDoor) {
                // Animate camera to a close-up view of the door
                const objPos = clicked.getWorldPosition(new THREE.Vector3());
                const cameraOffset = new THREE.Vector3(0, 0, 6); // 6 units in front
                const closePos = objPos.clone().add(cameraOffset);
                this.animateCameraTo(closePos, objPos);
                this.showArtInfo(clicked.userData);
            } else if (clicked.userData && clicked.userData.isSculpture) {
                // Animate camera to a close-up view of the sculpture
                // For GLB models, find the root sculpture object
                let rootSculpture = clicked;
                for (const s of this.sculptures) {
                    if (s.isMesh) {
                        if (s === clicked) { rootSculpture = s; break; }
                    } else if (s.isObject3D && s.children && s.children.length > 0) {
                        if (s.getObjectById(clicked.id)) { rootSculpture = s; break; }
                    }
                }
                const objPos = rootSculpture.getWorldPosition(new THREE.Vector3());
                const camDir = new THREE.Vector3().subVectors(this.camera.position, objPos).normalize();
                let distance = 3;
                if (clicked.userData && clicked.userData.title === "The Thinker (Replica)") {
                    distance = 5; // Move further for The Thinker
                }
                const closePos = objPos.clone().add(camDir.multiplyScalar(distance));
                this.animateCameraTo(closePos, objPos);
                this.showArtInfo(clicked.userData);
            } else {
                // Animate camera to a close-up view of the painting
                const objPos = clicked.position;
                // For paintings, move the camera 3 units in front of the painting (along the normal)
                // Assume paintings are always facing +z (back wall), so normal is (0,0,1)
                let normal = new THREE.Vector3(0, 0, 1);
                // If the painting is on the back wall (z < 0), normal should be (0,0,1)
                // If on the front wall (z > 0), normal should be (0,0,-1)
                if (Math.abs(objPos.z) > Math.abs(objPos.x)) {
                    normal = objPos.z < 0 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1);
                } else {
                    // If on left/right wall, normal is along x
                    normal = objPos.x < 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
                }
                const closePos = objPos.clone().add(normal.multiplyScalar(3));
                this.animateCameraTo(closePos, objPos);
                this.showArtInfo(clicked.userData);
            }
        }
    }
