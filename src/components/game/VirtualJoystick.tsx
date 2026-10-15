import React, { useRef, useEffect, useState } from 'react';

interface Props {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<Props> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard controls listener (WASD & Arrow keys)
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      updateFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      updateFromKeys();
    };

    const updateFromKeys = () => {
      let kx = 0;
      let ky = 0;
      if (keys['w'] || keys['arrowup']) ky -= 1;
      if (keys['s'] || keys['arrowdown']) ky += 1;
      if (keys['a'] || keys['arrowleft']) kx -= 1;
      if (keys['d'] || keys['arrowright']) kx += 1;

      if (kx !== 0 || ky !== 0) {
        const mag = Math.hypot(kx, ky);
        onMove(kx / mag, ky / mag);
      } else if (!isDragging) {
        onMove(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, isDragging]);

  const handleTouch = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * (clampedDist / maxRadius);
    const ny = Math.sin(angle) * (clampedDist / maxRadius);

    setKnobPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    onMove(nx, ny);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleTouch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleTouch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-28 h-28 rounded-full bg-black/40 border-2 border-cyan-500/30 backdrop-blur-md flex items-center justify-center touch-none select-none active:border-cyan-400"
    >
      {/* Outer directional ticks */}
      <div className="absolute w-1.5 h-1.5 bg-cyan-500/40 rounded-full top-2" />
      <div className="absolute w-1.5 h-1.5 bg-cyan-500/40 rounded-full bottom-2" />
      <div className="absolute w-1.5 h-1.5 bg-cyan-500/40 rounded-full left-2" />
      <div className="absolute w-1.5 h-1.5 bg-cyan-500/40 rounded-full right-2" />

      {/* Floating Center Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/50 border border-white/40 pointer-events-none transition-transform duration-75"
      />
    </div>
  );
};
