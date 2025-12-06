
/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Float, Sparkles, Extrude } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG, COLORS, PLACEHOLDER_IMAGES } from '../constants';
import { TreeParticle } from '../types';

// --- Helper Math ---
const randomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

const treeConePoint = (height: number, maxRadius: number, yPercent: number): [number, number, number] => {
  const y = (yPercent - 0.5) * height;
  const radiusAtY = maxRadius * (1 - yPercent);
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radiusAtY;
  
  return [
    r * Math.cos(theta),
    y,
    r * Math.sin(theta)
  ];
};

// --- Components ---

const StarTopper = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.4;
    for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const a = (i / (points * 2)) * Math.PI * 2;
        const x = Math.cos(a + Math.PI / 2) * r; 
        const y = Math.sin(a + Math.PI / 2) * r;
        if(i===0) s.moveTo(x,y);
        else s.lineTo(x,y);
    }
    s.closePath();
    return s;
  }, []);
  
  return (
    <group position={[0, CONFIG.TREE_HEIGHT / 2 + 0.5, 0]}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Extrude args={[shape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05 }]}>
                 <meshStandardMaterial 
                    color={COLORS.GOLD} 
                    emissive={COLORS.GOLD} 
                    emissiveIntensity={2} 
                    metalness={1} 
                    roughness={0.1}
                    toneMapped={false}
                 />
            </Extrude>
        </Float>
        <pointLight intensity={3} color={COLORS.GOLD} distance={8} decay={2} />
    </group>
  )
}

const Foliage: React.FC<{ chaosLevel: number }> = ({ chaosLevel }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp: TreeParticle[] = [];
    for (let i = 0; i < CONFIG.FOLIAGE_COUNT; i++) {
      const yPerc = Math.random();
      const target = treeConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS, yPerc);
      const chaos = randomSpherePoint(CONFIG.CHAOS_RADIUS);
      
      // Elegant Palette Distribution
      let color = COLORS.EMERALD_DEEP;
      const rand = Math.random();
      if (rand > 0.85) color = COLORS.GOLD; 
      else if (rand > 0.7) color = COLORS.EMERALD_VIBRANT;
      else if (rand > 0.6) color = COLORS.FOREST_GREEN;
      else if (rand > 0.5) color = COLORS.CHAMPAGNE;
      
      temp.push({
        id: i,
        targetPos: target,
        chaosPos: chaos,
        speed: 0.5 + Math.random(),
        color: color
      });
    }
    return temp;
  }, []);

  const positions = useMemo(() => new Float32Array(CONFIG.FOLIAGE_COUNT * 3), [particles]);
  const colors = useMemo(() => {
    const arr = new Float32Array(CONFIG.FOLIAGE_COUNT * 3);
    const colorObj = new THREE.Color();
    particles.forEach((p, i) => {
      colorObj.set(p.color);
      arr[i*3] = colorObj.r;
      arr[i*3+1] = colorObj.g;
      arr[i*3+2] = colorObj.b;
    });
    return arr;
  }, [particles]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    
    const easedChaos = THREE.MathUtils.smoothstep(chaosLevel, 0, 1);

    for (let i = 0; i < CONFIG.FOLIAGE_COUNT; i++) {
      const p = particles[i];
      
      const lx = THREE.MathUtils.lerp(p.targetPos[0], p.chaosPos[0], easedChaos);
      const ly = THREE.MathUtils.lerp(p.targetPos[1], p.chaosPos[1], easedChaos);
      const lz = THREE.MathUtils.lerp(p.targetPos[2], p.chaosPos[2], easedChaos);

      const noise = Math.sin(time * p.speed + p.id) * 0.1;
      
      positions[i*3] = lx + noise;
      positions[i*3+1] = ly + noise;
      positions[i*3+2] = lz + noise;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.15}
        sizeAttenuation
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const Ornaments: React.FC<{ chaosLevel: number }> = ({ chaosLevel }) => {
  const count = CONFIG.ORNAMENT_COUNT;
  
  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const yPerc = Math.random() * 0.9; 
      const target = treeConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS * 1.1, yPerc);
      const chaos = randomSpherePoint(CONFIG.CHAOS_RADIUS * 1.2);
      const type = Math.random() > 0.4 ? 'ball' : 'box';
      
      // Elegant Colors - Red, Green, Gold
      let color = COLORS.GOLD;
      const r = Math.random();
      if (r > 0.75) color = COLORS.RUBY_RED;
      else if (r > 0.6) color = COLORS.FOREST_GREEN; 
      else if (r > 0.5) color = COLORS.BRONZE;
      else if (r > 0.3) color = COLORS.CHAMPAGNE;

      return {
        id: i,
        target,
        chaos,
        type,
        color,
        scale: 0.2 + Math.random() * 0.3
      };
    });
  }, [count]);

  return (
    <group>
       {data.map((d, i) => (
         <SingleOrnament key={i} data={d} chaosLevel={chaosLevel} />
       ))}
    </group>
  );
};

