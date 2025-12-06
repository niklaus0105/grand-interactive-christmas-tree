# Grand Luxury Interactive Christmas Tree 🎄

A high-fidelity, cinematic 3D interactive web experience built for the holidays. This application renders a "Trump-style" luxury Christmas tree in real-time, featuring thousands of particles, dynamic physics, and advanced hand gesture control.

## ✨ Features

*   **Cinematic Visuals**: Grand Emerald, Ruby, and Gold color palette with real-time bloom, sparkles, and HDR lighting.
*   **Dual-State Physics**: The tree dynamically morphs between a **Formed** state (classic cone) and a **Chaos** state (scattered particles) based on user interaction.
*   **Gesture Control (AI Powered)**: Uses MediaPipe Hand Tracking to control the experience via webcam.
    *   ✊ **Fist**: Form the tree (Leash).
    *   🖐️ **Open Hand**: Unleash the particles (Chaos).
    *   👌 **OK Sign**: Summon a random memory photo to the center of the screen.
*   **Memory Gallery**: Polaroid-style photos float within the chaos. Users can upload their own images to replace the defaults.
*   **Mouse Fallback**: Fully interactive via mouse click (Hold to unleash) and movement (pan camera) if no webcam is available.

## 🛠️ Tech Stack

*   **Core**: React 19, TypeScript
*   **3D Engine**: Three.js, React Three Fiber (R3F)
*   **Helpers**: @react-three/drei (Environment, Sparkles, Float, Image)
*   **Post-Processing**: @react-three/postprocessing (Bloom, Vignette)
*   **AI/CV**: @mediapipe/tasks-vision (Hand Landmarker)
*   **Styling**: Tailwind CSS

## 🚀 How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm start
    ```

3.  **Allow Camera Access**:
    When prompted, allow browser access to your webcam to enable gesture features.

## 🎮 Controls

### Mouse Mode (Default)
*   **Click & Hold**: Unleash the tree into chaos.
*   **Release**: Reform the tree.
*   **Move Mouse**: Rotate the camera around the tree.

### Gesture Mode (Toggle Bottom Left)
*   **Fist (✊)**: Keep the tree formed.
*   **Open Hand (🖐️)**: Explode the tree into particles.
*   **OK Sign (👌)**: While unleashed, bring a photo to the center of the screen. Do it again to see another one.
*   **Hand Movement**: Move your hand left/right to rotate the camera view.

## 🎨 Customization
*   **Upload Memories**: Click the "Upload Memories" button below the title to add your own photos to the floating gallery.

---
*Merry Christmas!*
