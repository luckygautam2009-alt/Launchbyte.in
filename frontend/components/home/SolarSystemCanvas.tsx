"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Compass } from "lucide-react";

export interface PlanetData {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  ring: number;
  angle: number;
  size: number;
  spin: number;
  color: string;
  glowColor: string;
  surface: "banded" | "earth" | "storm" | "rust" | "teal" | "ice" | "violet";
  hasRing?: boolean;
}

/**
 * Single source of truth for the universe. Every planet, label, and route
 * is rendered from this list exactly once.
 */
export const PLANETS: PlanetData[] = [
  {
    id: "hackathons",
    name: "Hackathons",
    category: "Competitive Builds",
    description: "Compete, collaborate, and ship ideas with other builders.",
    route: "/hackathons",
    ring: 1,
    angle: 0.42,
    size: 1.22,
    spin: 0.28,
    color: "#7C3AED",
    glowColor: "#C4B5FD",
    surface: "violet",
  },
  {
    id: "internships",
    name: "Internships",
    category: "Career Launchpad",
    description: "Find internships and grow with teams already building.",
    route: "/opportunities",
    ring: 2,
    angle: 3.55,
    size: 1.7,
    spin: 0.18,
    color: "#2563EB",
    glowColor: "#7DD3FC",
    surface: "earth",
  },
  {
    id: "opportunities",
    name: "Opportunities",
    category: "Fellowships and Grants",
    description: "Programs, grants, and open calls across the ecosystem.",
    route: "/opportunities",
    ring: 0,
    angle: 1.05,
    size: 0.96,
    spin: 0.32,
    color: "#6D28D9",
    glowColor: "#DDD6FE",
    surface: "banded",
  },
  {
    id: "workshops",
    name: "Workshops",
    category: "Hands-on Learning",
    description: "Short, practical sessions you can join and apply immediately.",
    route: "/events",
    ring: 2,
    angle: 5.45,
    size: 0.84,
    spin: 0.4,
    color: "#0284C7",
    glowColor: "#67E8F9",
    surface: "teal",
    hasRing: true,
  },
  {
    id: "events",
    name: "Events",
    category: "Live Gatherings",
    description: "Meetups, launches, and live builder events.",
    route: "/events",
    ring: 1,
    angle: 4.35,
    size: 1.08,
    spin: 0.24,
    color: "#EA580C",
    glowColor: "#FDBA74",
    surface: "rust",
  },
  {
    id: "ambassadors",
    name: "Ambassador Programs",
    category: "Campus Leadership",
    description: "Represent LaunchByte and grow a local builder community.",
    route: "/people",
    ring: 2,
    angle: 1.2,
    size: 1.16,
    spin: 0.22,
    color: "#0F766E",
    glowColor: "#5EEAD4",
    surface: "teal",
  },
  {
    id: "teams",
    name: "Team Building",
    category: "Crews and Collaborators",
    description: "Form a crew and build with people who match your pace.",
    route: "/teams",
    ring: 3,
    angle: 0.72,
    size: 1.56,
    spin: 0.16,
    color: "#1D4ED8",
    glowColor: "#93C5FD",
    surface: "banded",
    hasRing: true,
  },
  {
    id: "networking",
    name: "Networking",
    category: "Connections",
    description: "Meet founders, mentors, and peers beyond your campus.",
    route: "/network",
    ring: 1,
    angle: 2.55,
    size: 0.74,
    spin: 0.36,
    color: "#0E7490",
    glowColor: "#67E8F9",
    surface: "ice",
  },
  {
    id: "courses",
    name: "Free Courses",
    category: "Self-paced Learning",
    description: "Start learning with free courses picked for builders.",
    route: "/opportunities",
    ring: 0,
    angle: 3.35,
    size: 0.68,
    spin: 0.42,
    color: "#6366F1",
    glowColor: "#C7D2FE",
    surface: "ice",
  },
  {
    id: "certifications",
    name: "Certifications",
    category: "Proof of Skill",
    description: "Earn credentials you can show with your projects.",
    route: "/opportunities",
    ring: 0,
    angle: 5.15,
    size: 0.72,
    spin: 0.38,
    color: "#7E22CE",
    glowColor: "#E9D5FF",
    surface: "violet",
  },
  {
    id: "projects",
    name: "Projects",
    category: "Collaborative Labs",
    description: "Discover projects and contribute with other builders.",
    route: "/projects",
    ring: 3,
    angle: 2.75,
    size: 1.05,
    spin: 0.26,
    color: "#4338CA",
    glowColor: "#A5B4FC",
    surface: "storm",
  },
  {
    id: "community",
    name: "Community",
    category: "Builder Network",
    description: "A home for developers, designers, and campus innovators.",
    route: "/people",
    ring: 3,
    angle: 4.55,
    size: 1.02,
    spin: 0.2,
    color: "#6D28D9",
    glowColor: "#DDD6FE",
    surface: "earth",
  },
];