const SingleOrnament: React.FC<{ data: any, chaosLevel: number }> = ({ data, chaosLevel }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!ref.current) return;
    const { target, chaos } = data;
    
    const easedChaos = THREE.MathUtils.smoothstep(chaosLevel, 0, 1);
    
    const x = THREE.MathUtils.lerp(target[0], chaos[0], easedChaos);
    const y = THREE.MathUtils.lerp(target[1], chaos[1], easedChaos);
    const z = THREE.MathUtils.lerp(target[2], chaos[2], easedChaos);
    
    ref.current.position.set(x, y, z);
    
    if (chaosLevel > 0.1) {
      ref.current.rotation.x += 0.05 * chaosLevel;
      ref.current.rotation.y += 0.05 * chaosLevel;
    } else {
      ref.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        {data.type === 'ball' ? (
          <sphereGeometry args={[data.scale, 32, 32]} />
        ) : (
          <boxGeometry args={[data.scale, data.scale, data.scale]} />
        )}
        <meshStandardMaterial 
          color={data.color} 
          roughness={0.2} 
          metalness={1}
          emissive={data.color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

interface PolaroidGalleryProps {
    chaosLevel: number;
    userImages: string[];
    isHighlighting: boolean;
}

const PolaroidGallery: React.FC<PolaroidGalleryProps> = ({ chaosLevel, userImages, isHighlighting }) => {
  const displayImages = userImages.length > 0 ? userImages : PLACEHOLDER_IMAGES;
  const [highlightId, setHighlightId] = useState<number>(-1);
  const max = CONFIG.PHOTO_COUNT;

  // Manage Highlight Logic
  useEffect(() => {
    // Only allow highlighting if tree is somewhat unleashed
    if (isHighlighting && chaosLevel > 0.2) {
        // RISING EDGE: Generate a NEW unique ID only when gesture starts
        setHighlightId(prev => {
           // If we already have a valid ID, keep it (Logic: Hold single photo)
           if (prev !== -1) return prev;

           // Otherwise, pick a new random one
           return Math.floor(Math.random() * max);
        });
    } else {
        // FALLING EDGE: Reset ID when gesture stops
        setHighlightId(-1);
    }
  }, [isHighlighting, chaosLevel, max]);

  const photos = useMemo(() => {
    return new Array(CONFIG.PHOTO_COUNT).fill(0).map((_, i) => {
        const yPerc = 0.1 + (Math.random() * 0.8);
        const target = treeConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS * 1.3, yPerc);
        const chaos = randomSpherePoint(CONFIG.CHAOS_RADIUS * 0.9);
        return {
            id: i,
            target,
            chaos,
        }
    })
  }, []);

  return (
      <group>
          {photos.map((p, i) => (
              <MovingPhoto 
                key={i} 
                data={p} 
                chaosLevel={chaosLevel} 
                url={displayImages[i % displayImages.length]}
                isHighlighted={i === highlightId}
              />
          ))}
      </group>
  )
}

const MovingPhoto: React.FC<{data: any, chaosLevel: number, url: string, isHighlighted: boolean}> = ({data, chaosLevel, url, isHighlighted}) => {
    const ref = useRef<THREE.Group>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if(!ref.current) return;
        
        // Calculate Target Position & Rotation based on State
        let tx, ty, tz, tScale;
        
        if (isHighlighted && chaosLevel > 0.5) {
            // --- Highlighted Mode: Center of Screen ---
            const camera = state.camera;
            
            // Point in front of camera (World Space)
            // Increased distance slightly to prevent clipping near plane
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const targetWorld = camera.position.clone().add(forward.multiplyScalar(5)); 
            
            // Convert to Local Space (Tree Group is at [0, 1.5, 0])
            tx = targetWorld.x;
            ty = targetWorld.y - 1.5;
            tz = targetWorld.z;
            tScale = 0.8;
            
            // Target Rotation: Look at Camera
            dummy.position.set(tx, ty, tz);
            dummy.lookAt(camera.position);
            
        } else {
            // --- Normal Mode: Tree/Chaos Lerp ---
            const easedChaos = THREE.MathUtils.smoothstep(chaosLevel, 0, 1);
            tx = THREE.MathUtils.lerp(data.target[0], data.chaos[0], easedChaos);
            ty = THREE.MathUtils.lerp(data.target[1], data.chaos[1], easedChaos);
            tz = THREE.MathUtils.lerp(data.target[2], data.chaos[2], easedChaos);
            
            tScale = chaosLevel > 0.5 ? 1.5 : 0; // Hide when formed (scale 0)

            // Target Rotation: Look at default center
            dummy.position.set(tx, ty, tz);
            dummy.lookAt(0, 4, 20); 
        }

        // --- Smooth Interpolation ---
        // Slower position lerp for weight, faster rotation slerp for responsiveness
        ref.current.position.lerp(new THREE.Vector3(tx, ty, tz), 0.08);
        
        // Scale
        ref.current.scale.lerp(new THREE.Vector3(tScale, tScale, tScale), 0.1);
        
        // Rotation (SLERP is key for avoiding flipping/flying)
        ref.current.quaternion.slerp(dummy.quaternion, 0.08);
    })

    return (
        <group ref={ref}>
            <Image url={url} scale={[1, 1.2]} transparent opacity={isHighlighted ? 1 : 0.9} />
            <mesh position={[0,0,-0.01]}>
                <planeGeometry args={[1.1, 1.35]} />
                <meshBasicMaterial color="#F7E7CE" />
            </mesh>
        </group>
    )
}

export const ChristmasTree: React.FC<{ chaosLevel: number, userImages?: string[], isHighlighting?: boolean }> = ({ chaosLevel, userImages = [], isHighlighting = false }) => {
  return (
    // Raised position so bottom of tree is visible
    <group position={[0, 1.5, 0]}>
      
      {/* Glittering particles everywhere */}
      <Sparkles 
        count={300} 
        scale={16} 
        size={5} 
        speed={0.4} 
        opacity={1} 
        color={COLORS.CHAMPAGNE} 
      />
      <Sparkles 
        count={200} 
        scale={25} 
        size={8} 
        speed={0.2} 
        opacity={0.5} 
        color={COLORS.GOLD} 
      />

      {/* Central Light Column */}
      <pointLight position={[0, 5, 0]} intensity={3} color={COLORS.GOLD} distance={15} decay={2} />
      
      <Foliage chaosLevel={chaosLevel} />
      <Ornaments chaosLevel={chaosLevel} />
      <PolaroidGallery chaosLevel={chaosLevel} userImages={userImages} isHighlighting={isHighlighting} />
      
      <StarTopper />
    </group>
  );
};
