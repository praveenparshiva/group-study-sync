import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

interface SolarSystemProps {
  rotationSpeed?: number;
  autoRotate?: boolean;
}

// Individual Planet Component
function Planet({ 
  position, 
  size, 
  color, 
  name 
}: { 
  position: [number, number, number]; 
  size: number; 
  color: [number, number, number]; 
  name: string; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size * 0.5, 16, 16]} />
      <meshPhongMaterial color={new THREE.Color(color[0], color[1], color[2])} />
    </mesh>
  );
}

// Sun Component
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.003;
    }
  });
  
  return (
    <group>
      {/* Sun core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#ffdd44" />
      </mesh>
      
      {/* Sun glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.5, 16, 16]} />
        <meshBasicMaterial 
          color="#ffaa22" 
          transparent={true} 
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

export function SolarSystem({ rotationSpeed = 1, autoRotate = true }: SolarSystemProps) {
  const systemRef = useRef<THREE.Group>(null);
  const planetsGroupRef = useRef<THREE.Group>(null);
  const asteroidBeltRef = useRef<THREE.Points>(null);
  
  // Planet data with realistic relative sizes and orbital distances
  const planetData = [
    { name: 'Mercury', distance: 8, size: 0.8, color: [0.7, 0.7, 0.7] as [number, number, number], speed: 4.15 },
    { name: 'Venus', distance: 12, size: 1.2, color: [1.0, 0.8, 0.4] as [number, number, number], speed: 1.62 },
    { name: 'Earth', distance: 16, size: 1.3, color: [0.2, 0.6, 1.0] as [number, number, number], speed: 1.0 },
    { name: 'Mars', distance: 22, size: 1.0, color: [1.0, 0.4, 0.2] as [number, number, number], speed: 0.53 },
    { name: 'Jupiter', distance: 35, size: 4.0, color: [0.9, 0.7, 0.5] as [number, number, number], speed: 0.08 },
    { name: 'Saturn', distance: 50, size: 3.5, color: [0.9, 0.8, 0.6] as [number, number, number], speed: 0.03 },
    { name: 'Uranus', distance: 65, size: 2.2, color: [0.4, 0.9, 0.9] as [number, number, number], speed: 0.01 },
    { name: 'Neptune', distance: 80, size: 2.1, color: [0.2, 0.4, 1.0] as [number, number, number], speed: 0.006 }
  ];
  
  // Asteroid belt between Mars and Jupiter
  const asteroidGeometry = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random position in asteroid belt
      const distance = 27 + Math.random() * 6; // Between Mars and Jupiter
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2;
      
      positions[i3] = Math.cos(angle) * distance;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * distance;
      
      // Grayish rocky colors
      colors[i3] = 0.4 + Math.random() * 0.3;
      colors[i3 + 1] = 0.3 + Math.random() * 0.3;
      colors[i3 + 2] = 0.2 + Math.random() * 0.3;
      
      sizes[i] = 0.05 + Math.random() * 0.15;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  // Background stars
  const starsGeometry = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random positions far away
      const radius = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      colors[i3] = 0.8 + Math.random() * 0.2;
      colors[i3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i3 + 2] = 0.8 + Math.random() * 0.2;
      sizes[i] = 0.3 + Math.random() * 0.5;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  useFrame((state) => {
    if (systemRef.current && autoRotate) {
      const time = state.clock.getElapsedTime() * rotationSpeed * 0.1;
      
      // Update planet positions
      if (planetsGroupRef.current) {
        planetsGroupRef.current.children.forEach((planetMesh, index) => {
          if (index < planetData.length) {
            const planet = planetData[index];
            const angle = time * planet.speed;
            planetMesh.position.set(
              Math.cos(angle) * planet.distance,
              Math.sin(angle * 0.1) * 0.5, // Slight vertical oscillation
              Math.sin(angle) * planet.distance
            );
          }
        });
      }
      
      // Rotate asteroid belt slowly
      if (asteroidBeltRef.current) {
        asteroidBeltRef.current.rotation.y = time * 0.02;
      }
    }
  });
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.001,
  });
  
  return (
    <group ref={systemRef}>
      {/* Sun */}
      <Sun />
      
      {/* Planets */}
      <group ref={planetsGroupRef}>
        {planetData.map((planet, index) => (
          <Planet
            key={planet.name}
            position={[planet.distance, 0, 0]}
            size={planet.size}
            color={planet.color}
            name={planet.name}
          />
        ))}
      </group>
      
      {/* Asteroid belt */}
      <points ref={asteroidBeltRef} geometry={asteroidGeometry} material={particleMaterial} />
      
      {/* Background stars */}
      <points geometry={starsGeometry} material={particleMaterial.clone()} />
      
      {/* Orbital paths (visual guides) */}
      {planetData.map((planet) => (
        <mesh key={`orbit-${planet.name}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.distance - 0.1, planet.distance + 0.1, 64]} />
          <meshBasicMaterial color="#333333" transparent={true} opacity={0.1} />
        </mesh>
      ))}
    </group>
  );
}