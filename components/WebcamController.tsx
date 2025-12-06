
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

interface WebcamControllerProps {
  onUpdate: (chaos: number, azimuth: number) => void;
  onHighlight: (isActive: boolean) => void;
  isActive: boolean;
}

export const WebcamController: React.FC<WebcamControllerProps> = ({ onUpdate, onHighlight, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(null);
  const [gestureState, setGestureState] = useState<string>("NONE");
  
  // Smoothing
  const smoothValues = useRef({ chaos: 0, azimuth: 0 });
  
  // State tracking to prevent duplicate events
  const lastHighlightState = useRef<boolean>(false);
  
  // Sticky State for robustness
  const stickyState = useRef({
    gesture: "NONE",
    lastSeen: 0,
    targetChaos: 0
  });

  // Initialize MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
      }
    };
    initMediaPipe();
  }, []);

  // Initialize Camera
  useEffect(() => {
    if (!isActive) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    const startCamera = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 30 }
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isActive]);

  // Detection Loop
  useEffect(() => {
    if (!isActive || !isModelLoaded || !videoRef.current) return;

    const predict = () => {
      if (videoRef.current && videoRef.current.currentTime > 0 && handLandmarkerRef.current) {
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        
        let targetChaos = 0;
        let targetAzimuth = smoothValues.current.azimuth;
        let detectedGesture = "NONE";
        let hasHand = false;

        if (results.landmarks.length > 0) {
          hasHand = true;
          const landmarks = results.landmarks[0];
          
          // 1. Calculate Azimuth (Hand X position)
          const handX = landmarks[0].x; 
          targetAzimuth = (handX - 0.5) * 2; // -1 to 1

          // 2. Gesture Recognition
          const wrist = landmarks[0];
          
          // Distance from Wrist to Tips vs Wrist to PIP
          const isExtended = (tip: number, pip: number) => {
             const dTip = Math.sqrt(Math.pow(landmarks[tip].x - wrist.x, 2) + Math.pow(landmarks[tip].y - wrist.y, 2));
             const dPip = Math.sqrt(Math.pow(landmarks[pip].x - wrist.x, 2) + Math.pow(landmarks[pip].y - wrist.y, 2));
             return dTip > dPip * 1.1; 
          };

          const indexExt = isExtended(8, 5);
          const middleExt = isExtended(12, 9);
          const ringExt = isExtended(16, 13);
          const pinkyExt = isExtended(20, 17);

          const dist = (i1: number, i2: number) => {
             const dx = landmarks[i1].x - landmarks[i2].x;
             const dy = landmarks[i1].y - landmarks[i2].y;
             return Math.sqrt(dx*dx + dy*dy);
          };
          
          const thumbIndexDist = dist(4, 8);
          
          // OK Gesture: Index and Thumb close, other fingers extended
          const isOK = thumbIndexDist < 0.08 && middleExt;
          const isOpenHand = indexExt && middleExt && ringExt && pinkyExt && !isOK;
          const isFist = !indexExt && !middleExt && !ringExt && !pinkyExt;

          if (isOK) {
             detectedGesture = "OK";
          } else if (isOpenHand) {
             detectedGesture = "OPEN";
          } else if (isFist) {
             detectedGesture = "FIST";
          } else {
             detectedGesture = "TRANSITION";
          }
        } else {
             detectedGesture = "NONE";
        }

        const now = Date.now();

        // "Sticky" Logic: Hold the last valid gesture for a grace period (300ms)
        if (detectedGesture !== "NONE" && detectedGesture !== "TRANSITION") {
            stickyState.current.gesture = detectedGesture;
            stickyState.current.lastSeen = now;
        } else if (now - stickyState.current.lastSeen > 300) {
            stickyState.current.gesture = "NONE";
        }

        // Determine Final State based on Sticky Gesture
        let displayString = "Tracking...";
        const finalGesture = stickyState.current.gesture;
        let isHighlighting = false;

        if (finalGesture === "OK") {
            targetChaos = 1; // Keep unleashed
            displayString = "OK - HOLD MEMORY";
            isHighlighting = true;
        } else if (finalGesture === "OPEN") {
            targetChaos = 1;
            displayString = "OPEN - UNLEASH";
            isHighlighting = false;
        } else if (finalGesture === "FIST") {
            targetChaos = 0;
            displayString = "FIST - FORM";
            isHighlighting = false;
        } else {
             // Default: If previously unleashed, slowly form? Or stay? 
             // Let's default to Formed if no hand, but slow decay logic is in lerp below
             targetChaos = smoothValues.current.chaos > 0.5 ? 0 : 0;
             displayString = hasHand ? "..." : "No Hand";
             isHighlighting = false;
        }

        setGestureState(displayString);

        // Notify parent of Highlight State changes only
        if (isHighlighting !== lastHighlightState.current) {
            onHighlight(isHighlighting);
            lastHighlightState.current = isHighlighting;
        }

        // Smoothing
        // Use a very low factor (0.05) for chaos to make it heavy and stable
        smoothValues.current.chaos = THREE.MathUtils.lerp(smoothValues.current.chaos, targetChaos, 0.05);
        
        // Azimuth can be slightly faster
        if (hasHand) {
            smoothValues.current.azimuth = THREE.MathUtils.lerp(smoothValues.current.azimuth, -targetAzimuth, 0.1);
        }

        onUpdate(smoothValues.current.chaos, smoothValues.current.azimuth);
      }
      requestRef.current = requestAnimationFrame(predict);
    };

    requestRef.current = requestAnimationFrame(predict);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, isModelLoaded, onUpdate, onHighlight]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-90 flex flex-col items-center gap-2">
      <div className="border-2 border-[#D4AF37] rounded overflow-hidden shadow-[0_0_20px_#D4AF37] bg-black relative">
        <video ref={videoRef} autoPlay playsInline muted className="w-40 h-32 object-cover transform scale-x-[-1]" />
        {!isModelLoaded && <div className="absolute inset-0 flex items-center justify-center text-[#D4AF37] text-xs">Loading AI...</div>}
      </div>
      <div className="bg-black/80 px-3 py-1 text-[#D4AF37] text-[10px] font-mono border border-[#D4AF37] rounded text-center min-w-[150px]">
        {isModelLoaded ? gestureState : "LOADING..."}
      </div>
    </div>
  );
};
