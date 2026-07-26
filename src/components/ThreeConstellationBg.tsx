"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeConstellationBg() {
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

    // Setup color configurations
    let isDark = document.documentElement.classList.contains("dark");
    let baseHex = isDark ? 0x818cf8 : 0x6366f1; // Indigo colors
    let baseColor = new THREE.Color(baseHex);

    // Nodes definition
    const nodesCount = 80;
    const nodes: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      originalPos: THREE.Vector3;
    }[] = [];

    // Spawn nodes in a 3D box bounding area
    for (let i = 0; i < nodesCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 1
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.01
      );
      nodes.push({
        pos,
        vel,
        originalPos: pos.clone()
      });
    }

    // Nodes Point Geometry
    const pointGeometry = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(nodesCount * 3);
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
    
    const pointMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: baseHex,
      transparent: true,
      opacity: isDark ? 0.65 : 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pointMesh = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointMesh);

    // Constellation lines geometry (Pre-allocate connection points buffer)
    const maxConnections = 240;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // Mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) - 0.5;
      mouseY = (event.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Observe theme class changes to dynamically update colors
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      baseHex = isDark ? 0x818cf8 : 0x6366f1;
      baseColor.setHex(baseHex);
      pointMaterial.color.setHex(baseHex);
      pointMaterial.opacity = isDark ? 0.65 : 0.45;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse follow (Lerp)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Dynamic virtual mouse attractor position in 3D coordinates
      const attractor = new THREE.Vector3(targetX * 16, -targetY * 10, 0);

      // Update node positions
      const ptPos = pointGeometry.attributes.position;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Slowly drift nodes
        node.pos.add(node.vel);

        // Attract nodes near the mouse
        const distToMouse = node.pos.distanceTo(attractor);
        if (distToMouse < 4.5) {
          const pullDir = new THREE.Vector3().subVectors(attractor, node.pos).normalize();
          const pullStrength = (4.5 - distToMouse) * 0.007; // subtle pull
          node.pos.addScaledVector(pullDir, pullStrength);
        }

        // Boundary checks (elastic return or bounce within box viewport limits)
        if (Math.abs(node.pos.x) > 9) node.vel.x *= -1;
        if (Math.abs(node.pos.y) > 6) node.vel.y *= -1;
        if (node.pos.z > 2 || node.pos.z < -6) node.vel.z *= -1;

        // Apply visual parallax coordinates to point mesh coordinates
        ptPos.setXYZ(i, node.pos.x + targetX * 1.5, node.pos.y - targetY * 1.5, node.pos.z);
      }
      ptPos.needsUpdate = true;

      // Connect nodes with lines based on distance
      let lineCount = 0;
      const lnPos = lineGeometry.attributes.position;
      const lnCol = lineGeometry.attributes.color;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          // Compute parallaxed positions
          const x1 = n1.pos.x + targetX * 1.5;
          const y1 = n1.pos.y - targetY * 1.5;
          const z1 = n1.pos.z;

          const x2 = n2.pos.x + targetX * 1.5;
          const y2 = n2.pos.y - targetY * 1.5;
          const z2 = n2.pos.z;

          const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

          if (dist < 2.5 && lineCount < maxConnections) {
            // Set connection points
            lnPos.setXYZ(lineCount * 2, x1, y1, z1);
            lnPos.setXYZ(lineCount * 2 + 1, x2, y2, z2);

            // Compute connection opacity based on distance
            const alpha = (1 - dist / 2.5) * (isDark ? 0.35 : 0.22);

            // Set colors with alpha transparency built-in
            lnCol.setXYZ(lineCount * 2, baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);
            lnCol.setXYZ(lineCount * 2 + 1, baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);

            lineCount++;
          }
        }
      }

      // Fill remaining line buffers with zero coordinates to avoid drawing garbage lines
      for (let i = lineCount; i < maxConnections; i++) {
        lnPos.setXYZ(i * 2, 0, 0, 0);
        lnPos.setXYZ(i * 2 + 1, 0, 0, 0);
        lnCol.setXYZ(i * 2, 0, 0, 0);
        lnCol.setXYZ(i * 2 + 1, 0, 0, 0);
      }

      lnPos.needsUpdate = true;
      lnCol.needsUpdate = true;

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
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);

      pointGeometry.dispose();
      pointMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-80 dark:opacity-60"
    />
  );
}
