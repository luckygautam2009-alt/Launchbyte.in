"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ArrowRight, Compass, Sparkles, ExternalLink } from "lucide-react";

export interface PlanetData {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  orbitRadius: number;
  size: number;
  speed: number; // orbital angular velocity in rad/sec
  color: string;
  glowColor: string;
  initialAngle: number;
  tilt: number;
  hasRing?: boolean;
}

export const PLANETS: PlanetData[] = [
  {
    id: "hackathons",
    name: "HACKATHONS",
    category: "Competitive Builds",
    description: "Compete, collaborate and turn your ideas into reality.",
    route: "/hackathons",
    orbitRadius: 12,
    size: 1.3,
    speed: 0.34,
    color: "#8B5CF6",
    glowColor: "#C4B5FD",
    initialAngle: 0.6,
    tilt: 0.18,
  },
  {
    id: "internships",
    name: "INTERNSHIPS",
    category: "Career Launchpad",
    description: "Explore internships and grow your career with leading tech teams.",
    route: "/opportunities",
    orbitRadius: 18.5,
    size: 1.55,
    speed: 0.25,
    color: "#6366F1",
    glowColor: "#22D3EE",
    initialAngle: 2.3,
    tilt: 0.28,
  },
  {
    id: "opportunities",
    name: "OPPORTUNITIES",
    category: "Fellowships & Grants",
    description: "Find programs, competitions and new possibilities across Web3 and AI.",
    route: "/opportunities",
    orbitRadius: 27,
    size: 2.2,
    speed: 0.18,
    color: "#7C3AED",
    glowColor: "#A78BFA",
    initialAngle: 4.1,
    tilt: 0.45,
    hasRing: true,
  },
  {
    id: "community",
    name: "COMMUNITY",
    category: "Builder Network",
    description: "Connect with developers, builders and innovators across universities.",
    route: "/people",
    orbitRadius: 36,
    size: 1.65,
    speed: 0.13,
    color: "#A78BFA",
    glowColor: "#DDD6FE",
    initialAngle: 1.4,
    tilt: 0.12,
  },
  {
    id: "projects",
    name: "PROJECTS",
    category: "Collaborative Labs",
    description: "Discover projects and collaborate with other builders worldwide.",
    route: "/projects",
    orbitRadius: 46,
    size: 1.85,
    speed: 0.08,
    color: "#4F46E5",
    glowColor: "#818CF8",
    initialAngle: 5.2,
    tilt: 0.32,
  },
];