const RINGS = [
  { radius: 9.6, speed: 0.045, tilt: 0.05, roll: 0.02, color: "#A78BFA", opacity: 0.2 },
  { radius: 13.4, speed: 0.034, tilt: -0.06, roll: -0.025, color: "#818CF8", opacity: 0.16 },
  { radius: 17.4, speed: 0.026, tilt: 0.08, roll: 0.03, color: "#67E8F9", opacity: 0.14 },
  { radius: 21.6, speed: 0.018, tilt: -0.045, roll: 0.015, color: "#C4B5FD", opacity: 0.12 },
];

function makeTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createSunTexture() {
  return makeTexture((ctx, size) => {
    const mid = size / 2;
    const base = ctx.createRadialGradient(mid, mid, size * 0.08, mid, mid, mid);
    base.addColorStop(0, "#A78BFA");
    base.addColorStop(0.28, "#7C3AED");
    base.addColorStop(0.62, "#4C1D95");
    base.addColorStop(1, "#1E1B4B");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 14; i++) {
      const y = (i + 0.5) * (size / 14);
      ctx.strokeStyle = i % 3 === 0 ? "rgba(125, 211, 252, 0.16)" : "rgba(221, 214, 254, 0.14)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 12) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 1.4) * 12 + Math.sin(x * 0.008) * 6);
      }
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(mid, mid, size * 0.18, mid, mid, mid * 0.98);
    vignette.addColorStop(0, "rgba(8, 6, 24, 0)");
    vignette.addColorStop(1, "rgba(8, 6, 24, 0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
  });
}

