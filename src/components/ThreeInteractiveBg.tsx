"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeInteractiveBg() {
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

    // Color Configs based on theme
    let isDark = document.documentElement.classList.contains("dark");
    let baseHex = isDark ? 0x818cf8 : 0x6366f1; // Indigo colors
    let baseColor = new THREE.Color(baseHex);

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

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX / window.innerWidth) - 0.5;
        mouseY = (event.touches[0].clientY / window.innerHeight) - 0.5;
      }
    };
    window.addEventListener("touchmove", handleTouchMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // VARIABLES FOR THE DIFFERENT MODES
    let activeMode = localStorage.getItem("interactiveBg") || "constellation";

    // 1. Constellation state variables
    const nodesCount = 65;
    const nodes: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    let ptGeometry: THREE.BufferGeometry;
    let ptMaterial: THREE.PointsMaterial;
    let ptMesh: THREE.Points;
    let lineGeometry: THREE.BufferGeometry;
    let lineMaterial: THREE.LineBasicMaterial;
    let lineMesh: THREE.LineSegments;
    const maxConnections = 160;

    // 2. Aurora (Ribbons) variables
    const ribbonCount = 3;
    const ribbonPoints = 80;
    const ribbonMeshes: THREE.Points[] = [];
    const ribbonGeometries: THREE.BufferGeometry[] = [];
    let ribbonMaterial: THREE.PointsMaterial;

    // 3. Matrix variables
    const streamCount = 28;
    const particlesPerStream = 12;
    const matrixStreams: {
      x: number;
      z: number;
      speed: number;
      offset: number;
      particles: { y: number; brightness: number }[];
    }[] = [];
    let matrixGeometry: THREE.BufferGeometry;
    let matrixMaterial: THREE.PointsMaterial;
    let matrixMesh: THREE.Points;

    // 4. Vortex variables
    const vortexCount = 600;
    const vortexParticles: {
      radius: number;
      angle: number;
      speed: number;
      z: number;
    }[] = [];
    let vortexGeometry: THREE.BufferGeometry;
    let vortexMaterial: THREE.PointsMaterial;
    let vortexMesh: THREE.Points;

    // 5. Tech (Floating Wireframe Shapes) variables
    const shapes: {
      mesh: THREE.Mesh;
      baseRot: THREE.Vector3;
      rotSpeed: THREE.Vector3;
      velocity: THREE.Vector3;
      spinForce: number;
    }[] = [];

    // CLEANUP FUNCTION FOR SCENE ITEMS
    const clearActiveBackground = () => {
      scene.clear();
      
      // Dispose Geometries and Materials
      if (ptGeometry) ptGeometry.dispose();
      if (ptMaterial) ptMaterial.dispose();
      if (lineGeometry) lineGeometry.dispose();
      if (lineMaterial) lineMaterial.dispose();

      ribbonGeometries.forEach((g) => g.dispose());
      ribbonGeometries.length = 0;
      ribbonMeshes.length = 0;
      if (ribbonMaterial) ribbonMaterial.dispose();

      if (matrixGeometry) matrixGeometry.dispose();
      if (matrixMaterial) matrixMaterial.dispose();

      if (vortexGeometry) vortexGeometry.dispose();
      if (vortexMaterial) vortexMaterial.dispose();

      shapes.forEach((s) => {
        s.mesh.geometry.dispose();
        if (Array.isArray(s.mesh.material)) {
          s.mesh.material.forEach((m) => m.dispose());
        } else {
          s.mesh.material.dispose();
        }
      });
      shapes.length = 0;
      nodes.length = 0;
      matrixStreams.length = 0;
      vortexParticles.length = 0;
    };

    // INITIALIZATION FUNCTION FOR SELECTED MODE
    const initBackground = () => {
      clearActiveBackground();

      isDark = document.documentElement.classList.contains("dark");
      baseHex = isDark ? 0x818cf8 : 0x6366f1;
      baseColor.setHex(baseHex);

      if (activeMode === "constellation") {
        // Setup nodes
        for (let i = 0; i < nodesCount; i++) {
          nodes.push({
            pos: new THREE.Vector3(
              (Math.random() - 0.5) * 16,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 6 - 1
            ),
            vel: new THREE.Vector3(
              (Math.random() - 0.5) * 0.015,
              (Math.random() - 0.5) * 0.015,
              (Math.random() - 0.5) * 0.01
            ),
          });
        }

        ptGeometry = new THREE.BufferGeometry();
        const ptPositions = new Float32Array(nodesCount * 3);
        ptGeometry.setAttribute("position", new THREE.BufferAttribute(ptPositions, 3));
        
        ptMaterial = new THREE.PointsMaterial({
          size: 0.08,
          color: baseHex,
          transparent: true,
          opacity: isDark ? 0.65 : 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ptMesh = new THREE.Points(ptGeometry, ptMaterial);
        scene.add(ptMesh);

        lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(maxConnections * 2 * 3);
        const lineColors = new Float32Array(maxConnections * 2 * 3);
        lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

        lineMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineMesh);

      } else if (activeMode === "aurora") {
        // Setup undulating parallel ribbons
        ribbonMaterial = new THREE.PointsMaterial({
          size: 0.07,
          color: isDark ? 0x06b6d4 : 0x0891b2, // Cyan tint for auroras
          transparent: true,
          opacity: isDark ? 0.55 : 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        for (let r = 0; r < ribbonCount; r++) {
          const geom = new THREE.BufferGeometry();
          const positions = new Float32Array(ribbonPoints * 3);
          geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          
          const mesh = new THREE.Points(geom, ribbonMaterial);
          mesh.position.z = -r * 2;
          scene.add(mesh);
          
          ribbonGeometries.push(geom);
          ribbonMeshes.push(mesh);
        }

      } else if (activeMode === "matrix") {
        // Falling cyber digital code streams
        matrixMaterial = new THREE.PointsMaterial({
          size: 0.075,
          color: isDark ? 0x10b981 : 0x059669, // Emerald green for matrix streams
          transparent: true,
          opacity: isDark ? 0.75 : 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        for (let i = 0; i < streamCount; i++) {
          const particles = [];
          for (let p = 0; p < particlesPerStream; p++) {
            particles.push({
              y: (Math.random() - 0.5) * 12,
              brightness: 1 - p / particlesPerStream,
            });
          }
          matrixStreams.push({
            x: (Math.random() - 0.5) * 18,
            z: (Math.random() - 0.5) * 4 - 1,
            speed: 0.05 + Math.random() * 0.05,
            offset: Math.random() * 10,
            particles,
          });
        }

        matrixGeometry = new THREE.BufferGeometry();
        const matrixPositions = new Float32Array(streamCount * particlesPerStream * 3);
        matrixGeometry.setAttribute("position", new THREE.BufferAttribute(matrixPositions, 3));
        
        matrixMesh = new THREE.Points(matrixGeometry, matrixMaterial);
        scene.add(matrixMesh);

      } else if (activeMode === "vortex") {
        // Space/Gamification star orbital vortex
        vortexMaterial = new THREE.PointsMaterial({
          size: 0.06,
          color: isDark ? 0xa78bfa : 0x7c3aed, // Purple/Violet tint for cosmos vortex
          transparent: true,
          opacity: isDark ? 0.65 : 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        for (let i = 0; i < vortexCount; i++) {
          vortexParticles.push({
            radius: 0.8 + Math.random() * 6.5,
            angle: Math.random() * Math.PI * 2,
            speed: 0.002 + Math.random() * 0.006,
            z: (Math.random() - 0.5) * 5 - 2,
          });
        }

        vortexGeometry = new THREE.BufferGeometry();
        const vortexPositions = new Float32Array(vortexCount * 3);
        vortexGeometry.setAttribute("position", new THREE.BufferAttribute(vortexPositions, 3));

        vortexMesh = new THREE.Points(vortexGeometry, vortexMaterial);
        scene.add(vortexMesh);

      } else if (activeMode === "tech") {
        // Floating wireframe geometries representing components and data structures
        const shapeGeometries = [
          new THREE.BoxGeometry(0.8, 0.8, 0.8),
          new THREE.OctahedronGeometry(0.6),
          new THREE.TorusGeometry(0.4, 0.12, 8, 24),
          new THREE.TetrahedronGeometry(0.6),
          new THREE.IcosahedronGeometry(0.5, 0),
          new THREE.ConeGeometry(0.45, 0.8, 4),
        ];

        const shapeMaterial = new THREE.MeshBasicMaterial({
          color: isDark ? 0x22d3ee : 0x0891b2, // Cyan wireframes
          wireframe: true,
          transparent: true,
          opacity: isDark ? 0.22 : 0.14,
        });

        // Spawn shapes at random coordinates
        for (let i = 0; i < 8; i++) {
          const geom = shapeGeometries[i % shapeGeometries.length].clone();
          const mesh = new THREE.Mesh(geom, shapeMaterial);
          mesh.position.set(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 4 - 2
          );

          scene.add(mesh);

          shapes.push({
            mesh,
            baseRot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0),
            rotSpeed: new THREE.Vector3(
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.005
            ),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01,
              0
            ),
            spinForce: 0,
          });
        }
      }
    };

    // TRIGGER SWITCH EVENT LISTENER
    const handleBgChange = () => {
      activeMode = localStorage.getItem("interactiveBg") || "constellation";
      initBackground();
    };
    window.addEventListener("bg-change", handleBgChange);

    // Initial load
    initBackground();

    // Theme Class MutationObserver
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      baseHex = isDark ? 0x818cf8 : 0x6366f1;
      baseColor.setHex(baseHex);
      
      // Update material color options on theme shift
      if (ptMaterial) {
        ptMaterial.color.setHex(baseHex);
        ptMaterial.opacity = isDark ? 0.65 : 0.45;
      }
      if (ribbonMaterial) {
        ribbonMaterial.color.setHex(isDark ? 0x06b6d4 : 0x0891b2);
        ribbonMaterial.opacity = isDark ? 0.55 : 0.35;
      }
      if (matrixMaterial) {
        matrixMaterial.color.setHex(isDark ? 0x10b981 : 0x059669);
        matrixMaterial.opacity = isDark ? 0.75 : 0.5;
      }
      if (vortexMaterial) {
        vortexMaterial.color.setHex(isDark ? 0xa78bfa : 0x7c3aed);
        vortexMaterial.opacity = isDark ? 0.65 : 0.45;
      }
      shapes.forEach((s) => {
        const mat = s.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(isDark ? 0x22d3ee : 0x0891b2);
        mat.opacity = isDark ? 0.22 : 0.14;
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // ANIMATION LOOP
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) / 1000;

      // Smooth mouse coordinates lerp
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      const attractor = new THREE.Vector3(targetX * 16, -targetY * 10, 0);

      // RENDER LOGIC PER SELECTED CODE MODE
      if (activeMode === "constellation" && ptMesh && lineMesh) {
        const ptPos = ptGeometry.attributes.position;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          node.pos.add(node.vel);

          // Magnet attractor pull toward mouse
          const distToMouse = node.pos.distanceTo(attractor);
          if (distToMouse < 4.5) {
            const pullDir = new THREE.Vector3().subVectors(attractor, node.pos).normalize();
            const pullStrength = (4.5 - distToMouse) * 0.007;
            node.pos.addScaledVector(pullDir, pullStrength);
          }

          // Bounds warp
          if (Math.abs(node.pos.x) > 9) node.vel.x *= -1;
          if (Math.abs(node.pos.y) > 6) node.vel.y *= -1;
          if (node.pos.z > 2 || node.pos.z < -6) node.vel.z *= -1;

          ptPos.setXYZ(i, node.pos.x + targetX * 1.5, node.pos.y - targetY * 1.5, node.pos.z);
        }
        ptPos.needsUpdate = true;

        // Line links logic
        let lineCount = 0;
        const lnPos = lineGeometry.attributes.position;
        const lnCol = lineGeometry.attributes.color;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];

            const x1 = n1.pos.x + targetX * 1.5;
            const y1 = n1.pos.y - targetY * 1.5;
            const z1 = n1.pos.z;

            const x2 = n2.pos.x + targetX * 1.5;
            const y2 = n2.pos.y - targetY * 1.5;
            const z2 = n2.pos.z;

            const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

            if (dist < 2.5 && lineCount < maxConnections) {
              lnPos.setXYZ(lineCount * 2, x1, y1, z1);
              lnPos.setXYZ(lineCount * 2 + 1, x2, y2, z2);

              const alpha = (1 - dist / 2.5) * (isDark ? 0.35 : 0.22);
              lnCol.setXYZ(lineCount * 2, baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);
              lnCol.setXYZ(lineCount * 2 + 1, baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);

              lineCount++;
            }
          }
        }

        for (let i = lineCount; i < maxConnections; i++) {
          lnPos.setXYZ(i * 2, 0, 0, 0);
          lnPos.setXYZ(i * 2 + 1, 0, 0, 0);
          lnCol.setXYZ(i * 2, 0, 0, 0);
          lnCol.setXYZ(i * 2 + 1, 0, 0, 0);
        }
        lnPos.needsUpdate = true;
        lnCol.needsUpdate = true;

      } else if (activeMode === "aurora") {
        // Undulating vector ribbon paths
        for (let r = 0; r < ribbonCount; r++) {
          const geom = ribbonGeometries[r];
          const pos = geom.attributes.position;
          const offset = r * Math.PI * 0.4;

          for (let i = 0; i < ribbonPoints; i++) {
            const x = ((i / ribbonPoints) - 0.5) * 22;
            
            // Generate standard sine undulations
            let y = Math.sin(x * 0.22 + elapsedTime * 0.7 + offset) * 2.2;
            
            // Mouse gravity warp ripples
            const dx = x - targetX * 16;
            const dist = Math.abs(dx);
            if (dist < 4) {
              y += Math.cos(dist * 0.4 - elapsedTime * 2) * 0.8 * (1 - dist / 4);
            }

            pos.setXYZ(i, x + targetX * r * 0.4, y - targetY * 1.2, 0);
          }
          pos.needsUpdate = true;
        }

      } else if (activeMode === "matrix" && matrixMesh) {
        // Fall code logic
        const pos = matrixGeometry.attributes.position;
        let index = 0;

        for (let i = 0; i < streamCount; i++) {
          const stream = matrixStreams[i];
          stream.offset += 0.005;

          for (let p = 0; p < particlesPerStream; p++) {
            const particle = stream.particles[p];
            // Subtract position coordinate to fall down
            particle.y -= stream.speed;

            // Reset to top coordinate if reaches bottom boundary
            if (particle.y < -6) {
              particle.y = 6;
            }

            // Mouse cursor wind displacement coordinates
            const py = particle.y - targetY * 2;
            const px = stream.x + targetX * 2;
            const dx = px - targetX * 16;
            const dy = py + targetY * 10;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Push columns away sideways based on cursor range
            let finalX = px;
            if (dist < 4) {
              const pushForce = (4 - dist) * 0.22;
              finalX += dx > 0 ? pushForce : -pushForce;
            }

            pos.setXYZ(index, finalX, py, stream.z);
            index++;
          }
        }
        pos.needsUpdate = true;

      } else if (activeMode === "vortex" && vortexMesh) {
        // Orbital spiraling physics
        const pos = vortexGeometry.attributes.position;
        for (let i = 0; i < vortexCount; i++) {
          const part = vortexParticles[i];
          part.angle += part.speed;

          const px = Math.cos(part.angle) * part.radius;
          const py = Math.sin(part.angle) * part.radius;
          
          // Camera tilt shift simulation
          pos.setXYZ(i, px + targetX * 2, py - targetY * 2, part.z);
        }
        pos.needsUpdate = true;

      } else if (activeMode === "tech") {
        // Floating wireframe drift and rotation logic
        shapes.forEach((s) => {
          s.mesh.position.add(s.velocity);

          // Boundary bounce
          if (Math.abs(s.mesh.position.x) > 8) s.velocity.x *= -1;
          if (Math.abs(s.mesh.position.y) > 5) s.velocity.y *= -1;

          // Parallax coordinate adjustments
          s.mesh.position.x += targetX * 0.008;
          s.mesh.position.y -= targetY * 0.008;

          // Magnet spin force trigger when cursor is adjacent
          const distToMouse = s.mesh.position.distanceTo(attractor);
          if (distToMouse < 2.5) {
            s.spinForce = Math.min(s.spinForce + 0.04, 0.45);
          } else {
            s.spinForce = Math.max(s.spinForce - 0.008, 0);
          }

          // Rotate geometries
          s.mesh.rotation.x = s.baseRot.x + elapsedTime * s.rotSpeed.x + s.spinForce * 8;
          s.mesh.rotation.y = s.baseRot.y + elapsedTime * s.rotSpeed.y + s.spinForce * 8;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up hook
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("bg-change", handleBgChange);
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      clearActiveBackground();

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
