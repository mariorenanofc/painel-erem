"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeParticleBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check prefers-reduced-motion to disable/reduce animation if needed
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return; // Skip rendering heavy 3D animations
    }

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Starfield Particles
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 18; // spread particles
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x818cf8, // Indigo-400
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Web Programming Symbols geometries
    // Draw: </>, {}, [], ()
    const createTagGeometry = () => {
      const pts = [
        // <
        new THREE.Vector3(0.2, 0.35, 0),
        new THREE.Vector3(-0.25, 0, 0),
        new THREE.Vector3(-0.25, 0, 0),
        new THREE.Vector3(0.2, -0.35, 0),
        // /
        new THREE.Vector3(-0.08, -0.45, 0),
        new THREE.Vector3(0.08, 0.45, 0),
        // >
        new THREE.Vector3(0.35, 0.35, 0),
        new THREE.Vector3(0.8, 0, 0),
        new THREE.Vector3(0.8, 0, 0),
        new THREE.Vector3(0.35, -0.35, 0)
      ];
      pts.forEach(p => p.x -= 0.275);
      return new THREE.BufferGeometry().setFromPoints(pts);
    };

    const createBracesGeometry = () => {
      const pts = [
        // {
        new THREE.Vector3(0.2, 0.4, 0),
        new THREE.Vector3(0.0, 0.4, 0),
        new THREE.Vector3(0.0, 0.4, 0),
        new THREE.Vector3(0.0, 0.12, 0),
        new THREE.Vector3(0.0, 0.12, 0),
        new THREE.Vector3(-0.2, 0, 0),
        new THREE.Vector3(-0.2, 0, 0),
        new THREE.Vector3(0.0, -0.12, 0),
        new THREE.Vector3(0.0, -0.12, 0),
        new THREE.Vector3(0.0, -0.4, 0),
        new THREE.Vector3(0.0, -0.4, 0),
        new THREE.Vector3(0.2, -0.4, 0),
        // }
        new THREE.Vector3(0.5, 0.4, 0),
        new THREE.Vector3(0.7, 0.4, 0),
        new THREE.Vector3(0.7, 0.4, 0),
        new THREE.Vector3(0.7, 0.12, 0),
        new THREE.Vector3(0.7, 0.12, 0),
        new THREE.Vector3(0.9, 0, 0),
        new THREE.Vector3(0.9, 0, 0),
        new THREE.Vector3(0.7, -0.12, 0),
        new THREE.Vector3(0.7, -0.12, 0),
        new THREE.Vector3(0.7, -0.4, 0),
        new THREE.Vector3(0.7, -0.4, 0),
        new THREE.Vector3(0.5, -0.4, 0)
      ];
      pts.forEach(p => p.x -= 0.35);
      return new THREE.BufferGeometry().setFromPoints(pts);
    };

    const createBracketsGeometry = () => {
      const pts = [
        // [
        new THREE.Vector3(0.15, 0.4, 0),
        new THREE.Vector3(-0.2, 0.4, 0),
        new THREE.Vector3(-0.2, 0.4, 0),
        new THREE.Vector3(-0.2, -0.4, 0),
        new THREE.Vector3(-0.2, -0.4, 0),
        new THREE.Vector3(0.15, -0.4, 0),
        // ]
        new THREE.Vector3(0.45, 0.4, 0),
        new THREE.Vector3(0.8, 0.4, 0),
        new THREE.Vector3(0.8, 0.4, 0),
        new THREE.Vector3(0.8, -0.4, 0),
        new THREE.Vector3(0.8, -0.4, 0),
        new THREE.Vector3(0.45, -0.4, 0)
      ];
      pts.forEach(p => p.x -= 0.3);
      return new THREE.BufferGeometry().setFromPoints(pts);
    };

    const createParenthesesGeometry = () => {
      const pts = [
        // (
        new THREE.Vector3(0.12, 0.4, 0),
        new THREE.Vector3(-0.08, 0.18, 0),
        new THREE.Vector3(-0.08, 0.18, 0),
        new THREE.Vector3(-0.08, -0.18, 0),
        new THREE.Vector3(-0.08, -0.18, 0),
        new THREE.Vector3(0.12, -0.4, 0),
        // )
        new THREE.Vector3(0.48, 0.4, 0),
        new THREE.Vector3(0.68, 0.18, 0),
        new THREE.Vector3(0.68, 0.18, 0),
        new THREE.Vector3(0.68, -0.18, 0),
        new THREE.Vector3(0.68, -0.18, 0),
        new THREE.Vector3(0.48, -0.4, 0)
      ];
      pts.forEach(p => p.x -= 0.3);
      return new THREE.BufferGeometry().setFromPoints(pts);
    };

    const geometries = [
      createTagGeometry(),
      createBracesGeometry(),
      createBracketsGeometry(),
      createParenthesesGeometry()
    ];

    const colors = [
      0x6366f1, // Indigo
      0x06b6d4, // Cyan
      0xd946ef, // Fuchsia
      0x10b981, // Emerald
    ];

    const floatingObjects: {
      mesh: THREE.LineSegments;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotXSpeed: number;
      rotYSpeed: number;
      rotZSpeed: number;
      floatSpeed: number;
      floatOffset: number;
    }[] = [];

    // Spawn 15 floating coding symbols at different depths
    for (let i = 0; i < 15; i++) {
      const geom = geometries[i % geometries.length];
      const color = colors[i % colors.length];

      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.LineSegments(geom, material);

      // Distribute widely in X/Y/Z space
      const baseX = (Math.random() - 0.5) * 15;
      const baseY = (Math.random() - 0.5) * 10;
      const baseZ = (Math.random() - 0.5) * 8 - 2; // Z from -6 to +2

      mesh.position.set(baseX, baseY, baseZ);

      // Random scale scale
      const scale = 0.8 + Math.random() * 0.9;
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);

      floatingObjects.push({
        mesh,
        baseX,
        baseY,
        baseZ,
        rotXSpeed: (Math.random() - 0.5) * 0.4,
        rotYSpeed: (Math.random() - 0.5) * 0.4,
        rotZSpeed: (Math.random() - 0.5) * 0.3,
        floatSpeed: 0.12 + Math.random() * 0.18,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mouse coordinates for interactive parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) - 0.5;
      mouseY = (event.clientY / window.innerHeight) - 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Spin the starfield very slowly
      particlesMesh.rotation.y = elapsedTime * 0.015;

      // Mouse interactive parallax (Lerp for smooth transition)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Update floating items
      floatingObjects.forEach((obj) => {
        // Self rotation
        obj.mesh.rotation.x += obj.rotXSpeed * 0.012;
        obj.mesh.rotation.y += obj.rotYSpeed * 0.018;
        obj.mesh.rotation.z += obj.rotZSpeed * 0.008;

        // Hover sine wave displacement
        const yOffset = Math.sin(elapsedTime * obj.floatSpeed + obj.floatOffset) * 0.4;
        const xOffset = Math.cos(elapsedTime * (obj.floatSpeed * 0.8) + obj.floatOffset) * 0.25;

        // Immersive 3D Depth Parallax: closer objects (higher baseZ) move much faster
        // baseZ ranges from -6 to +2. Normalize it so factor ranges from ~0.5 to ~5.0
        const depthFactor = (obj.baseZ + 6.5) * 0.65;

        obj.mesh.position.x = obj.baseX + xOffset + targetX * depthFactor * 4.0;
        obj.mesh.position.y = obj.baseY + yOffset - targetY * depthFactor * 4.0;
      });

      renderer.render(scene, camera);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX / window.innerWidth) - 0.5;
        mouseY = (event.touches[0].clientY / window.innerHeight) - 0.5;
      }
    };
    window.addEventListener("touchmove", handleTouchMove);

    animate();

    // Clean up
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose materials/geometry to prevent memory leaks
      particlesGeometry.dispose();
      particlesMaterial.dispose();

      floatingObjects.forEach((obj) => {
        obj.mesh.geometry.dispose();
        if (Array.isArray(obj.mesh.material)) {
          obj.mesh.material.forEach((m) => m.dispose());
        } else {
          obj.mesh.material.dispose();
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-40"
    />
  );
}