function createCoronaTexture(inner: string, mid: string) {
  return makeTexture((ctx, size) => {
    const c = size / 2;
    const glow = ctx.createRadialGradient(c, c, size * 0.16, c, c, c);
    glow.addColorStop(0, "rgba(0,0,0,0)");
    glow.addColorStop(0.22, inner);
    glow.addColorStop(0.5, mid);
    glow.addColorStop(1, "rgba(5, 5, 16, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }, 256);
}

function createStarTexture() {
  return makeTexture((ctx, size) => {
    const c = size / 2;
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.35, "rgba(255,255,255,0.75)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }, 64);
}

function createPlanetTexture(planet: PlanetData) {
  return makeTexture((ctx, size) => {
    const rand = mulberry32(planet.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
    const paintBase = (stops: [number, string][]) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    };

    if (planet.surface === "earth") {
      paintBase([
        [0, "#0B1D4A"],
        [0.45, "#1D4ED8"],
        [1, "#172554"],
      ]);
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 ? "rgba(45, 212, 191, 0.55)" : "rgba(74, 222, 128, 0.4)";
        ctx.beginPath();
        ctx.ellipse(rand() * size, rand() * size, 30 + rand() * 70, 18 + rand() * 36, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planet.surface === "rust") {
      paintBase([
        [0, "#7C2D12"],
        [0.4, "#C2410C"],
        [0.7, "#EA580C"],
        [1, "#431407"],
      ]);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = "rgba(67, 20, 7, 0.45)";
        ctx.beginPath();
        ctx.arc(rand() * size, rand() * size, 16 + rand() * 40, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planet.surface === "teal") {
      paintBase([
        [0, "#042F2E"],
        [0.35, "#0F766E"],
        [0.62, "#14B8A6"],
        [1, "#083344"],
      ]);
      for (let y = 0; y < size; y += 18) {
        ctx.fillStyle = y % 36 === 0 ? "rgba(204, 251, 241, 0.16)" : "rgba(8, 47, 73, 0.18)";
        ctx.fillRect(0, y + Math.sin(y) * 4, size, 8);
      }
    } else if (planet.surface === "ice") {
      paintBase([
        [0, "#1E1B4B"],
        [0.4, "#6366F1"],
        [0.7, "#818CF8"],
        [1, "#312E81"],
      ]);
      ctx.strokeStyle = "rgba(224, 231, 255, 0.28)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(rand() * size, rand() * size);
        ctx.bezierCurveTo(rand() * size, rand() * size, rand() * size, rand() * size, rand() * size, rand() * size);
        ctx.stroke();
      }
    } else if (planet.surface === "storm") {
      paintBase([
        [0, "#1E1B4B"],
        [0.5, "#3730A3"],
        [1, "#1E1B4B"],
      ]);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = "rgba(165, 180, 252, 0.2)";
        ctx.beginPath();
        ctx.ellipse(rand() * size, rand() * size, 40 + rand() * 80, 10 + rand() * 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planet.surface === "violet") {
      paintBase([
        [0, "#2E1065"],
        [0.35, "#6D28D9"],
        [0.68, "#8B5CF6"],
        [1, "#1E1B4B"],
      ]);
      for (let y = 0; y < size; y += 16) {
        ctx.fillStyle = "rgba(237, 233, 254, 0.13)";
        ctx.fillRect(0, y, size, 6);
      }
    } else {
      paintBase([
        [0, "#312E81"],
        [0.3, "#4C1D95"],
        [0.55, "#7C3AED"],
        [0.78, "#C4B5FD"],
        [1, "#2E1065"],
      ]);
      for (let y = 0; y < size; y += 14) {
        ctx.fillStyle = y % 28 === 0 ? "rgba(255,255,255,0.08)" : "rgba(30, 27, 75, 0.18)";
        ctx.fillRect(0, y, size, 7);
      }
    }

    const shade = ctx.createLinearGradient(0, 0, size, 0);
    shade.addColorStop(0, "rgba(5, 5, 16, 0.35)");
    shade.addColorStop(0.45, "rgba(5, 5, 16, 0)");
    shade.addColorStop(1, "rgba(255, 255, 255, 0.08)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, size, size);
  }, 512);
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ProjectedLabel {
  id: string;
  x: number;
  y: number;
  w: number;
  depth: number;
}

export default function SolarSystemCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    const root = container?.parentElement;
    if (!container || !root) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const test = document.createElement("canvas");
      if (!test.getContext("webgl2") && !test.getContext("webgl")) {
        setWebglSupported(false);
        return;
      }
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const webgl = renderer;
    let disposed = false;
    container.replaceChildren();

    let width = container.clientWidth || root.clientWidth || 800;
    let height = container.clientHeight || 780;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050510");

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 400);
    const pointer = new THREE.Vector2(0, 0);
    const pan = { x: 0, y: 0 };
    const panTarget = { x: 0, y: 0 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motionEnabled = !reduceMotion.matches;

    const onMotionChange = () => {
      motionEnabled = !reduceMotion.matches;
    };
    reduceMotion.addEventListener("change", onMotionChange);

    const system = new THREE.Group();
    system.rotation.x = -0.58;
    system.rotation.z = -0.05;
    scene.add(system);

    const fitSystem = () => {
      const aspect = width / Math.max(height, 1);
      const scale = THREE.MathUtils.clamp(aspect * 0.78, 0.5, 1);
      system.scale.setScalar(scale);
      const distance = aspect < 0.85 ? 64 : aspect < 1.2 ? 56 : 50;
      camera.fov = aspect < 0.85 ? 40 : 35;
      camera.aspect = aspect;
      camera.position.set(pan.x, distance * 0.2 + pan.y, distance);
      camera.lookAt(0, -0.2, 0);
      camera.updateProjectionMatrix();
    };

    scene.add(new THREE.AmbientLight(0x3b0764, 0.7));
    const sunLight = new THREE.PointLight(0xc4b5fd, 28, 140, 2);
    system.add(sunLight);
    const rim = new THREE.DirectionalLight(0x67e8f9, 1.1);
    rim.position.set(-18, 24, 20);
    scene.add(rim);

    const textures: THREE.Texture[] = [];
    const sunTexture = createSunTexture();
    const coronaTexture = createCoronaTexture("rgba(167, 139, 250, 0.42)", "rgba(79, 70, 229, 0.12)");
    const coronaOuter = createCoronaTexture("rgba(56, 189, 248, 0.16)", "rgba(49, 46, 129, 0.05)");
    const starTexture = createStarTexture();
    textures.push(sunTexture, coronaTexture, coronaOuter, starTexture);

    const sunGroup = new THREE.Group();
    system.add(sunGroup);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(2.05, 48, 48), sunMaterial);
    sunGroup.add(sunMesh);

    const innerGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: coronaTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.9,
      })
    );
    innerGlow.scale.set(11, 11, 1);
    sunGroup.add(innerGlow);

    const outerGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: coronaOuter,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.75,
      })
    );
    outerGlow.scale.set(18, 18, 1);
    sunGroup.add(outerGlow);

    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const palette = [new THREE.Color("#F8FAFC"), new THREE.Color("#C4B5FD"), new THREE.Color("#67E8F9")];
    for (let i = 0; i < starCount; i++) {
      const radius = 90 + Math.random() * 160;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.55;
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
      const color = palette[i % 9 === 0 ? 2 : i % 4 === 0 ? 1 : 0];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        map: starTexture,
        size: 1.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
    );
    scene.add(stars);

    interface PlanetRuntime {
      data: PlanetData;
      anchor: THREE.Group;
      spin: THREE.Group;
      material: THREE.MeshStandardMaterial;
      angle: number;
      scale: number;
    }

    const runtimes: PlanetRuntime[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    const orbitMaterials: THREE.LineBasicMaterial[] = [];

    RINGS.forEach((ring, ringIndex) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.x = ring.tilt;
      ringGroup.rotation.z = ring.roll;
      system.add(ringGroup);

      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 160; i++) {
        const theta = (i / 160) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * ring.radius, 0, Math.sin(theta) * ring.radius));
      }
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(ring.color),
        transparent: true,
        opacity: ring.opacity,
        depthWrite: false,
      });
      orbitMaterials.push(orbitMaterial);
      ringGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial));

      PLANETS.filter((planet) => planet.ring === ringIndex).forEach((planet) => {
        const anchor = new THREE.Group();
        ringGroup.add(anchor);
        const spin = new THREE.Group();
        spin.rotation.z = (ringIndex - 1.5) * 0.08;
        anchor.add(spin);

        const texture = createPlanetTexture(planet);
        textures.push(texture);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          color: new THREE.Color("#ffffff"),
          roughness: 0.62,
          metalness: 0.08,
          emissive: new THREE.Color(planet.color),
          emissiveIntensity: 0.28,
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.size, 40, 32), material);
        spin.add(mesh);

        if (planet.hasRing) {
          const ringMesh = new THREE.Mesh(
            new THREE.RingGeometry(planet.size * 1.38, planet.size * 1.92, 64),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(planet.glowColor),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.42,
              depthWrite: false,
            })
          );
          ringMesh.rotation.x = Math.PI / 2.35;
          spin.add(ringMesh);
        }

        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(planet.size * 1.45, 16, 12),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hit.userData = { id: planet.id };
        spin.add(hit);
        hitMeshes.push(hit);

        runtimes.push({
          data: planet,
          anchor,
          spin,
          material,
          angle: planet.angle,
          scale: 1,
        });
      });
    });

    webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 800 ? 1.5 : 1.75));
    webgl.setSize(width, height);
    webgl.outputColorSpace = THREE.SRGBColorSpace;
    webgl.toneMapping = THREE.ACESFilmicToneMapping;
    webgl.toneMappingExposure = 1.05;
    webgl.domElement.style.display = "block";
    webgl.domElement.style.width = "100%";
    webgl.domElement.style.height = "100%";
    container.appendChild(webgl.domElement);
    fitSystem();

    const labels = new Map<string, HTMLButtonElement>();
    const hoveredId = { current: null as string | null };
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(-10, -10);
    const world = new THREE.Vector3();
    const projected = new THREE.Vector3();

    const setHover = (id: string | null) => {
      hoveredId.current = id;
      container.style.cursor = id ? "pointer" : "default";
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.x = ndc.x;
      pointer.y = ndc.y;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      setHover(hits.length ? (hits[0].object.userData.id as string) : null);
    };

    const onPointerLeave = (event: PointerEvent) => {
      pointer.x = 0;
      pointer.y = 0;
      const next = event.relatedTarget;
      if (next instanceof Element && next.closest("[data-planet-id]")) return;
      setHover(null);
    };

    const onClick = () => {
      if (!hoveredId.current) return;
      const planet = PLANETS.find((item) => item.id === hoveredId.current);
      if (planet) routerRef.current.push(planet.route);
    };

    const buttonCleanups: Array<() => void> = [];
    PLANETS.forEach((planet) => {
      const button = root.querySelector<HTMLButtonElement>(`[data-planet-id="${planet.id}"]`);
      if (!button) return;
      labels.set(planet.id, button);
      const enter = () => setHover(planet.id);
      const leave = () => {
        if (hoveredId.current === planet.id) setHover(null);
      };
      button.addEventListener("pointerenter", enter);
      button.addEventListener("pointerleave", leave);
      button.addEventListener("focus", enter);
      button.addEventListener("blur", leave);
      buttonCleanups.push(() => {
        button.removeEventListener("pointerenter", enter);
        button.removeEventListener("pointerleave", leave);
        button.removeEventListener("focus", enter);
        button.removeEventListener("blur", leave);
      });
    });

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("click", onClick);

    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth || width;
      height = container.clientHeight || height;
      webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 800 ? 1.5 : 1.75));
      webgl.setSize(width, height);
      fitSystem();
    });
    resizeObserver.observe(container);

    let frame = 0;
    let last = performance.now();
    const scratch: ProjectedLabel[] = [];

    const animate = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;

      if (motionEnabled) {
        panTarget.x = pointer.x * 1.4;
        panTarget.y = pointer.y * 0.7;
        pan.x += (panTarget.x - pan.x) * 1.6 * delta;
        pan.y += (panTarget.y - pan.y) * 1.6 * delta;
        const distance = camera.position.z;
        camera.position.x = pan.x;
        camera.position.y = distance * 0.2 + pan.y;
        camera.lookAt(0, -0.2, 0);
        sunMesh.rotation.y += delta * 0.08;
        const pulse = 1 + Math.sin(now * 0.0006) * 0.025;
        innerGlow.scale.setScalar(11 * pulse);
        outerGlow.scale.setScalar(18 * (1 + Math.sin(now * 0.0004) * 0.02));
        stars.rotation.y += delta * 0.004;
      }

      scratch.length = 0;
      const activeRing = runtimes.find((item) => item.data.id === hoveredId.current)?.data.ring;
      sunGroup.getWorldPosition(world);
      projected.copy(world).project(camera);
      const sunX = (projected.x * 0.5 + 0.5) * width;
      const sunY = (-projected.y * 0.5 + 0.5) * height;

      runtimes.forEach((runtime) => {
        const ring = RINGS[runtime.data.ring];
        if (motionEnabled) runtime.angle += ring.speed * delta;
        const bob = motionEnabled ? Math.sin(now * 0.00045 + runtime.data.angle) * 0.16 : 0;
        runtime.anchor.position.set(Math.cos(runtime.angle) * ring.radius, bob, Math.sin(runtime.angle) * ring.radius);
        if (motionEnabled) runtime.spin.rotation.y += runtime.data.spin * delta;

        const hovered = hoveredId.current === runtime.data.id;
        const targetScale = hovered ? 1.14 : 1;
        runtime.scale += (targetScale - runtime.scale) * (motionEnabled ? 6 * delta : 1);
        runtime.spin.scale.setScalar(runtime.scale);
        const targetGlow = hovered ? 0.72 : 0.28;
        runtime.material.emissiveIntensity += (targetGlow - runtime.material.emissiveIntensity) * (motionEnabled ? 6 * delta : 1);

        runtime.anchor.getWorldPosition(world);
        projected.copy(world).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        const dx = x - sunX;
        const dy = y - sunY;
        const length = Math.hypot(dx, dy) || 1;
        const nudge = 34 + runtime.data.size * 16;
        scratch.push({
          id: runtime.data.id,
          x: x + (dx / length) * nudge,
          y: y + (dy / length) * nudge,
          w: Math.min(188, runtime.data.name.length * 6.5 + 28),
          depth: projected.z,
        });
      });

      orbitMaterials.forEach((material, index) => {
        const target = activeRing === index ? 0.42 : RINGS[index].opacity;
        material.opacity += (target - material.opacity) * (motionEnabled ? 5 * delta : 1);
      });

      const padBottom = Math.max(108, height * 0.2);
      for (let pass = 0; pass < 7; pass++) {
        for (let i = 0; i < scratch.length; i++) {
          for (let j = i + 1; j < scratch.length; j++) {
            const a = scratch[i];
            const b = scratch[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const gapX = (a.w + b.w) / 2 + 10;
            const gapY = 30;
            if (Math.abs(dx) < gapX && Math.abs(dy) < gapY) {
              const overlapX = gapX - Math.abs(dx);
              const overlapY = gapY - Math.abs(dy);
              if (overlapX < overlapY) {
                const push = overlapX * 0.5 + 0.4;
                const sign = dx === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dx);
                a.x -= sign * push;
                b.x += sign * push;
              } else {
                const push = overlapY * 0.5 + 0.4;
                const sign = dy === 0 ? 1 : Math.sign(dy);
                a.y -= sign * push;
                b.y += sign * push;
              }
            }
          }
        }
        scratch.forEach((label) => {
          const half = label.w / 2 + 8;
          label.x = THREE.MathUtils.clamp(label.x, half, width - half);
          label.y = THREE.MathUtils.clamp(label.y, 18, height - padBottom);
        });
      }

      scratch.forEach((label, index) => {
        const button = labels.get(label.id);
        if (!button) return;
        const hovered = hoveredId.current === label.id;
        const opacity = label.depth > 1 ? 0 : hovered ? 1 : 0.92;
        button.style.transform = `translate3d(${label.x}px, ${label.y}px, 0) translate(-50%, -50%) scale(${hovered ? 1.05 : 1})`;
        button.style.opacity = String(opacity);
        button.style.zIndex = String(20 + Math.round((1 - label.depth) * 10) + (hovered ? 5 : 0));
        button.style.borderColor = hovered ? "rgba(196, 181, 253, 0.85)" : "rgba(255, 255, 255, 0.16)";
        button.style.boxShadow = hovered ? "0 0 22px rgba(139, 92, 246, 0.45)" : "0 8px 24px rgba(0, 0, 0, 0.18)";
        button.dataset.ready = "true";
        if (index === 0) button.dataset.frame = "live";
      });

      webgl.render(scene, camera);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onMotionChange);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("click", onClick);
      buttonCleanups.forEach((cleanup) => cleanup());

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else if (material) material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      webgl.dispose();
      webgl.domElement.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-[700px] sm:h-[800px] lg:h-[900px] overflow-hidden bg-[#050510]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-72 w-72 rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div ref={mountRef} className="absolute inset-0" />

      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-lg rounded-2xl border border-violet-500/30 bg-[#09091B] p-6 text-center">
            <Compass className="mx-auto mb-3 h-7 w-7 text-violet-300" />
            <p className="text-sm text-slate-300">
              This browser cannot render the interactive universe. The destinations are still available below.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {PLANETS.map((planet) => (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => router.push(planet.route)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white"
                >
                  {planet.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {webglSupported && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {PLANETS.map((planet) => (
            <button
              key={planet.id}
              type="button"
              data-planet-id={planet.id}
              aria-label={`${planet.name}. ${planet.description}`}
              onClick={() => router.push(planet.route)}
              className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-white/15 bg-[#0b0b1d]/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white opacity-0 shadow-lg backdrop-blur-md transition-[border-color,box-shadow] duration-300 pointer-events-auto sm:text-xs"
            >
              {planet.name}
            </button>
          ))}
        </div>
      )}

      <div
        className="pointer-events-none absolute bottom-0 left-1/2 z-30 w-[min(520px,78vw)] -translate-x-1/2 overflow-hidden"
        style={{
          height: "clamp(156px, 24vw, 220px)",
          maskImage:
            "linear-gradient(to top, #000 68%, transparent), linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to top, #000 68%, transparent), linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <img
          src="/brand/universe-foreground-astronaut.png"
          alt=""
          draggable={false}
          className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none"
        />
      </div>
    </div>
  );
}
