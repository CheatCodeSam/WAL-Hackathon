"use client";

import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

function Model(props: React.ComponentProps<"group">) {
	const { scene } = useGLTF("/three/scene.gltf");
	const ref = useRef<THREE.Group>(null);

	useFrame((_state, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta * 0.5; // Spin speed
		}
	});

	return (
		<group ref={ref} {...props} dispose={null}>
			<primitive object={scene} scale={[5, 5, 5]} />
		</group>
	);
}

export default function SpinningModel() {
	return (
		<div className="h-full w-full bg-transparent">
			<Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
				<ambientLight intensity={0.5} />
				<spotLight angle={0.15} penumbra={1} position={[10, 10, 10]} />
				<pointLight position={[-10, -10, -10]} />
				<Center>
					<Model />
				</Center>
				<Environment preset="city" />
				<OrbitControls enableZoom={false} />
			</Canvas>
		</div>
	);
}

useGLTF.preload("/three/scene.gltf");
