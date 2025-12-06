export enum TreeState {
  FORMED = 'FORMED', // The tree is a cone
  CHAOS = 'CHAOS'   // The tree is a scattered sphere
}

export interface TreeParticle {
  id: number;
  // Position when in Tree Form (Cone)
  targetPos: [number, number, number];
  // Position when in Chaos Form (Sphere)
  chaosPos: [number, number, number];
  // Random offsets for animation
  speed: number;
  color: string;
}

export interface ControlState {
  chaosLevel: number; // 0 to 1
  cameraAzimuth: number; // -1 to 1
}

export interface OrnamentData {
  position: [number, number, number];
  scale: number;
  color: string;
  type: 'box' | 'ball' | 'photo';
  imgUrl?: string;
}
