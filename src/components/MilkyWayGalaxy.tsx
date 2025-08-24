import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

interface GalaxyProps {
  rotationSpeed?: number;
  autoRotate?: boolean;
}

export function MilkyWayGalaxy({ rotationSpeed = 1, autoRotate = true }: GalaxyProps) {
  const galaxyRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Points>(null);
  const bulgeRef = useRef<THREE.Points>(null);
  const barRef = useRef<THREE.Points>(null);
  
  // Milky Way disk particles (4 spiral arms)
  const diskGeometry = useMemo(() => {
    const count = 80000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // 4-armed spiral galaxy parameters
    const diskRadius = 35;
    const armCount = 4; // Major arms: Perseus, Scutum-Centaurus, Sagittarius, Outer
    const pitchAngle = 0.22;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Exponential disk profile with more stars in arms
      const radius = Math.random() * Math.random() * diskRadius;
      
      // 4 spiral arms evenly distributed
      const armIndex = Math.floor(Math.random() * armCount);
      const baseAngle = (armIndex / armCount) * Math.PI * 2;
      
      // Logarithmic spiral for each arm
      const theta = radius * pitchAngle + baseAngle;
      
      // Enhanced arm structure with varying widths
      const armWidth = 2 + Math.sin(radius * 0.1) * 0.5;
      const armOffset = (Math.random() - 0.5) * armWidth;
      
      // Some inter-arm stars
      const interArmProbability = Math.random() > 0.75 ? Math.random() * Math.PI * 0.5 : 0;
      
      const x = Math.cos(theta + interArmProbability) * radius + armOffset * Math.cos(theta + Math.PI/2);
      const z = Math.sin(theta + interArmProbability) * radius + armOffset * Math.sin(theta + Math.PI/2);
      
      // Variable disk thickness
      const scaleHeight = Math.max(0.2, 1.5 * Math.exp(-radius / 10));
      const y = (Math.random() - 0.5) * scaleHeight * 2;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Enhanced star formation in spiral arms
      const distanceFromArm = Math.abs(armOffset);
      const inArm = distanceFromArm < armWidth * 0.6;
      
      if (inArm && Math.random() > 0.5) {
        // Young blue/white stars in spiral arms
        if (Math.random() > 0.7) {
          // Hot blue stars
          colors[i3] = 0.6 + Math.random() * 0.4;
          colors[i3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i3 + 2] = 1.0;
          sizes[i] = 1.0 + Math.random() * 0.8;
        } else {
          // White main sequence
          colors[i3] = 1.0;
          colors[i3 + 1] = 1.0;
          colors[i3 + 2] = 0.9 + Math.random() * 0.1;
          sizes[i] = 0.7 + Math.random() * 0.5;
        }
      } else {
        // Older population stars between arms
        const age = Math.random();
        if (age > 0.6) {
          // Red giants and older stars
          colors[i3] = 1.0;
          colors[i3 + 1] = 0.3 + Math.random() * 0.4;
          colors[i3 + 2] = 0.1 + Math.random() * 0.3;
          sizes[i] = 0.4 + Math.random() * 0.4;
        } else {
          // Yellow main sequence
          colors[i3] = 1.0;
          colors[i3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i3 + 2] = 0.5 + Math.random() * 0.3;
          sizes[i] = 0.3 + Math.random() * 0.3;
        }
      }
      
      // Distance-based dimming
      if (radius > diskRadius * 0.7) {
        const dimFactor = Math.max(0.3, 1 - (radius - diskRadius * 0.7) / (diskRadius * 0.3));
        colors[i3] *= dimFactor;
        colors[i3 + 1] *= dimFactor;
        colors[i3 + 2] *= dimFactor;
        sizes[i] *= dimFactor;
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  // Central bulge
  const bulgeGeometry = useMemo(() => {
    const count = 30000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // More realistic bulge distribution
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      
      const theta = Math.acos(costheta);
      const r = 7 * Math.pow(u, 1/2.5);
      
      // Triaxial bulge shape
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi) * 0.7;
      const z = r * Math.cos(theta) * 0.9;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Old, metal-rich population with variety
      if (Math.random() > 0.8) {
        // Red giants
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.4 + Math.random() * 0.2;
        colors[i3 + 2] = 0.2 + Math.random() * 0.2;
        sizes[i] = 0.8 + Math.random() * 0.6;
      } else {
        // K-type stars
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i3 + 2] = 0.3 + Math.random() * 0.2;
        sizes[i] = 0.5 + Math.random() * 0.4;
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  // Central bar
  const barGeometry = useMemo(() => {
    const count = 20000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const barLength = 10;
    const barWidth = 3;
    const barAngle = 0.44;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // More realistic bar distribution
      const t = (Math.random() - 0.5) * barLength * Math.pow(Math.random(), 0.3);
      const w = (Math.random() - 0.5) * barWidth * Math.pow(Math.random(), 0.5);
      const h = (Math.random() - 0.5) * 1.5;
      
      const x = t * Math.cos(barAngle) - w * Math.sin(barAngle);
      const z = t * Math.sin(barAngle) + w * Math.cos(barAngle);
      
      positions[i3] = x;
      positions[i3 + 1] = h;
      positions[i3 + 2] = z;
      
      // Bar population stars
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.7 + Math.random() * 0.2;
      colors[i3 + 2] = 0.4 + Math.random() * 0.3;
      
      sizes[i] = 0.6 + Math.random() * 0.4;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  useFrame(() => {
    if (galaxyRef.current && autoRotate) {
      galaxyRef.current.rotation.y += rotationSpeed * 0.01;
    }
  });
  
  const material = new THREE.PointsMaterial({
    size: 0.04,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.001,
    blending: THREE.AdditiveBlending,
  });
  
  return (
    <group ref={galaxyRef}>
      {/* Galactic disk with 4 spiral arms */}
      <points ref={diskRef} geometry={diskGeometry} material={material} />
      
      {/* Central bulge */}
      <points ref={bulgeRef} geometry={bulgeGeometry} material={material.clone()} />
      
      {/* Central bar structure */}
      <points ref={barRef} geometry={barGeometry} material={material.clone()} />
    </group>
  );
}

export function GalacticCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  
  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[0.4, 20, 20]} />
      <meshBasicMaterial 
        color="#ffeeaa"
        transparent={true}
        opacity={0.95}
      />
    </mesh>
  );
}