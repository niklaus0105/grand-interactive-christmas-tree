
/// <reference types="@react-three/fiber" />
import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ChristmasTree } from './ChristmasTree';

interface SceneProps {
  chaosLevel: number;
  cameraAzimuth: number; // -1 to 1
  userImages: string[];
  isHighlighting: boolean;
}

const Rig: React.FC<{ azimuth: number, chaos: number }> = ({ azimuth, chaos }) => {
  // Smooth camera movement based on hand/mouse
  useFrame((state) => {
    // Basic circular motion around center
    const radius = 20 + (chaos * 10); // Pull back when chaos
    const angle = azimuth * Math.PI; // -PI to PI
    
    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const targetY = 4 + (chaos * 5);

    state.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    state.camera.lookAt(0, 4, 0);
  });
  return null;
}

export const Scene: React.FC<SceneProps> = ({ chaosLevel, cameraAzimuth, userImages, isHighlighting }) => {
  return (
    <Canvas gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}>
      <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
      <Rig azimuth={cameraAzimuth} chaos={chaosLevel} />
      
      <color attach="background" args={['#011810']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Environment preset="lobby" background={false} blur={0.8} />
      
      <ambientLight intensity={0.4} />
      {/* Strong Golden Spotlight */}
      <spotLight position={[10, 20, 10]} angle={0.4} penumbra={1} intensity={5} castShadow color="#D4AF37" />
      <pointLight position={[-10, 5, -10]} intensity={2} color="#C5A028" />
      
      <ChristmasTree chaosLevel={chaosLevel} userImages={userImages} isHighlighting={isHighlighting} />
      
      <EffectComposer enableNormalPass={false}>
        {/* Stronger, wider bloom for the 'Cinematic' look */}
        <Bloom luminanceThreshold={0.65} mipmapBlur intensity={2.0} radius={0.5} levels={8} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};
