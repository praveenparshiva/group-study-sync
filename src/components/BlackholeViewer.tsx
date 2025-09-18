import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Ring, Stars } from '@react-three/drei';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BlackholeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Black Hole Component with gravitational lensing effect
function BlackHole() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  // Custom shader material for the black hole
  const blackHoleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          // Create event horizon effect
          float horizon = 0.3;
          float glow = 0.6;
          
          if (dist < horizon) {
            // Pure black inside event horizon
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          } else if (dist < glow) {
            // Glowing accretion disk
            float intensity = (glow - dist) / (glow - horizon);
            vec3 color = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 1.0, 0.8), intensity);
            gl_FragColor = vec4(color * intensity, 1.0);
          } else {
            // Fade to transparent
            float fade = max(0.0, 1.0 - (dist - glow) * 2.0);
            gl_FragColor = vec4(0.1, 0.05, 0.2, fade * 0.3);
          }
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  useFrame((state) => {
    if (blackHoleMaterial) {
      blackHoleMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} material={blackHoleMaterial}>
      <sphereGeometry args={[2, 64, 64]} />
    </mesh>
  );
}

// Accretion Disk Component
function AccretionDisk() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  const diskMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          
          // Create spiral pattern
          float spiral = sin(angle * 3.0 + dist * 10.0 - time * 2.0) * 0.5 + 0.5;
          float intensity = spiral * (1.0 - smoothstep(0.3, 0.8, dist));
          
          // Color gradient from orange to white
          vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.8, 0.6), intensity);
          
          gl_FragColor = vec4(color, intensity * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  useFrame((state) => {
    if (diskMaterial) {
      diskMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} material={diskMaterial}>
      <ringGeometry args={[3, 8, 64]} />
    </mesh>
  );
}

// Particle System for glowing accretion particles
function AccretionParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.5;
      
      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.2;
      particlesRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={particleCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ff6600"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Gravitational Lensing Effect
function LensingRings() {
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.x += delta * 0.05;
      ringsRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={ringsRef}>
      {[0, 1, 2].map((index) => (
        <Ring
          key={index}
          args={[5 + index * 2, 5.2 + index * 2, 64]}
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="#4444ff"
            transparent
            opacity={0.1 - index * 0.02}
            side={THREE.DoubleSide}
          />
        </Ring>
      ))}
    </group>
  );
}

export function BlackholeViewer({ open, onOpenChange }: BlackholeViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black">
        <div className="relative w-full h-full">
          {/* Header */}
          <DialogHeader className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <DialogTitle className="text-xl font-bold text-white">Black Hole Explorer</DialogTitle>
            <DialogDescription className="text-sm text-gray-300">
              Interactive 3D black hole with gravitational lensing • Drag to rotate • Scroll to zoom
            </DialogDescription>
          </DialogHeader>
          
          {/* Close button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* 3D Canvas */}
          <div className="w-full h-full">
            <Canvas 
              camera={{ position: [0, 15, 25], fov: 60 }}
              gl={{ antialias: true, alpha: true }}
            >
              <color attach="background" args={['#000000']} />
              <fog attach="fog" args={['#000000', 50, 200]} />
              
              {/* Lighting */}
              <ambientLight intensity={0.02} color="#ffffff" />
              <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff6600" />
              <pointLight position={[-10, -10, -10]} intensity={0.3} color="#0066ff" />
              
              {/* Black Hole Components */}
              <BlackHole />
              <AccretionDisk />
              <AccretionParticles />
              <LensingRings />
              
              {/* Starfield Background */}
              <Stars 
                radius={300} 
                depth={50} 
                count={5000} 
                factor={4} 
                saturation={0} 
                fade 
              />
              
              {/* Camera Controls */}
              <OrbitControls 
                enableDamping 
                dampingFactor={0.05}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minDistance={8}
                maxDistance={100}
                autoRotate={false}
                autoRotateSpeed={0.5}
              />
            </Canvas>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}