// Helper: Generate procedural planet textures on in-memory 2D canvas
function createPlanetTexture(type: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  if (type === "hackathons") {
    // Deep violet with high-energy bands
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#1E0B36");
    grad.addColorStop(0.25, "#4C1D95");
    grad.addColorStop(0.5, "#7C3AED");
    grad.addColorStop(0.75, "#6D28D9");
    grad.addColorStop(1, "#2E1065");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 24; i++) {
      const y = Math.random() * 256;
      ctx.fillStyle = i % 2 === 0 ? "rgba(167, 139, 250, 0.45)" : "rgba(221, 214, 254, 0.3)";
      ctx.fillRect(0, y, 512, Math.random() * 7 + 2);
    }
  } else if (type === "internships") {
    // Blue-violet gas giant with cyan swirls
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#0F172A");
    grad.addColorStop(0.35, "#1E1B4B");
    grad.addColorStop(0.65, "#312E81");
    grad.addColorStop(1, "#0F172A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      ctx.fillStyle = "rgba(34, 211, 238, 0.35)";
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, y, Math.random() * 80 + 30, Math.random() * 8 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "opportunities") {
    // Ringed planet surface (lavender & royal purple banding)
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#2E1065");
    grad.addColorStop(0.2, "#581C87");
    grad.addColorStop(0.4, "#7E22CE");
    grad.addColorStop(0.6, "#9333EA");
    grad.addColorStop(0.8, "#6B21A8");
    grad.addColorStop(1, "#1E0B36");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let y = 0; y < 256; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? "rgba(255, 255, 255, 0.22)" : "rgba(168, 85, 247, 0.25)";
      ctx.fillRect(0, y, 512, 2);
    }
  } else if (type === "community") {
    // Glowing lavender terrestrial world with continents & city lights
    ctx.fillStyle = "#1E1B4B";
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = "#6D28D9";
    for (let i = 0; i < 32; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 36 + 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#DDD6FE";
    for (let i = 0; i < 110; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
    }
  } else {
    // Dark indigo crystalline tech planet
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, "#09091B");
    grad.addColorStop(0.5, "#1E1B4B");
    grad.addColorStop(1, "#2E1065");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = "rgba(167, 139, 250, 0.4)";
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 512; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Helper: Generate procedural planetary ring texture
function createRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, "rgba(139, 92, 246, 0.05)");
  grad.addColorStop(0.18, "rgba(167, 139, 250, 0.75)");
  grad.addColorStop(0.42, "rgba(221, 214, 254, 0.95)");
  grad.addColorStop(0.52, "rgba(5, 5, 16, 0.15)"); // Cassini division gap
  grad.addColorStop(0.62, "rgba(139, 92, 246, 0.8)");
  grad.addColorStop(0.82, "rgba(34, 211, 238, 0.5)");
  grad.addColorStop(1, "rgba(139, 92, 246, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Helper: Generate Sun Corona Radial Glow Sprite Texture
function createSunCoronaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.2, "rgba(221, 214, 254, 0.85)");
  grad.addColorStop(0.45, "rgba(139, 92, 246, 0.45)");
  grad.addColorStop(0.7, "rgba(79, 70, 229, 0.18)");
  grad.addColorStop(1, "rgba(5, 5, 16, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

interface ProjectedLabel {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  visible: boolean;
  depth: number;
}

export default function SolarSystemCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Active hovered/tapped planet state
  const [hoveredPlanetIndex, setHoveredPlanetIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [labels, setLabels] = useState<ProjectedLabel[]>([]);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // References to keep event handlers fresh and avoid recreate overhead
  const hoveredIndexRef = useRef<number | null>(null);
  hoveredIndexRef.current = hoveredPlanetIndex;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. SCENE & CAMERA (Slightly elevated three-quarter perspective matching reference image)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050510");

    // Camera with 45 degree FOV positioned to give a majestic, sweeping perspective of the orbital plane
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(-8, 30, 52);
    camera.lookAt(0, -2, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Master Solar System Group with slight dramatic tilt
    const solarSystemGroup = new THREE.Group();
    solarSystemGroup.rotation.z = -0.06;
    solarSystemGroup.rotation.x = 0.08;
    scene.add(solarSystemGroup);

    // 3. LIGHTING
    // Central PointLight at (0,0,0) simulating intense Sun illumination
    const sunLight = new THREE.PointLight(0xfaf5ff, 5.5, 260, 1.0);
    sunLight.position.set(0, 0, 0);
    solarSystemGroup.add(sunLight);

    // Secondary subtle violet ambient fill so back sides of planets show soft purple depth
    const ambientLight = new THREE.AmbientLight(0x2e1065, 0.55);
    scene.add(ambientLight);

    // Directional rim light from top
    const dirLight = new THREE.DirectionalLight(0x8b5cf6, 0.9);
    dirLight.position.set(25, 45, 25);
    scene.add(dirLight);

    // 4. CENTRAL GLOWING SUN (LaunchByte Core)
    const sunGroup = new THREE.Group();
    solarSystemGroup.add(sunGroup);

    // Core incandescent sphere
    const sunCoreGeo = new THREE.SphereGeometry(3.6, 48, 48);
    const sunCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const sunCoreMesh = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    sunGroup.add(sunCoreMesh);

    // Inner vibrant energy shell
    const aura1Geo = new THREE.SphereGeometry(4.6, 32, 32);
    const aura1Mat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const aura1Mesh = new THREE.Mesh(aura1Geo, aura1Mat);
    sunGroup.add(aura1Mesh);

    const aura2Geo = new THREE.SphereGeometry(5.8, 32, 32);
    const aura2Mat = new THREE.MeshBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const aura2Mesh = new THREE.Mesh(aura2Geo, aura2Mat);
    sunGroup.add(aura2Mesh);

    // Large Soft Corona Glow Billboard Sprite
    const coronaTex = createSunCoronaTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    const coronaSprite = new THREE.Sprite(coronaMat);
    coronaSprite.scale.set(24, 24, 1);
    sunGroup.add(coronaSprite);

    // Central LaunchByte Icon Billboard inside the Sun core
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/brand/launchbyte-icon.png",
      (brandTex) => {
        brandTex.colorSpace = THREE.SRGBColorSpace;
        const brandGeo = new THREE.PlaneGeometry(3.8, 3.8);
        const brandMat = new THREE.MeshBasicMaterial({
          map: brandTex,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const brandMesh = new THREE.Mesh(brandGeo, brandMat);
        brandMesh.position.set(0, 0, 0.2);
        brandMesh.quaternion.copy(camera.quaternion);
        sunGroup.add(brandMesh);
      },
      undefined,
      (err) => console.warn("Sun brand icon fallback", err)
    );

    // 5. DISTANT SUBTLE STARFIELD
    const starCount = 550;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorViolet = new THREE.Color("#A78BFA");
    const colorCyan = new THREE.Color("#22D3EE");
    const colorWhite = new THREE.Color("#F8FAFC");

    for (let i = 0; i < starCount; i++) {
      const r = 130 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = Math.random() < 0.65 ? colorWhite : Math.random() < 0.82 ? colorViolet : colorCyan;
      starColors[i * 3] = chosenColor.r;
      starColors[i * 3 + 1] = chosenColor.g;
      starColors[i * 3 + 2] = chosenColor.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. CONCENTRIC ELLIPTICAL ORBITAL PATHS & 3D PLANETS
    interface PlanetRuntime {
      data: PlanetData;
      group: THREE.Group;
      mesh: THREE.Mesh;
      hitMesh: THREE.Mesh;
      orbitLine: THREE.Line;
      orbitMaterial: THREE.LineBasicMaterial;
      currentAngle: number;
      targetScale: number;
      currentScale: number;
      rotationSpeed: number;
      ringMesh?: THREE.Mesh;
    }

    const planetRuntimes: PlanetRuntime[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    PLANETS.forEach((p, idx) => {
      // Orbit Ring (Flat circular path on XZ plane, appears elliptical in perspective)
      const orbitPoints: THREE.Vector3[] = [];
      const segments = 160;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * p.orbitRadius, 0, Math.sin(theta) * p.orbitRadius));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(p.color),
        transparent: true,
        opacity: 0.32,
        linewidth: 1,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      solarSystemGroup.add(orbitLine);

      // Planet Group
      const pGroup = new THREE.Group();
      solarSystemGroup.add(pGroup);

      // 3D Planet Mesh
      const pGeo = new THREE.SphereGeometry(p.size, 40, 40);
      const pTex = createPlanetTexture(p.id);
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        roughness: 0.55,
        metalness: 0.25,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.rotation.z = p.tilt;
      pGroup.add(pMesh);

      // Ring for Planet 3 (Opportunities)
      let ringMesh: THREE.Mesh | undefined;
      if (p.hasRing) {
        const rGeo = new THREE.RingGeometry(p.size * 1.45, p.size * 2.65, 64);
        const rTex = createRingTexture();
        const rMat = new THREE.MeshStandardMaterial({
          map: rTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.35,
        });
        ringMesh = new THREE.Mesh(rGeo, rMat);
        ringMesh.rotation.x = Math.PI / 2.35;
        ringMesh.rotation.y = 0.25;
        pGroup.add(ringMesh);
      }

      // Invisible enlarged hit sphere for comfortable hover and click detection
      const hitGeo = new THREE.SphereGeometry(p.size * 1.6, 16, 16);
      const hitMat = new THREE.MeshBasicMaterial({
        visible: false,
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { planetIndex: idx };
      pGroup.add(hitMesh);
      interactiveMeshes.push(hitMesh);

      planetRuntimes.push({
        data: p,
        group: pGroup,
        mesh: pMesh,
        hitMesh,
        orbitLine,
        orbitMaterial: orbitMat,
        currentAngle: p.initialAngle,
        targetScale: 1,
        currentScale: 1,
        rotationSpeed: 0.85,
        ringMesh,
      });
    });

    // 7. RAYCASTING & INTERACTION
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const idx = hit.object.userData.planetIndex as number;
        if (hoveredIndexRef.current !== idx) {
          setHoveredPlanetIndex(idx);
          container.style.cursor = "pointer";
        }
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        if (hoveredIndexRef.current !== null) {
          setHoveredPlanetIndex(null);
          setTooltipPos(null);
          container.style.cursor = "default";
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.planetIndex as number;
        const targetRoute = PLANETS[idx].route;
        router.push(targetRoute);
      }
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("click", onClick);

    // 8. PAUSE WHEN TAB IS HIDDEN OR NOT IN VIEWPORT (100% GPU optimization)
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 9. ANIMATION LOOP WITH DELTA TIME
    let lastTime = performance.now();
    let animFrameId: number;

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);
      if (!isVisible) {
        lastTime = now;
        return;
      }

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Sun subtle core pulsation and slow rotation
      sunCoreMesh.rotation.y += 0.25 * delta;
      aura1Mesh.rotation.y -= 0.18 * delta;
      aura2Mesh.rotation.z += 0.12 * delta;

      // Update planets along orbital paths
      const currentHover = hoveredIndexRef.current;
      const updatedLabels: ProjectedLabel[] = [];

      planetRuntimes.forEach((pr, i) => {
        const isHovered = currentHover === i;

        // Orbital revolution: move angle by speed * delta
        pr.currentAngle += pr.data.speed * delta;
        const x = Math.cos(pr.currentAngle) * pr.data.orbitRadius;
        const z = Math.sin(pr.currentAngle) * pr.data.orbitRadius;
        pr.group.position.set(x, 0, z);

        // Axial spin on own tilted axis (accelerate slightly on hover)
        const spinMultiplier = isHovered ? 2.6 : 1;
        pr.mesh.rotation.y += pr.rotationSpeed * spinMultiplier * delta;

        // Smooth scale lerp
        pr.targetScale = isHovered ? 1.3 : 1.0;
        pr.currentScale += (pr.targetScale - pr.currentScale) * 10 * delta;
        pr.group.scale.setScalar(pr.currentScale);

        // Highlight orbital path when hovered
        const targetOpacity = isHovered ? 0.9 : 0.3;
        pr.orbitMaterial.opacity += (targetOpacity - pr.orbitMaterial.opacity) * 8 * delta;

        // Project 3D planet coordinate to 2D screen coordinate for HTML label overlay
        const worldPos = new THREE.Vector3();
        pr.group.getWorldPosition(worldPos);

        const projected = worldPos.clone().project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * width;
        const screenY = (-projected.y * 0.5 + 0.5) * height;

        // Check if visible within camera frustum and facing
        const inFront = projected.z < 1;
        updatedLabels.push({
          id: pr.data.id,
          name: pr.data.name,
          category: pr.data.category,
          x: screenX,
          y: screenY,
          visible: inFront && screenX > 20 && screenX < width - 20 && screenY > 20 && screenY < height - 20,
          depth: projected.z,
        });
      });

      setLabels(updatedLabels);
      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // 10. RESIZE OBSERVER
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 11. CLEANUP ON UNMOUNT (Prevent WebGL memory leaks)
    return () => {
      cancelAnimationFrame(animFrameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("click", onClick);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      coronaTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [router]);

  // Navigate on label click or keyboard selection
  const handleSelectPlanet = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  return (
    <div className="relative w-full h-[640px] sm:h-[740px] lg:h-[840px] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* WebGL Fallback Banner if unsupported */}
      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050510] text-center p-6">
          <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-violet-500/30 space-y-3">
            <Compass className="w-8 h-8 text-violet-400 mx-auto" />
            <h4 className="text-lg font-bold text-white">Interactive 3D Solar System</h4>
            <p className="text-sm text-slate-400">
              Your browser does not have WebGL enabled. You can still explore all LaunchByte destinations below.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {PLANETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(p.route)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/60 text-xs text-white border border-violet-500/40"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Anchored HTML Overlay Labels for 3D Planets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {labels.map((lbl, idx) => {
          const isHovered = hoveredPlanetIndex === idx;
          if (!lbl.visible) return null;

          // Fade label slightly when planet travels to the far back of the orbit
          const opacity = isHovered ? 1 : Math.max(0.4, 1 - (lbl.depth - 0.7) * 2.2);

          return (
            <div
              key={lbl.id}
              style={{
                transform: `translate3d(${lbl.x}px, ${lbl.y}px, 0)`,
                opacity,
              }}
              className="absolute left-0 top-0 transition-opacity duration-200 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => handleSelectPlanet(PLANETS[idx].route)}
                onMouseEnter={() => setHoveredPlanetIndex(idx)}
                onMouseLeave={() => setHoveredPlanetIndex(null)}
                aria-label={`Explore ${lbl.name}`}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all -translate-x-1/2 -translate-y-9 ${
                  isHovered
                    ? "bg-violet-950/95 border border-violet-400 shadow-xl shadow-violet-500/50 scale-110"
                    : "bg-slate-950/70 border border-violet-500/25 hover:border-violet-400/60"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PLANETS[idx].glowColor }}
                />
                <span className="text-[11px] font-bold tracking-wider text-slate-100 group-hover:text-white uppercase">
                  {lbl.name}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Interactive Hover Information Panel */}
      {hoveredPlanetIndex !== null && tooltipPos && (
        <div
          style={{
            left: Math.min(Math.max(tooltipPos.x + 20, 20), (mountRef.current?.clientWidth || 800) - 290),
            top: Math.max(tooltipPos.y - 75, 20),
          }}
          className="absolute z-30 pointer-events-auto w-64 p-4 rounded-2xl bg-[#09091B]/95 border border-violet-500/40 shadow-2xl shadow-violet-950/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
              {PLANETS[hoveredPlanetIndex].category}
            </span>
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: PLANETS[hoveredPlanetIndex].glowColor }}
            />
          </div>

          <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <span>{PLANETS[hoveredPlanetIndex].name}</span>
          </h4>

          <p className="text-xs text-[#B8BAD0] leading-relaxed my-2 font-normal">
            {PLANETS[hoveredPlanetIndex].description}
          </p>

          <button
            onClick={() => handleSelectPlanet(PLANETS[hoveredPlanetIndex].route)}
            className="w-full mt-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-1.5 group"
          >
            <span>Explore {PLANETS[hoveredPlanetIndex].name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Bottom Subtle Gradient Blend */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#050510] to-transparent pointer-events-none" />
    </div>
  );
}
