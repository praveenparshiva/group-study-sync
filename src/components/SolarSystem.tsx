import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

interface SolarSystemProps {
  rotationSpeed?: number;
  autoRotate?: boolean;
}

export function SolarSystem({ rotationSpeed = 1, autoRotate = true }: SolarSystemProps) {
  const systemRef = useRef<THREE.Group>(null);
  const planetsRef = useRef<THREE.Points>(null);
  const asteroidBeltRef = useRef<THREE.Points>(null);
  
  // Planet data with realistic relative sizes and orbital distances
  const planetData = [
    { name: 'Mercury', distance: 8, size: 0.8, color: [0.7, 0.7, 0.7], speed: 4.15 },
    { name: 'Venus', distance: 12, size: 1.2, color: [1.0, 0.8, 0.4], speed: 1.62 },
    { name: 'Earth', distance: 16, size: 1.3, color: [0.2, 0.6, 1.0], speed: 1.0 },
    { name: 'Mars', distance: 22, size: 1.0, color: [1.0, 0.4, 0.2], speed: 0.53 },
    { name: 'Jupiter', distance: 35, size: 4.0, color: [0.9, 0.7, 0.5], speed: 0.08 },
    { name: 'Saturn', distance: 50, size: 3.5, color: [0.9, 0.8, 0.6], speed: 0.03 },
    { name: 'Uranus', distance: 65, size: 2.2, color: [0.4, 0.9, 0.9], speed: 0.01 },
    { name: 'Neptune', distance: 80, size: 2.1, color: [0.2, 0.4, 1.0], speed: 0.006 }
  ];
  
  // Create solar system geometry
  const solarSystemGeometry = useMemo(() => {
    const totalCount = 2000; // Sun + planets + moons + particles
    const positions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    
    let index = 0;
    
    // Sun at center
    positions[index * 3] = 0;
    positions[index * 3 + 1] = 0;
    positions[index * 3 + 2] = 0;
    colors[index * 3] = 1.0;     // Red
    colors[index * 3 + 1] = 0.8; // Green
    colors[index * 3 + 2] = 0.2; // Blue
    sizes[index] = 6.0;
    index++;
    
    // Planets
    planetData.forEach((planet) => {
      positions[index * 3] = planet.distance;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = 0;
      colors[index * 3] = planet.color[0];
      colors[index * 3 + 1] = planet.color[1];
      colors[index * 3 + 2] = planet.color[2];
      sizes[index] = planet.size;
      index++;
      
      // Add some moons/particles around larger planets
      if (planet.size > 2.0) {
        const moonCount = Math.floor(planet.size);
        for (let m = 0; m < moonCount && index < totalCount; m++) {
          const moonAngle = (m / moonCount) * Math.PI * 2;
          const moonDistance = planet.size * 1.5;
          positions[index * 3] = planet.distance + Math.cos(moonAngle) * moonDistance;
          positions[index * 3 + 1] = Math.sin(moonAngle) * moonDistance * 0.5;
          positions[index * 3 + 2] = Math.sin(moonAngle) * moonDistance;
          colors[index * 3] = 0.8;
          colors[index * 3 + 1] = 0.8;
          colors[index * 3 + 2] = 0.8;
          sizes[index] = 0.3;
          index++;
        }
      }
    });
    
    // Fill remaining with background stars
    while (index < totalCount) {
      const radius = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
      
      colors[index * 3] = 0.8 + Math.random() * 0.2;
      colors[index * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[index * 3 + 2] = 0.8 + Math.random() * 0.2;
      sizes[index] = 0.1 + Math.random() * 0.2;
      index++;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
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
  
  useFrame((state) => {
    if (systemRef.current && autoRotate) {
      const time = state.clock.getElapsedTime() * rotationSpeed * 0.1;
      
      // Update planet positions
      if (planetsRef.current) {
        const positions = planetsRef.current.geometry.attributes.position.array as Float32Array;
        let index = 3; // Skip the sun
        
        planetData.forEach((planet) => {
          const angle = time * planet.speed;
          positions[index * 3] = Math.cos(angle) * planet.distance;
          positions[index * 3 + 1] = Math.sin(angle * 0.1) * 0.5; // Slight vertical oscillation
          positions[index * 3 + 2] = Math.sin(angle) * planet.distance;
          index++;
          
          // Update moons if any
          if (planet.size > 2.0) {
            const moonCount = Math.floor(planet.size);
            for (let m = 0; m < moonCount && index < positions.length / 3; m++) {
              const moonAngle = angle * 3 + (m / moonCount) * Math.PI * 2;
              const moonDistance = planet.size * 1.5;
              positions[index * 3] = Math.cos(angle) * planet.distance + Math.cos(moonAngle) * moonDistance;
              positions[index * 3 + 1] = Math.sin(moonAngle) * moonDistance * 0.5;
              positions[index * 3 + 2] = Math.sin(angle) * planet.distance + Math.sin(moonAngle) * moonDistance;
              index++;
            }
          }
        });
        
        planetsRef.current.geometry.attributes.position.needsUpdate = true;
      }
      
      // Rotate asteroid belt slowly
      if (asteroidBeltRef.current) {
        asteroidBeltRef.current.rotation.y = time * 0.02;
      }
    }
  });
  
  const material = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.001,
    blending: THREE.AdditiveBlending,
  });
  
  return (
    <group ref={systemRef}>
      {/* Planets and sun */}
      <points ref={planetsRef} geometry={solarSystemGeometry} material={material} />
      
      {/* Asteroid belt */}
      <points ref={asteroidBeltRef} geometry={asteroidGeometry} material={material.clone()} />
    </group>
  );
}