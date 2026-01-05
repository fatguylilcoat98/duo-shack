
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float, Center } from '@react-three/drei';
import * as THREE from 'three';
import { BoardState } from '../types';

interface CellProps {
  index: number;
  value: string | null;
  isWinningCell: boolean;
  onMove: (idx: number) => void;
}

const Cell: React.FC<CellProps> = ({ index, value, isWinningCell, onMove }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const row = Math.floor(index / 3);
  const col = index % 3;
  const x = (col - 1) * 2.2;
  const y = (1 - row) * 2.2;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group position={[x, y, 0]}>
      <RoundedBox
        ref={meshRef}
        args={[2, 2, 0.4]}
        radius={0.2}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onMove(index);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <meshStandardMaterial
          color={isWinningCell ? "#39ff14" : "#111"}
          emissive={isWinningCell ? "#39ff14" : "#000"}
          emissiveIntensity={isWinningCell ? 0.5 : 0}
          roughness={0.2}
          metalness={0.8}
        />
      </RoundedBox>

      {value && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            position={[0, 0, 0.3]}
            fontSize={1.2}
            color={value === 'X' ? "#39ff14" : "#ff1493"}
            font="https://fonts.gstatic.com/s/spacegrotesk/v13/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-g.woff"
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </Float>
      )}
    </group>
  );
};

interface GridProps {
  board: BoardState;
  winningLine: number[] | null;
  onMove: (idx: number) => void;
}

export const GameGrid: React.FC<GridProps> = ({ board, winningLine, onMove }) => {
  return (
    <Center top>
      <group>
        {board.map((cell, i) => (
          <Cell
            key={i}
            index={i}
            value={cell}
            isWinningCell={winningLine?.includes(i) ?? false}
            onMove={onMove}
          />
        ))}
        {/* Background Plane for atmosphere */}
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
      </group>
    </Center>
  );
};
