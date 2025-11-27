import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CombatUnit, CombatAction } from '../types';
import { HEROES } from '../constants';

// --- Sub-components for 3D elements ---

interface UnitMeshProps {
  unit: CombatUnit;
  position: [number, number, number];
  isAttacking: boolean;
  isHit: boolean;
  floatingText: string | null;
}

// Arena corner pillar with subtle holographic animation
const ArenaPillar: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Slow rotation for hologram ring
    groupRef.current.rotation.y = t * 0.3;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main pillar */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2.4, 12]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#22d3ee"
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>
      {/* Floating ring */}
      <mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.03, 12, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
      </mesh>
      {/* Ground halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.35, 0.6, 40]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// Load and render player hero model (by heroId)
const HeroModel: React.FC<{ heroId: number }> = ({ heroId }) => {
  const name = HEROES[heroId]?.name ?? 'Unit-00';
  const url = `/models/heroes/${name}.glb`;
  const { scene } = useGLTF(url);

  // Clone scene mỗi instance để tránh re-parenting (một object không thể ở nhiều nơi)
  const cloned = useMemo(() => scene.clone(), [scene]);

  // Giữ nguyên màu và material gốc trong GLB, không chỉnh sửa gì
  return <primitive object={cloned} scale={0.9} position={[0, 0, 0]} />;
};

// Load and render generic encrypted enemy model
const EnemyModel: React.FC = () => {
  const url = '/models/enemy/Enemy-Encrypted.glb';
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={0.9} position={[0, 0, 0]} />;
};

const UnitMesh: React.FC<UnitMeshProps> = ({ 
  unit, 
  position, 
  isAttacking, 
  isHit,
  floatingText 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const color = unit.owner === 0 ? '#4ade80' : '#f87171'; // Green (Self) vs Red (Enemy)
  const baseRotationY = unit.owner === 0 ? Math.PI : 0; // P1 quay mặt vào board, P2 quay ngược lại
  const idlePhase = useRef(Math.random() * Math.PI * 2); // lệch pha idle cho từng unit

  // Animation logic
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Smooth Lerp to target position
    const targetPos = new THREE.Vector3(...position);
    
    // Add "Lunge" effect if attacking
    if (isAttacking) {
        // Lunge forward (Z axis depends on owner)
        const lungeDir = unit.owner === 0 ? -1.5 : 1.5;
        targetPos.z += lungeDir; 
        targetPos.y += 0.5; // Jump a bit
    }

    // Add "Shake" if hit
    if (isHit) {
       targetPos.x += (Math.random() - 0.5) * 0.5;
       targetPos.y += (Math.random() - 0.5) * 0.2;
    }
    
    // Idle "breathing" / hover motion when not attacking or being hit
    const t = state.clock.getElapsedTime() + idlePhase.current;
    if (!isAttacking && !isHit && !unit.isDead) {
      const idleY = Math.sin(t * 2) * 0.08; // nhẹ lên xuống
      targetPos.y += idleY;

      const idleTiltZ = Math.sin(t * 1.5) * 0.06;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        idleTiltZ,
        0.15
      );
    } else {
      // trả về tư thế thẳng khi có action
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        0,
        0.2
      );
    }

    // Death fallback
    if (unit.isDead) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, Math.PI / 2, 0.1);
        targetPos.y = 0.2; // Fall to floor
    } else {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
    }

    // Giữ hướng quay cố định theo phe
    meshRef.current.rotation.y = baseRotationY;

    meshRef.current.position.lerp(targetPos, 0.15);
  });

  return (
    <group ref={meshRef}>
      {/* HP Bar */}
      {!unit.isDead && (
        <group position={[0, 1.8, 0]}>
            <mesh position={[-0.5 + (unit.currentHp / unit.maxHp) * 0.5, 0, 0]}>
                <boxGeometry args={[1 * (unit.currentHp / unit.maxHp), 0.1, 0.05]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
                 <boxGeometry args={[1.05, 0.15, 0.01]} />
                 <meshBasicMaterial color="black" />
            </mesh>
        </group>
      )}

      {/* Floating Damage Text */}
      {floatingText && (
          <Float speed={5} rotationIntensity={0} floatIntensity={2}>
            <Text
                position={[0, 2.5, 0]}
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#ef4444"
            >
                {floatingText}
            </Text>
          </Float>
      )}

      {/* The Unit Body (3D model) */}
      <group position={[0, 0.75, 0]} castShadow receiveShadow>
        {unit.owner === 0 ? (
          <HeroModel heroId={unit.heroId} />
        ) : (
          <EnemyModel />
        )}
      </group>
      
      {/* Base Ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// --- Main Scene Component ---

interface BattleSceneProps {
  units: CombatUnit[]; // Current state of units to render
  action?: CombatAction | null; // Current action happening
  isPlaying: boolean;
}

const BattleScene: React.FC<BattleSceneProps> = ({ units, action, isPlaying }) => {
  
  // Helper to determine position based on index and owner
  const getPosition = (owner: number, index: number): [number, number, number] => {
    const x = (index - 1.5) * 1.5; // Spread horizontally centered
    const z = owner === 0 ? 3 : -3; // Players at +3 Z, Enemy at -3 Z
    return [x, 0, z];
  };

  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [6, 8, 8], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 60]} />
        
        {/* Lighting */}
        {/* Global soft light to keep models readable */}
        <hemisphereLight args={['#ffffff', '#020617', 1.2]} />
        <ambientLight intensity={0.6} />
        {/* Strong key light from camera side to reveal model colors clearly */}
        <directionalLight
          position={[8, 12, 10]}
          intensity={3}
          color="#ffffff"
          castShadow
        />
        {/* Fill lights for a bit of color accent */}
        <pointLight position={[10, 10, -8]} intensity={1.0} color="#22d3ee" />
        <pointLight position={[-8, 6, 4]} intensity={0.8} color="#ffffff" />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Floor */}
        <Grid 
            renderOrder={-1} 
            position={[0, 0, 0]} 
            infiniteGrid 
            cellSize={1} 
            sectionSize={5} 
            fadeDistance={20} 
            sectionColor="#3b82f6" 
            cellColor="#1e293b" 
        />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
        </mesh>

         {/* Board side halos */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3]}>
          <ringGeometry args={[2.6, 3.3, 40]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.18} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3]}>
          <ringGeometry args={[2.6, 3.3, 40]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.18} />
        </mesh>

        {/* Arena corner pillars */}
        <ArenaPillar position={[4.5, 0, 4.5]} />
        <ArenaPillar position={[-4.5, 0, 4.5]} />
        <ArenaPillar position={[4.5, 0, -4.5]} />
        <ArenaPillar position={[-4.5, 0, -4.5]} />

        {/* Units */}
        {units.map((u, i) => {
            // Determine animation flags based on current Action
            // Action structure: { type: 'ATTACK' | 'HIT', actorOwner, actorSlot, targetOwner, targetSlot }
            
            const isAttacking = action?.type === 'ATTACK' && 
                                action.actorOwner === u.owner && 
                                action.actorSlot === u.slotIndex;
            
            const isHit = action?.type === 'HIT' &&
                          action.targetOwner === u.owner &&
                          action.targetSlot === u.slotIndex;
            
            const dmgText = isHit && action?.damage !== undefined ? `-${action.damage}` : null;

            // Unique key for react
            const key = `${u.owner}-${u.slotIndex}`;

            return (
                <UnitMesh 
                    key={key}
                    unit={u}
                    position={getPosition(u.owner, u.slotIndex)}
                    isAttacking={isAttacking}
                    isHit={isHit}
                    floatingText={dmgText}
                />
            );
        })}

        <OrbitControls 
            enablePan={false} 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2.2} 
            maxDistance={20}
            minDistance={5}
        />
      </Canvas>
    </div>
  );
};

export default BattleScene;