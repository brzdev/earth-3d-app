import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Constants for reusable values
const SUN_RADIUS = 5;
const PLANET_RADIUS_MULTIPLIER = 0.1;
const ORBIT_SEGMENTS = 100;
const CAMERA_ANGLE = 20 * (Math.PI / 180); // 20 degrees in radians
const CAMERA_DISTANCE_MULTIPLIER = 10;

// Planet component
function Planet({ texture, radius, distance, speed, onClick }: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const planetTexture = useTexture(texture);

  useFrame(({ clock }) => {
    if (planetRef.current) {
      const time = clock.getElapsedTime();
      planetRef.current.position.x = Math.cos(time * speed) * distance;
      planetRef.current.position.z = Math.sin(time * speed) * distance;
      planetRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  return (
    <mesh ref={planetRef} onClick={onClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial map={planetTexture} metalness={0.1} roughness={0.5} />
    </mesh>
  );
}

// Sun component
function Sun({ texture, radius, onClick }: SunProps) {
  const sunTexture = useTexture(texture);

  return (
    <mesh onClick={onClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial map={sunTexture} toneMapped={false} />
    </mesh>
  );
}

// Orbit path component
function OrbitPath({ distance }: OrbitPathProps) {
  const points = [];
  for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
    const angle = (i / ORBIT_SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

  return <line geometry={geometry} material={material} />;
}

// Camera controller component
function CameraController({ targetPlanetName, planets }: { targetPlanetName: string; planets: Record<string, PlanetData> }) {
  const controlsRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const targetPosition = useRef(new THREE.Vector3());
  const targetTarget = useRef(new THREE.Vector3());

  // Reset animation state when the target planet changes
  const prevTargetPlanetName = useRef<string | null>(null);
  if (targetPlanetName !== prevTargetPlanetName.current) {
    setIsAnimating(true);
    prevTargetPlanetName.current = targetPlanetName;
  }

  useFrame(({ clock, camera }) => {
    if (targetPlanetName && controlsRef.current) {
      const planet = planets[targetPlanetName];
      if (!planet) return;

      const time = clock.getElapsedTime();
      const planetPosition = new THREE.Vector3(
        Math.cos(time * planet.speed) * planet.distance,
        0,
        Math.sin(time * planet.speed) * planet.distance
      );

      if (isAnimating) {
        const targetDistance = planet.radius * CAMERA_DISTANCE_MULTIPLIER;
        const yOffset = Math.tan(CAMERA_ANGLE) * targetDistance;

        const desiredCameraPosition = new THREE.Vector3(
          planetPosition.x,
          planetPosition.y + yOffset,
          planetPosition.z + targetDistance
        );

        targetPosition.current.lerp(desiredCameraPosition, 0.05);
        camera.position.lerp(targetPosition.current, 0.1);

        targetTarget.current.lerp(planetPosition, 0.1);
        controlsRef.current.target.lerp(targetTarget.current, 0.1);

        if (camera.position.distanceTo(desiredCameraPosition) < 1) {
          setIsAnimating(false);
        }
      } else {
        controlsRef.current.target.lerp(planetPosition, 0.1);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={500}
    />
  );
}

// Solar system component
export default function SolarSystem() {
  const textures = {
    sun: '/textures/sun.jpg',
    mercury: '/textures/mercury.jpg',
    venus: '/textures/venus.jpg',
    earth: '/textures/earth.jpg',
    mars: '/textures/mars.jpg',
    jupiter: '/textures/jupiter.jpg',
    saturn: '/textures/saturn.jpg',
    uranus: '/textures/uranus.jpg',
    neptune: '/textures/neptune.jpg',
  };

  const planets = {
    sun: { radius: SUN_RADIUS, distance: 0, speed: 0 },
    mercury: { radius: 0.5, distance: 10, speed: 0.0479 },
    venus: { radius: 0.8, distance: 15, speed: 0.035 },
    earth: { radius: 1, distance: 20, speed: 0.03 },
    mars: { radius: 0.7, distance: 25, speed: 0.0241 },
    jupiter: { radius: 3, distance: 40, speed: 0.0131 },
    saturn: { radius: 2.5, distance: 60, speed: 0.0097 },
    uranus: { radius: 2, distance: 80, speed: 0.0068 },
    neptune: { radius: 1.8, distance: 100, speed: 0.0054 },
  };

  const [targetPlanetName, setTargetPlanetName] = useState<string | null>(null);

  const handlePlanetClick = (name: string) => {
    setTargetPlanetName(name);
  };

  return (
    <Canvas style={{ background: '#000000' }} camera={{ position: [0, 50, 150], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[0, 0, 10]} intensity={1.5} color="#ffffff" castShadow />

      {/* Sun */}
      <Sun texture={textures.sun} radius={planets.sun.radius} onClick={() => handlePlanetClick('sun')} />

      {/* Planets and Orbit Paths */}
      {Object.entries(planets).map(([name, { radius, distance, speed }]) => (
        <React.Fragment key={name}>
          {name !== 'sun' && <OrbitPath distance={distance} />}
          <Planet
            texture={textures[name]}
            radius={radius}
            distance={distance}
            speed={speed}
            onClick={() => handlePlanetClick(name)}
          />
        </React.Fragment>
      ))}

      {/* Camera Controller */}
      {targetPlanetName && <CameraController targetPlanetName={targetPlanetName} planets={planets} />}

      {/* Stars */}
      <Stars radius={200} depth={100} count={10000} factor={6} saturation={0} fade />
    </Canvas>
  );
}

// Type definitions
interface PlanetProps {
  texture: string;
  radius: number;
  distance: number;
  speed: number;
  onClick: () => void;
}

interface SunProps {
  texture: string;
  radius: number;
  onClick: () => void;
}

interface OrbitPathProps {
  distance: number;
}

interface PlanetData {
  radius: number;
  distance: number;
  speed: number;
}