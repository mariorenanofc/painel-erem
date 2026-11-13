"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function HeroIsometricWorkspace3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Verificar se o usuário prefere redução de movimento
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE & FOG
    const scene = new THREE.Scene();

    // 2. CAMERA ISOMÉTRICA (PERSPECTIVA ANGULADA)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(5.5, 4.8, 6.5);
    camera.lookAt(0, 0.2, 0);

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. LIGHTS
    const ambientLight = new THREE.AmbientLight(0x2d1b69, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff7700, 2.8);
    dirLight.position.set(5, 8, 4);
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0x9d4edd, 3.5, 12);
    purpleLight.position.set(-2, 4, 3);
    scene.add(purpleLight);

    const screenLight = new THREE.PointLight(0x38bdf8, 2.2, 5);
    screenLight.position.set(0, 1.2, 0.5);
    scene.add(screenLight);

    // 5. GRUPO ISOMÉTRICO PRINCIPAL
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ══════════════════════════════════════════════════════════
    // 6. PLATAFORMAS & PADS LUMINOSOS ISOMÉTRICOS (BASE)
    // ══════════════════════════════════════════════════════════

    // Tapete retangular principal sob o laptop (wireframe com contorno neon)
    const basePadPoints = [
      new THREE.Vector3(-2.2, 0, -1.8),
      new THREE.Vector3(2.2, 0, -1.8),
      new THREE.Vector3(2.2, 0, 1.8),
      new THREE.Vector3(-2.2, 0, 1.8),
      new THREE.Vector3(-2.2, 0, -1.8),
    ];
    const basePadGeo = new THREE.BufferGeometry().setFromPoints(basePadPoints);
    const basePadMat = new THREE.LineBasicMaterial({ color: 0xff6b4a, linewidth: 2, transparent: true, opacity: 0.85 });
    const basePadLine = new THREE.Line(basePadGeo, basePadMat);
    basePadLine.rotation.y = -Math.PI / 10;
    rootGroup.add(basePadLine);

    // Superfície suave sutilmente preenchida
    const padPlaneGeo = new THREE.PlaneGeometry(4.4, 3.6);
    const padPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x3b1c6e,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const padPlane = new THREE.Mesh(padPlaneGeo, padPlaneMat);
    padPlane.rotation.x = -Math.PI / 2;
    padPlane.rotation.z = Math.PI / 10;
    padPlane.position.y = -0.01;
    rootGroup.add(padPlane);

    // Base pad para o copo de café
    const coffeePadPoints = [
      new THREE.Vector3(-0.6, 0, -0.6),
      new THREE.Vector3(0.6, 0, -0.6),
      new THREE.Vector3(0.6, 0, 0.6),
      new THREE.Vector3(-0.6, 0, 0.6),
      new THREE.Vector3(-0.6, 0, -0.6),
    ];
    const coffeePadGeo = new THREE.BufferGeometry().setFromPoints(coffeePadPoints);
    const coffeePadMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2, transparent: true, opacity: 0.8 });
    const coffeePad = new THREE.Line(coffeePadGeo, coffeePadMat);
    coffeePad.position.set(-2.4, 0.05, 0.2);
    coffeePad.rotation.y = -Math.PI / 10;
    rootGroup.add(coffeePad);

    // Contornos secundários flutuantes (Wireframe pads que orbitam/levitam)
    const floatingBoxes: THREE.Line[] = [];
    const boxOffsets = [
      { pos: [2.5, 0.4, 1.6], size: [0.7, 0.7], color: 0xff8c42 },
      { pos: [3.2, 0.8, -0.8], size: [0.5, 0.5], color: 0xa855f7 },
      { pos: [-1.8, 0.6, -2.4], size: [0.6, 0.6], color: 0x38bdf8 },
      { pos: [1.2, 0.2, 2.5], size: [0.4, 0.4], color: 0xf43f5e },
    ];

    boxOffsets.forEach((cfg) => {
      const pts = [
        new THREE.Vector3(-cfg.size[0] / 2, 0, -cfg.size[1] / 2),
        new THREE.Vector3(cfg.size[0] / 2, 0, -cfg.size[1] / 2),
        new THREE.Vector3(cfg.size[0] / 2, 0, cfg.size[1] / 2),
        new THREE.Vector3(-cfg.size[0] / 2, 0, cfg.size[1] / 2),
        new THREE.Vector3(-cfg.size[0] / 2, 0, -cfg.size[1] / 2),
      ];
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.65 });
      const line = new THREE.Line(g, m);
      line.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      line.rotation.y = -Math.PI / 10;
      rootGroup.add(line);
      floatingBoxes.push(line);
    });

    // ══════════════════════════════════════════════════════════
    // 7. O LAPTOP ISOMÉTRICO 3D (CHASSI, TECLADO, TELA VIVA)
    // ══════════════════════════════════════════════════════════
    const laptopGroup = new THREE.Group();
    laptopGroup.rotation.y = -Math.PI / 10;
    rootGroup.add(laptopGroup);

    // Base do Laptop (Chassi Metálico Inferior)
    const baseGeo = new THREE.BoxGeometry(2.6, 0.08, 1.8);
    const chassiMat = new THREE.MeshStandardMaterial({
      color: 0x221345,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, chassiMat);
    baseMesh.position.y = 0.05;
    laptopGroup.add(baseMesh);

    // Trackpad com iluminação de contorno
    const trackpadGeo = new THREE.PlaneGeometry(0.8, 0.55);
    const trackpadMat = new THREE.MeshStandardMaterial({
      color: 0x44268a,
      emissive: 0x261452,
      metalness: 0.5,
      roughness: 0.4,
    });
    const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
    trackpad.rotation.x = -Math.PI / 2;
    trackpad.position.set(0, 0.095, 0.5);
    laptopGroup.add(trackpad);

    // Teclado com teclas iluminadas (Grid procedural de teclado)
    const keyboardGeo = new THREE.PlaneGeometry(2.2, 0.85);
    const keyboardMat = new THREE.MeshStandardMaterial({
      color: 0x140a2b,
      roughness: 0.6,
    });
    const keyboard = new THREE.Mesh(keyboardGeo, keyboardMat);
    keyboard.rotation.x = -Math.PI / 2;
    keyboard.position.set(0, 0.095, -0.25);
    laptopGroup.add(keyboard);

    // Grade de teclas individuais em relevo
    const keysGroup = new THREE.Group();
    const rows = 5;
    const cols = 14;
    const keyWidth = 0.12;
    const keyHeight = 0.11;
    const spacingX = 0.15;
    const spacingZ = 0.15;
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;

    const singleKeyGeo = new THREE.BoxGeometry(keyWidth, 0.02, keyHeight);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x311a68,
      emissive: 0x1d0f40,
      metalness: 0.3,
      roughness: 0.3,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = new THREE.Mesh(singleKeyGeo, keyMat);
        key.position.set(startX + c * spacingX, 0.11, -0.25 + startZ + r * spacingZ);
        keysGroup.add(key);
      }
    }
    laptopGroup.add(keysGroup);

    // Tela do Laptop (Tampa Superior Aberta a 115 graus)
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.08, -0.9);
    laptopGroup.add(screenHinge);

    // Ângulo de inclinação elegante da tela
    screenHinge.rotation.x = THREE.MathUtils.degToRad(-25);

    // Chassi da Tampa Superior
    const lidGeo = new THREE.BoxGeometry(2.6, 1.8, 0.05);
    const lidMesh = new THREE.Mesh(lidGeo, chassiMat);
    lidMesh.position.set(0, 0.9, -0.025);
    screenHinge.add(lidMesh);

    // Moldura preta do display
    const bezelGeo = new THREE.PlaneGeometry(2.46, 1.66);
    const bezelMat = new THREE.MeshBasicMaterial({ color: 0x070314 });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, 0.9, 0.002);
    screenHinge.add(bezel);

    // ══════════════════════════════════════════════════════════
    // 8. CÓDIGO VIVO DINÂMICO RENDERIZADO NO CANVAS DA TELA 3D
    // ══════════════════════════════════════════════════════════
    const codeCanvas = document.createElement("canvas");
    codeCanvas.width = 1024;
    codeCanvas.height = 700;
    const ctx = codeCanvas.getContext("2d");

    const codeTexture = new THREE.CanvasTexture(codeCanvas);
    codeTexture.generateMipmaps = true;

    const displayGeo = new THREE.PlaneGeometry(2.36, 1.56);
    const displayMat = new THREE.MeshBasicMaterial({ map: codeTexture });
    const displayScreen = new THREE.Mesh(displayGeo, displayMat);
    displayScreen.position.set(0, 0.9, 0.005);
    screenHinge.add(displayScreen);

    // Linhas de código animadas reproduzindo a sintaxe da imagem
    const codeLines = [
      { tokens: [{ t: "const ", c: "#f43f5e" }, { t: "trilhaTech ", c: "#38bdf8" }, { t: "= ", c: "#f59e0b" }, { t: "new Platform(", c: "#a855f7" }, { t: "'PFT');", c: "#10b981" }] },
      { tokens: [{ t: "async function ", c: "#f43f5e" }, { t: "iniciarJornada", c: "#38bdf8" }, { t: "(aluno) {", c: "#e2e8f0" }] },
      { tokens: [{ t: "  const ", c: "#f43f5e" }, { t: "modulos ", c: "#38bdf8" }, { t: "= await ", c: "#f59e0b" }, { t: "cesarSchool.getCurriculo();", c: "#fb923c" }] },
      { tokens: [{ t: "  for (const ", c: "#f43f5e" }, { t: "missao ", c: "#38bdf8" }, { t: "of ", c: "#f43f5e" }, { t: "modulos) {", c: "#e2e8f0" }] },
      { tokens: [{ t: "    await ", c: "#f59e0b" }, { t: "aluno.aprender(missao);", c: "#10b981" }] },
      { tokens: [{ t: "    aluno.ganharXP(", c: "#a855f7" }, { t: "+150", c: "#f59e0b" }, { t: ");", c: "#e2e8f0" }] },
      { tokens: [{ t: "    aluno.desbloquearBadge(", c: "#a855f7" }, { t: "'FrontEnd Master'", c: "#fb923c" }, { t: ");", c: "#e2e8f0" }] },
      { tokens: [{ t: "  }", c: "#e2e8f0" }] },
      { tokens: [{ t: "  return ", c: "#f43f5e" }, { t: "aluno.obterCertificadoPFT();", c: "#38bdf8" }] },
      { tokens: [{ t: "}", c: "#e2e8f0" }] },
      { tokens: [{ t: "// Florescendo Talentos 2026 - EREM Barão de Exu", c: "#64748b" }] },
    ];

    let typingCharIndex = 0;
    let typingLineIndex = 0;
    let lastTypeTime = 0;

    const renderCodeToCanvas = () => {
      if (!ctx) return;
      // Fundo degradê da janela de código como na imagem
      const grad = ctx.createLinearGradient(0, 0, codeCanvas.width, codeCanvas.height);
      grad.addColorStop(0, "#12082b");
      grad.addColorStop(1, "#1e0e47");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, codeCanvas.width, codeCanvas.height);

      // Barra superior da IDE
      ctx.fillStyle = "#1e1042";
      ctx.fillRect(0, 0, codeCanvas.width, 50);

      // Botões da janela (macOS style em tons de neon)
      ctx.fillStyle = "#ff5f56";
      ctx.beginPath(); ctx.arc(35, 25, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffbd2e";
      ctx.beginPath(); ctx.arc(60, 25, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#27c93f";
      ctx.beginPath(); ctx.arc(85, 25, 8, 0, Math.PI * 2); ctx.fill();

      // Aba ativa
      ctx.fillStyle = "#12082b";
      ctx.fillRect(115, 8, 220, 42);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 16px 'Fira Code', monospace";
      ctx.fillText("🚀 trilhatech.ts", 135, 33);

      // Renderização do código com sintaxe colorida
      ctx.font = "bold 24px 'Fira Code', monospace";
      let y = 100;
      const lineHeight = 38;

      for (let i = 0; i <= typingLineIndex && i < codeLines.length; i++) {
        let x = 70;
        // Número da linha
        ctx.fillStyle = "#4c3d75";
        ctx.fillText(String(i + 1).padStart(2, "0"), 25, y);

        const line = codeLines[i];
        let remainingChars = i === typingLineIndex ? typingCharIndex : 9999;

        for (const token of line.tokens) {
          if (remainingChars <= 0) break;
          const charsToDraw = Math.min(token.t.length, remainingChars);
          const substr = token.t.slice(0, charsToDraw);
          ctx.fillStyle = token.c;
          ctx.fillText(substr, x, y);
          x += ctx.measureText(substr).width;
          remainingChars -= charsToDraw;
        }

        // Cursor piscante na linha atual
        if (i === typingLineIndex) {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(x + 2, y - 22, 12, 26);
        }

        y += lineHeight;
      }

      codeTexture.needsUpdate = true;
    };

    // ══════════════════════════════════════════════════════════
    // 9. COPO TÉRMICO DE CAFÉ COM VAPOR HELICOIDAL EM 3D
    // ══════════════════════════════════════════════════════════
    const coffeeGroup = new THREE.Group();
    coffeeGroup.position.set(-2.4, 0, 0.2);
    coffeeGroup.rotation.y = -Math.PI / 10;
    rootGroup.add(coffeeGroup);

    // Corpo Cilíndrico do Copo
    const cupGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.95, 24);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0x48248c,
      metalness: 0.4,
      roughness: 0.35,
    });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 0.52;
    coffeeGroup.add(cup);

    // Luva de Borracha Central do Copo
    const sleeveGeo = new THREE.CylinderGeometry(0.33, 0.3, 0.45, 24);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x221045,
      roughness: 0.8,
    });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.y = 0.52;
    coffeeGroup.add(sleeve);

    // Tampa do Copo Térmico
    const lidCupGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 24);
    const lidCupMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.3,
      roughness: 0.4,
    });
    const cupLid = new THREE.Mesh(lidCupGeo, lidCupMat);
    cupLid.position.y = 1.05;
    coffeeGroup.add(cupLid);

    // Vapor de Café em Curva Senoidal com Partículas Flutuantes
    const steamParticleCount = 28;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamParticleCount * 3);
    const steamSpeeds: { offset: number; speed: number; radius: number }[] = [];

    for (let i = 0; i < steamParticleCount; i++) {
      steamPositions[i * 3] = 0;
      steamPositions[i * 3 + 1] = 1.1 + (i / steamParticleCount) * 1.5;
      steamPositions[i * 3 + 2] = 0;
      steamSpeeds.push({
        offset: i * 0.4,
        speed: 0.8 + Math.random() * 0.4,
        radius: 0.08 + (i / steamParticleCount) * 0.25,
      });
    }

    steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPositions, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.09,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    coffeeGroup.add(steamParticles);

    // ══════════════════════════════════════════════════════════
    // 10. POEIRA HOLOGRÁFICA & BITS ORBITANTES
    // ══════════════════════════════════════════════════════════
    const starsCount = 70;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 10;
      starPositions[i * 3 + 1] = Math.random() * 6 - 0.5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ══════════════════════════════════════════════════════════
    // 11. MOUSE PARALLAX & LOOP DE ANIMAÇÃO
    // ══════════════════════════════════════════════════════════
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x;
      mouseY = y;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Digitação dinâmica de código
      if (elapsedTime - lastTypeTime > 0.045) {
        lastTypeTime = elapsedTime;
        typingCharIndex += 2;
        const currentLine = codeLines[typingLineIndex];
        const lineTotalChars = currentLine.tokens.reduce((acc, tk) => acc + tk.t.length, 0);

        if (typingCharIndex > lineTotalChars) {
          typingCharIndex = 0;
          typingLineIndex = (typingLineIndex + 1) % codeLines.length;
        }
        renderCodeToCanvas();
      }

      // Animação do vapor de café
      const positions = steamGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < steamParticleCount; i++) {
        const cfg = steamSpeeds[i];
        const t = elapsedTime * cfg.speed + cfg.offset;
        positions[i * 3] = Math.sin(t * 2) * cfg.radius;
        positions[i * 3 + 2] = Math.cos(t * 2) * cfg.radius;
        // Movimento ascendente contínuo
        const currentY = positions[i * 3 + 1];
        positions[i * 3 + 1] = currentY > 2.5 ? 1.05 : currentY + 0.008;
      }
      steamGeo.attributes.position.needsUpdate = true;

      // Levitação suave dos pads wireframe flutuantes
      floatingBoxes.forEach((box, idx) => {
        box.position.y += Math.sin(elapsedTime * 2 + idx) * 0.0015;
      });

      // Levitação suave do laptop
      laptopGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.04;

      // Efeito de Parallax Suave com o Mouse
      targetRotY = mouseX * 0.35;
      targetRotX = mouseY * 0.25;

      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.05;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.05;

      // Respiração da luz da tela
      screenLight.intensity = 2.0 + Math.sin(elapsedTime * 4) * 0.4;

      renderer.render(scene, camera);
    };

    renderCodeToCanvas();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[720px] relative select-none pointer-events-auto"
      style={{ touchAction: "none" }}
    />
  );
}
