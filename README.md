# Virtual Art Gallery Tour - Three.js Project

An interactive 3D virtual art gallery built with Three.js, featuring immersive navigation, interactive art pieces, and modern web technologies.

## 👥 Team
**Developers**
- **Abiy Hailu** - UGR/8730/15
- **Natnael Eyuel** - UGR/4424/15
- **Yamlak Ngeash** - UGR/2910/15
- **Eyerusalem T/brhan** - UGR/6149/15
- **Dame Abera** - UGR/0123/15
- **Kaku Amsalu** - UGR/3710/15

- **Course**: Computer Graphics
- **Institution**: Addis Ababa University

## 🎨 Features

### Core Features
- **3D Gallery Environment**: Immersive 3D space with checkerboard floor, textured walls, and modern ceiling
- **Interactive Art Pieces**: Multiple paintings and 3D sculptures, each with info panels and camera close-up animation
- **Camera Controls**: OrbitControls for smooth camera navigation, plus WASD keyboard movement
- **Raycasting**: Click and hover detection for all art pieces, sculptures, and the door
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with navigation and info overlays

### Technical Features
- **Three.js Integration**: Full 3D rendering with WebGL
- **Lighting System**: Ambient, directional, spot, and point lighting for realistic illumination
- **Shadow Mapping**: Realistic shadows and lighting effects
- **Animation**: Smooth camera movements and object animations
- **Event Handling**: Mouse and keyboard controls (WASD for movement)
- **Performance Optimized**: Efficient rendering and memory management

### Recent Additions & Improvements
- **Front Wall Art**: Added "Napoleon Crossing the Alps" painting with correct placement, info, and interactivity
- **Benches**: Two 3D benches (bench.glb) placed near the left and right walls, scaled and positioned precisely on the floor
- **GLB Model Compatibility**: All GLB models (including benches) use simplified materials for maximum compatibility
- **Gallery Symmetry**: Art and sculptures are symmetrically placed relative to the door
- **UI Streamlining**: Removed Toggle Lights and Fullscreen buttons for a cleaner interface
- **Robust Error Handling**: Improved debug logging and error handling for asset loading

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/virtual-art-gallery-tour-threejs.git
   cd virtual-art-gallery-tour-threejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 Controls

### Mouse Controls
- **Left Click + Drag**: Rotate camera around the scene
- **Scroll Wheel**: Zoom in/out
- **Click on Art Pieces**: View detailed information

### Keyboard Controls
- **W/A/S/D**: Move camera forward/left/backward/right

### UI Controls
- **Reset View**: Return camera to default position
- **Navigation Buttons**: Instantly view each wall

## 🏗️ Project Structure

```
virtual-art-gallery-tour-threejs/
├── index.html              # Main HTML file
├── style.css               # Styles and UI components
├── main.js                 # Three.js application logic
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # Project documentation
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Adding New Art Pieces

To add new art pieces, modify the `artData` array in `main.js`:

```javascript
const artData = [
    {
        title: "Your Art Title",
        artist: "Artist Name",
        year: "2024",
        description: "Art piece description",
        position: [x, y, z],  // 3D coordinates
        image: "/art/your-image.jpg" // or .png, .webp
    }
    // ... more art pieces
];
```

### Adding 3D Models

To add new 3D models (GLB), add them to the `public/models/` directory and load them in `main.js` using `GLTFLoader`. For benches and other furniture, ensure you set a simple material to avoid GPU texture unit errors.

### Customizing the Gallery

- **Lighting**: Modify `setupLighting()` method in `main.js`
- **Materials**: Change materials in `createArtPieces()` method
- **Camera**: Adjust camera settings in `setupCamera()` method
- **UI**: Customize styles in `style.css`

## 🌐 Deployment

### GitHub Pages

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy automatically**
   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages**
   - Go to repository Settings > Pages
   - Select "gh-pages" branch as source
   - Your site will be available at `https://username.github.io/repository-name`

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts** to configure your deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Drag the `dist` folder** to Netlify's deploy area
3. **Your site will be live** with a Netlify URL

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🎯 Learning Objectives Met

This project demonstrates understanding of:

- ✅ **WebGL and Three.js basics**
- ✅ **Object-oriented programming in JavaScript**
- ✅ **Interactive, optimized 3D scenes**
- ✅ **Real-time rendering and animation logic**
- ✅ **Git and project management tools**

### Technical Requirements Fulfilled

- ✅ **Multiple unique 2D and 3D art pieces** (paintings, sculptures, benches)
- ✅ **Camera controls** (OrbitControls, WASD movement)
- ✅ **Lighting system** (ambient, directional, spot, and point lights)
- ✅ **User interaction** (click, hover, keyboard controls)
- ✅ **Texture mapping** (images and procedural materials)
- ✅ **Animation** (camera movement, object scaling, rotation)

## 🔧 Troubleshooting

### Common Issues

1. **Three.js not loading**
   - Ensure all dependencies are installed: `npm install`
   - Check browser console for errors

2. **Performance issues**
   - Reduce shadow map resolution in `setupLighting()`
   - Lower polygon count for complex geometries

3. **Mobile responsiveness**
   - Test on different screen sizes
   - Adjust camera controls for touch devices

### Performance Tips

- Use `Object3D` groups for better scene organization
- Implement level-of-detail (LOD) for complex scenes
- Optimize textures and materials
- Use `FrustumCulling` for large scenes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is developed for educational purposes as part of the Computer Graphics course at Addis Ababa University.

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Contact: abiy.hailu-ug@aau.edu.et

---

**Built with ❤️ using Three.js and modern web technologies**