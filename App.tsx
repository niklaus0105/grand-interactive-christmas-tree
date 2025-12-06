
import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { WebcamController } from './components/WebcamController';
import * as THREE from 'three';

const App: React.FC = () => {
  const [chaosLevel, setChaosLevel] = useState(0); // 0 (Tree) -> 1 (Chaos)
  const [cameraAzimuth, setCameraAzimuth] = useState(0);
  const [mode, setMode] = useState<'mouse' | 'webcam'>('mouse');
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  
  const [visualChaos, setVisualChaos] = useState(0);

  // --- Handlers ---

  const handleWebcamUpdate = useCallback((targetChaos: number, targetAzimuth: number) => {
    setChaosLevel(targetChaos);
    setCameraAzimuth(prev => THREE.MathUtils.lerp(prev, targetAzimuth, 0.2));
  }, []);

  const handleHighlightState = useCallback((active: boolean) => {
      setIsHighlighting(active);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'webcam') return;
    const width = window.innerWidth;
    const x = (e.clientX / width) * 2 - 1; // -1 to 1
    setCameraAzimuth(x);
  };

  const handleMouseDown = () => {
    if (mode === 'mouse') setChaosLevel(1);
  };

  const handleMouseUp = () => {
    if (mode === 'mouse') setChaosLevel(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setCustomImages(prev => [...prev, ...newImages]);
    }
  };

  // Animation Loop for Smoothing Visual State
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      setVisualChaos(prev => THREE.MathUtils.lerp(prev, chaosLevel, 0.05));
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [chaosLevel]);

  return (
    <div 
      className="w-full h-screen relative overflow-hidden cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene 
            chaosLevel={visualChaos} 
            cameraAzimuth={cameraAzimuth} 
            userImages={customImages} 
            isHighlighting={isHighlighting}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center p-8">
        
        {/* Header - Minimalist */}
        <div className="pointer-events-auto flex flex-col items-center mt-4">
            <h1 className="text-4xl md:text-6xl text-[#D4AF37] font-display drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest text-center">
              MERRY CHRISTMAS
            </h1>
            
            {/* Upload Button - Small, Below Title */}
            <label className="mt-4 cursor-pointer group">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
              <div className="px-4 py-1 border border-[#D4AF37] bg-black/40 hover:bg-[#D4AF37]/20 transition-all">
                  <span className="text-[#D4AF37] text-xs font-display tracking-widest uppercase group-hover:text-[#FFFDD0]">
                    Upload Memories
                  </span>
              </div>
            </label>
            {customImages.length > 0 && (
              <p className="text-[#FFDF70] text-[10px] mt-1 uppercase tracking-widest opacity-70">
                {customImages.length} Photos Active
              </p>
            )}
        </div>

        {/* Center Prompt */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-50 mix-blend-screen">
             {mode === 'mouse' ? (
                 <p className="text-[#D4AF37] text-lg font-display tracking-widest animate-pulse">
                     CLICK & HOLD TO UNLEASH
                 </p>
             ) : (
                 <p className="text-[#D4AF37] text-lg font-display tracking-widest animate-pulse">
                     OPEN HAND TO UNLEASH
                 </p>
             )}
        </div>

        {/* Mode Toggle - Bottom Left */}
        <div className="absolute bottom-8 left-8 pointer-events-auto flex gap-2">
            <button 
              onClick={() => setMode('mouse')}
              className={`px-3 py-1 border border-[#D4AF37] text-[10px] uppercase tracking-widest transition-all ${mode === 'mouse' ? 'bg-[#D4AF37] text-black font-bold' : 'text-[#D4AF37] bg-black/50 hover:bg-[#D4AF37]/20'}`}
            >
              Mouse
            </button>
            <button 
              onClick={() => setMode('webcam')}
              className={`px-3 py-1 border border-[#D4AF37] text-[10px] uppercase tracking-widest transition-all ${mode === 'webcam' ? 'bg-[#D4AF37] text-black font-bold' : 'text-[#D4AF37] bg-black/50 hover:bg-[#D4AF37]/20'}`}
            >
              Gesture
            </button>
        </div>
      </div>

      {/* Controllers */}
      <WebcamController 
        isActive={mode === 'webcam'} 
        onUpdate={handleWebcamUpdate} 
        onHighlight={handleHighlightState}
      />
    </div>
  );
};

export default App;
