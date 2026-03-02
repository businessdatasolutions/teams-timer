/**
 * Cosmic objects – generates different visual scenes per universe type.
 * Each type produces a distinct 2D-canvas look inspired by cosmos.html's
 * Three.js nebula clouds, black holes, crystal clusters, and mana suns.
 */

import { UniverseConfig } from './universes';

interface CosmicRing {
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  speed: number;
  color: [number, number, number];
  alpha: number;
}

interface GlowOrb {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
  pulse: number;
  pulseSpeed: number;
}

/** A single triangular facet of a crystal shard */
interface Facet {
  /** Centroid vertex */
  p0: { x: number; y: number };
  /** Outer vertex i */
  p1: { x: number; y: number };
  /** Outer vertex i+1 */
  p2: { x: number; y: number };
  /** Outward-facing normal angle (radians) */
  normalAngle: number;
  /** Brightness 0..1 from Lambertian shading */
  baseBrightness: number;
  /** Pre-computed fill color */
  baseColor: [number, number, number];
  /** Whether this facet gets a specular highlight */
  isSpecular: boolean;
}

/** A single irregular crystal shard within a cluster */
interface Shard {
  /** Offset from cluster centre */
  ox: number;
  oy: number;
  /** Irregular polygon vertices (relative to shard centre) */
  vertices: { x: number; y: number }[];
  /** Centroid of the polygon */
  centroid: { x: number; y: number };
  /** Triangular facets (triangle-fan from centroid) */
  facets: Facet[];
  /** Rotation angle of this individual shard */
  angle: number;
  alpha: number;
}

/** A cluster of shards + prismatic light rays */
interface CrystalCluster {
  x: number;
  y: number;
  /** Base Y before bob offset */
  baseY: number;
  shards: Shard[];
  /** Current rotation angle (slerp toward target) */
  currentAngle: number;
  /** Target rotation angle */
  targetAngle: number;
  /** Base colour of cluster */
  color: [number, number, number];
  /** Outgoing dispersed light rays (7 colours × 3 sub-rays) */
  rays: LightRay[];
  pulse: number;
  pulseSpeed: number;
  /** Vertical bob phase */
  bobPhase: number;
  /** Incoming white light beam */
  incomingBeam: {
    angle: number;
    length: number;
    startWidth: number;
    endWidth: number;
  };
}

interface LightRay {
  angle: number;
  length: number;
  width: number;
  /** Spectral hue (degrees) */
  hue: number;
  /** Explicit RGB colour matching crystal.ts beam palette */
  color: [number, number, number];
  alpha: number;
}

// --- Cosmic Devourer (blackhole) data ---

/** Spaghettified matter streak spiraling into the hole */
interface Streak {
  angle: number;        // current orbital angle
  radius: number;       // current distance from center
  startRadius: number;  // respawn distance
  speed: number;        // angular velocity
  infall: number;       // radial infall speed
  length: number;       // tail arc length
  hue: number;          // warm colour hue
  alpha: number;
}

/** Captured photon orbiting chaotically near the horizon */
interface Photon {
  angle: number;
  radius: number;
  speed: number;
  wobble: number;       // orbital eccentricity
  wobblePhase: number;
  size: number;
}

/** Expanding gravitational wave ring */
interface GravWave {
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

/** Spacetime grid line (radial or concentric) */
interface GridLine {
  type: 'radial' | 'concentric';
  angle: number;    // for radial lines
  radius: number;   // for concentric lines
  alpha: number;
}

// --- Aurora data ---

interface AuroraPoint {
  baseX: number;
  y: number;
  /** Primary wave */
  freq: number;
  amp: number;
  phase: number;
  /** Secondary fine-detail wave */
  freq2: number;
  amp2: number;
  phase2: number;
}

interface AuroraCurtain {
  points: AuroraPoint[];
  /** Base hue in degrees (shifts over time) */
  hue: number;
  hueSpeed: number;
  /** Saturation and lightness */
  sat: number;
  light: number;
  alpha: number;
  /** Width varies per-point via widthWave */
  baseWidth: number;
  widthWavePhase: number;
  widthWaveSpeed: number;
  /** Depth layer (0=back, 1=front) affects brightness and speed */
  depth: number;
}

interface AuroraShimmer {
  x: number;
  y: number;
  size: number;
  alpha: number;
  fadePhase: number;
  fadeSpeed: number;
  /** Drifts slowly upward */
  vy: number;
  hue: number;
}

// --- Mycelium data ---

interface MyceliumNode {
  x: number;
  y: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
  color: [number, number, number];
}

interface MyceliumTendril {
  from: number;  // node index
  to: number;    // node index
  cx: number;    // bezier control point
  cy: number;
  alpha: number;
  travelers: TravelingLight[];
}

interface TravelingLight {
  t: number;       // 0-1 position along tendril
  speed: number;
  size: number;
  alpha: number;
}

// --- Rift data ---

interface RiftSegment {
  x: number;
  y: number;
}

interface RiftParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  /** Index along rift path to respawn near */
  spawnIdx: number;
}

// --- Vortex data ---

interface VortexArm {
  angleOffset: number;
  turns: number;
  maxRadius: number;
  width: number;
  alpha: number;
}

interface VortexParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
}

// --- Ghost data ---

interface GhostWisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  fadePhase: number;
  fadeSpeed: number;
  color: [number, number, number];
}

/** Compute a facet's fill colour by blending cluster colour with wavelength-dispersed hue */
function computeFacetColor(
  brightness: number,
  hueShift: number,
  clusterColor: [number, number, number],
): [number, number, number] {
  // HSL-to-RGB at full saturation for the dispersed hue
  const h = hueShift / 60;
  const x = 1 - Math.abs(h % 2 - 1);
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 1)      { r1 = 1; g1 = x; }
  else if (h < 2) { r1 = x; g1 = 1; }
  else if (h < 3) { g1 = 1; b1 = x; }
  else if (h < 4) { g1 = x; b1 = 1; }
  else if (h < 5) { r1 = x; b1 = 1; }
  else            { r1 = 1; b1 = x; }

  // 40% cluster base colour + 60% dispersed hue, modulated by brightness
  const blend = 0.6;
  return [
    Math.min(255, Math.round((clusterColor[0] / 255 * (1 - blend) + r1 * blend) * brightness * 255)),
    Math.min(255, Math.round((clusterColor[1] / 255 * (1 - blend) + g1 * blend) * brightness * 255)),
    Math.min(255, Math.round((clusterColor[2] / 255 * (1 - blend) + b1 * blend) * brightness * 255)),
  ];
}

export class ShootingStarSystem {
  private rings: CosmicRing[] = [];
  private orbs: GlowOrb[] = [];
  private crystals: CrystalCluster[] = [];
  private blackHoleRadius = 0;
  private universeType: string = 'nebula';

  // Cosmic Devourer state
  private streaks: Streak[] = [];
  private photons: Photon[] = [];
  private gravWaves: GravWave[] = [];
  private gridLines: GridLine[] = [];
  private gravWaveCooldown = 0;
  private bhPulse = 0;
  private bhCx = 0;
  private bhCy = 0;

  // Aurora state
  private auroraCurtains: AuroraCurtain[] = [];
  private auroraShimmers: AuroraShimmer[] = [];
  private auroraTime = 0;

  // Mycelium state
  private myceliumNodes: MyceliumNode[] = [];
  private myceliumTendrils: MyceliumTendril[] = [];

  // Rift state
  private riftPath: RiftSegment[] = [];
  private riftParticles: RiftParticle[] = [];
  private riftPulse = 0;

  // Vortex state
  private vortexArms: VortexArm[] = [];
  private vortexParticles: VortexParticle[] = [];
  private vortexAngle = 0;
  private vortexCx = 0;
  private vortexCy = 0;

  // Ghost state
  private ghostWisps: GhostWisp[] = [];

  // Earth state
  private earthRadius = 0;
  private earthCx = 0;
  private earthCy = 0;
  private earthRotation = 0;
  private earthClouds: { angle: number; arcLen: number; y: number; speed: number; alpha: number }[] = [];
  private moonOrbitAngle = 0;
  private moonOrbitRadius = 0;
  private moonRadius = 0;
  private earthContinents: { lon: number; lat: number; size: number; color: [number, number, number] }[] = [];

  scale = 1; // 0→1, used for warp fade-in/out

  generate(config: UniverseConfig, w: number, h: number): void {
    this.rings = [];
    this.orbs = [];
    this.crystals = [];
    this.streaks = [];
    this.photons = [];
    this.gravWaves = [];
    this.gridLines = [];
    this.blackHoleRadius = 0;
    this.gravWaveCooldown = 0;
    this.auroraCurtains = [];
    this.auroraShimmers = [];
    this.auroraTime = 0;
    this.myceliumNodes = [];
    this.myceliumTendrils = [];
    this.riftPath = [];
    this.riftParticles = [];
    this.riftPulse = 0;
    this.vortexArms = [];
    this.vortexParticles = [];
    this.vortexAngle = 0;
    this.ghostWisps = [];
    this.earthRadius = 0;
    this.earthClouds = [];
    this.earthContinents = [];
    this.moonOrbitAngle = 0;
    this.universeType = config.type;
    this.scale = 0; // start scaled down, will lerp to 1

    const cx = w / 2;
    const cy = h / 2;

    switch (config.type) {
      case 'nebula':
        this._genNebula(cx, cy, w, h, config.color);
        break;
      case 'blackhole':
        this._genBlackhole(cx, cy, w, h, config.color);
        break;
      case 'crystal':
        this._genCrystals(w, h, config.color);
        break;
      case 'mana':
        this._genMana(cx, cy, w, h, config.color);
        break;
      case 'aurora':
        this._genAurora(w, h, config.color);
        break;
      case 'mycelium':
        this._genMycelium(w, h, config.color);
        break;
      case 'rift':
        this._genRift(w, h, config.color);
        break;
      case 'vortex':
        this._genVortex(cx, cy, w, h, config.color);
        break;
      case 'ghost':
        this._genGhost(w, h, config.color);
        break;
      case 'earth':
        this._genEarth(cx, cy, w, h, config.color);
        break;
    }
  }

  private _genNebula(_cx: number, _cy: number, w: number, h: number, color: [number, number, number]): void {
    // Multiple large glowing blobs
    for (let i = 0; i < 5; i++) {
      this.orbs.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h * (0.15 + Math.random() * 0.7),
        radius: 80 + Math.random() * 120,
        color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.0008 + Math.random() * 0.001,
      });
    }
  }

  private _genBlackhole(cx: number, cy: number, w: number, h: number, color: [number, number, number]): void {
    this.bhCx = cx;
    this.bhCy = cy;
    const dim = Math.min(w, h);
    this.blackHoleRadius = dim * 0.055;

    // --- Spacetime grid ---
    // Radial lines
    for (let i = 0; i < 12; i++) {
      this.gridLines.push({
        type: 'radial',
        angle: (Math.PI * 2 / 12) * i,
        radius: 0,
        alpha: 0.06 + Math.random() * 0.04,
      });
    }
    // Concentric rings
    for (let i = 1; i <= 6; i++) {
      this.gridLines.push({
        type: 'concentric',
        angle: 0,
        radius: dim * 0.05 * i + dim * 0.06,
        alpha: 0.05 + Math.random() * 0.03,
      });
    }

    // --- Accretion rings (thinner, more numerous) ---
    for (let i = 0; i < 8; i++) {
      const baseR = dim * (0.08 + i * 0.025);
      this.rings.push({
        cx, cy,
        radiusX: baseR,
        radiusY: baseR * (0.2 + Math.random() * 0.15),
        angle: (Math.PI / 8) * i + Math.random(),
        speed: 0.005 + Math.random() * 0.006,
        color,
        alpha: 0.12 + Math.random() * 0.08,
      });
    }

    // --- Spaghettified matter streaks ---
    const warmHues = [0, 15, 30, 40, 50, 20, 10, 35]; // reds/oranges/yellows
    for (let i = 0; i < 8; i++) {
      this.streaks.push({
        angle: Math.random() * Math.PI * 2,
        radius: dim * (0.15 + Math.random() * 0.2),
        startRadius: dim * (0.15 + Math.random() * 0.2),
        speed: 0.008 + Math.random() * 0.012,
        infall: 0.03 + Math.random() * 0.04,
        length: 0.4 + Math.random() * 0.8,
        hue: warmHues[i % warmHues.length],
        alpha: 0.3 + Math.random() * 0.3,
      });
    }

    // --- Captured photons ---
    for (let i = 0; i < 20; i++) {
      this.photons.push({
        angle: Math.random() * Math.PI * 2,
        radius: this.blackHoleRadius * (1.3 + Math.random() * 0.8),
        speed: 0.02 + Math.random() * 0.03,
        wobble: 0.15 + Math.random() * 0.25,
        wobblePhase: Math.random() * Math.PI * 2,
        size: 1 + Math.random() * 2,
      });
    }

    // --- Surrounding glow orb ---
    this.orbs.push({
      x: cx, y: cy,
      radius: dim * 0.3,
      color,
      pulse: 0,
      pulseSpeed: 0.0004,
    });
  }

  private _genCrystals(w: number, h: number, color: [number, number, number]): void {
    // Beam colours for light dispersion (crystal.ts lines 174-182)
    const beamColors: { hue: number; rgb: [number, number, number] }[] = [
      { hue: 350, rgb: [255, 0, 68] },
      { hue: 30,  rgb: [255, 136, 0] },
      { hue: 55,  rgb: [255, 234, 0] },
      { hue: 140, rgb: [0, 255, 68] },
      { hue: 200, rgb: [0, 170, 255] },
      { hue: 250, rgb: [34, 0, 255] },
      { hue: 280, rgb: [170, 0, 255] },
    ];

    /** Generate an irregular shard polygon (2D analogue of crystal.ts icosahedron distortion) */
    const genShardVertices = (baseW: number, height: number): { x: number; y: number }[] => {
      const count = 10 + Math.floor(Math.random() * 5);
      const verts: { x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const a = t * Math.PI * 2 - Math.PI / 2;
        let x = Math.cos(a) * baseW * 0.5;
        let y = Math.sin(a) * height * 0.5;
        // Taper ends (crystal.ts line 109)
        const normY = Math.abs(y) / (height * 0.5);
        const taper = Math.max(0.1, 1.0 - normY * 0.7);
        x *= taper;
        // Perturb (crystal.ts lines 110-111)
        x *= 1 + (Math.random() - 0.5) * 0.4;
        y *= 1 + (Math.random() - 0.5) * 0.15;
        // Snap for distinct facets (crystal.ts lines 114-115)
        x = Math.round(x * 3) / 3;
        verts.push({ x, y });
      }
      return verts;
    };

    for (let ci = 0; ci < 4; ci++) {
      const cx = w * (0.1 + Math.random() * 0.8);
      const cy = h * (0.1 + Math.random() * 0.8);
      const shardCount = 4 + Math.floor(Math.random() * 5);
      const shards: Shard[] = [];

      for (let s = 0; s < shardCount; s++) {
        const spread = 8 + Math.random() * 15;
        const ang = (Math.PI * 2 / shardCount) * s + (Math.random() - 0.5) * 0.6;
        const bw = 6 + Math.random() * 16;
        const ht = 30 + Math.random() * 70;
        const vertices = genShardVertices(bw, ht);
        // Compute centroid of the shard polygon
        const centroid = {
          x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
          y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
        };

        // Light direction (incoming beam from top-left)
        const lightAngle = -Math.PI * 0.75;
        const lightDx = Math.cos(lightAngle);
        const lightDy = Math.sin(lightAngle);
        const reflectionAngle = lightAngle + Math.PI;

        // Triangle-fan facets from centroid to each edge
        const facets: Facet[] = [];
        for (let fi = 0; fi < vertices.length; fi++) {
          const p1 = vertices[fi];
          const p2 = vertices[(fi + 1) % vertices.length];

          // Facet normal = outward perpendicular to the outer edge
          const edgeDx = p2.x - p1.x;
          const edgeDy = p2.y - p1.y;
          const normalAngle = Math.atan2(-edgeDx, edgeDy);
          const nx = Math.cos(normalAngle);
          const ny = Math.sin(normalAngle);

          // Lambertian brightness
          const dot = nx * lightDx + ny * lightDy;
          const baseBrightness = 0.15 + Math.max(0, dot) * 0.85;

          // Wavelength dispersion: map normal angle to hue 0..360
          const normalNorm = ((normalAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const hueShift = (normalNorm / (Math.PI * 2)) * 360;

          // Specular: facets whose normal is near the light reflection direction
          const angleDiff = Math.abs(normalAngle - reflectionAngle) % (Math.PI * 2);
          const isSpecular = Math.min(angleDiff, Math.PI * 2 - angleDiff) < 0.4;

          facets.push({
            p0: centroid,
            p1, p2,
            normalAngle,
            baseBrightness,
            baseColor: computeFacetColor(baseBrightness, hueShift, color),
            isSpecular,
          });
        }

        shards.push({
          ox: Math.cos(ang) * spread,
          oy: Math.sin(ang) * spread,
          vertices,
          centroid,
          facets,
          angle: ang + (Math.random() - 0.5) * 0.8,
          alpha: 0.25 + Math.random() * 0.3,
        });
      }

      // Incoming white light beam from top-left
      const incomingBeam = {
        angle: -Math.PI * 0.75 + (Math.random() - 0.5) * 0.3,
        length: 120 + Math.random() * 80,
        startWidth: 1 + Math.random() * 2,
        endWidth: 6 + Math.random() * 6,
      };

      // 21 outgoing rainbow rays (7 colours × 3 sub-rays)
      const rays: LightRay[] = [];
      const baseOutAngle = incomingBeam.angle + Math.PI;
      for (const bc of beamColors) {
        for (let sub = 0; sub < 3; sub++) {
          const scatter = (Math.random() - 0.5) * Math.PI * 1.2;
          rays.push({
            angle: baseOutAngle + scatter,
            length: 80 + Math.random() * 160,
            width: 0.5 + Math.random() * 3,
            hue: bc.hue,
            color: bc.rgb,
            alpha: 0.04 + Math.random() * 0.04,
          });
        }
      }

      this.crystals.push({
        x: cx,
        y: cy,
        baseY: cy,
        shards,
        currentAngle: Math.random() * Math.PI * 2,
        targetAngle: Math.random() * Math.PI * 2,
        color,
        rays,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.0015 + Math.random() * 0.001,
        bobPhase: Math.random() * Math.PI * 2,
        incomingBeam,
      });

      // Internal glow orb per cluster
      this.orbs.push({
        x: cx, y: cy,
        radius: 25 + Math.random() * 30,
        color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.002 + Math.random() * 0.001,
      });
    }
  }

  private _genMana(cx: number, cy: number, w: number, h: number, color: [number, number, number]): void {
    // Central glowing sun
    this.orbs.push({
      x: cx, y: cy,
      radius: Math.min(w, h) * 0.08,
      color,
      pulse: 0,
      pulseSpeed: 0.001,
    });

    // Outer glow
    this.orbs.push({
      x: cx, y: cy,
      radius: Math.min(w, h) * 0.2,
      color,
      pulse: Math.PI,
      pulseSpeed: 0.0005,
    });

    // Concentric rotating rings
    for (let i = 0; i < 4; i++) {
      const baseR = Math.min(w, h) * (0.12 + i * 0.05);
      this.rings.push({
        cx, cy,
        radiusX: baseR,
        radiusY: baseR,
        angle: Math.random() * Math.PI,
        speed: 0.003 + i * 0.002,
        color,
        alpha: 0.12 + Math.random() * 0.08,
      });
    }
  }

  private _genAurora(w: number, h: number, _color: [number, number, number]): void {
    // Convert base color to approximate hue for HSL-based shifting
    const [r, g, b] = _color;
    const baseHue = Math.atan2(
      Math.sqrt(3) * (g - b),
      2 * r - g - b,
    ) * (180 / Math.PI);

    // Multiple depth layers: back layers are wider/slower, front are narrower/faster
    const layers = 3;
    const curtainsPerLayer = [3, 3, 2]; // back, mid, front

    for (let layer = 0; layer < layers; layer++) {
      const depth = layer / (layers - 1); // 0=back, 1=front
      const count = curtainsPerLayer[layer];

      for (let i = 0; i < count; i++) {
        const baseX = w * (0.05 + ((i + 0.5) / count) * 0.9) + (Math.random() - 0.5) * w * 0.15;
        const pointCount = 20 + Math.floor(depth * 10); // more detail on front layers
        const points: AuroraPoint[] = [];

        for (let p = 0; p < pointCount; p++) {
          const yFrac = p / (pointCount - 1);
          points.push({
            baseX: baseX + Math.sin(yFrac * Math.PI * 2) * 15, // slight S-curve
            y: yFrac * h,
            freq: 0.001 + Math.random() * 0.002 + depth * 0.001,
            amp: 30 + Math.random() * 50 - depth * 15,
            phase: Math.random() * Math.PI * 2,
            freq2: 0.004 + Math.random() * 0.006,
            amp2: 5 + Math.random() * 12,
            phase2: Math.random() * Math.PI * 2,
          });
        }

        // Each curtain gets a hue offset from the base, drifting over time
        const hueOffset = (layer * 40 + i * 25 + (Math.random() - 0.5) * 30);
        this.auroraCurtains.push({
          points,
          hue: (baseHue + hueOffset + 360) % 360,
          hueSpeed: 0.003 + Math.random() * 0.005 * (Math.random() < 0.5 ? 1 : -1),
          sat: 70 + Math.random() * 20,
          light: 55 + depth * 10,
          alpha: (0.04 + Math.random() * 0.04) * (0.6 + depth * 0.4),
          baseWidth: (60 - depth * 25) + Math.random() * 30,
          widthWavePhase: Math.random() * Math.PI * 2,
          widthWaveSpeed: 0.0005 + Math.random() * 0.0008,
          depth,
        });
      }
    }

    // Shimmer particles scattered across the aurora area
    for (let i = 0; i < 30; i++) {
      this.auroraShimmers.push({
        x: w * (0.05 + Math.random() * 0.9),
        y: Math.random() * h,
        size: 1 + Math.random() * 2.5,
        alpha: 0,
        fadePhase: Math.random() * Math.PI * 2,
        fadeSpeed: 0.002 + Math.random() * 0.003,
        vy: -(0.005 + Math.random() * 0.015),
        hue: (baseHue + Math.random() * 80 - 40 + 360) % 360,
      });
    }
  }

  private _genMycelium(w: number, h: number, color: [number, number, number]): void {
    const nodeCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nodeCount; i++) {
      this.myceliumNodes.push({
        x: w * (0.1 + Math.random() * 0.8),
        y: h * (0.1 + Math.random() * 0.8),
        radius: 15 + Math.random() * 25,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.001 + Math.random() * 0.001,
        color,
      });
    }
    // Connect nearby nodes with tendrils
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = this.myceliumNodes[i].x - this.myceliumNodes[j].x;
        const dy = this.myceliumNodes[i].y - this.myceliumNodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(w, h) * 0.45;
        if (dist < maxDist) {
          const mx = (this.myceliumNodes[i].x + this.myceliumNodes[j].x) / 2;
          const my = (this.myceliumNodes[i].y + this.myceliumNodes[j].y) / 2;
          const travelers: TravelingLight[] = [];
          const travelerCount = 1 + Math.floor(Math.random() * 2);
          for (let t = 0; t < travelerCount; t++) {
            travelers.push({
              t: Math.random(),
              speed: 0.0003 + Math.random() * 0.0004,
              size: 2 + Math.random() * 2,
              alpha: 0.6 + Math.random() * 0.4,
            });
          }
          this.myceliumTendrils.push({
            from: i,
            to: j,
            cx: mx + (Math.random() - 0.5) * dist * 0.4,
            cy: my + (Math.random() - 0.5) * dist * 0.4,
            alpha: 0.08 + Math.random() * 0.08,
            travelers,
          });
        }
      }
    }
  }

  private _genRift(w: number, h: number, color: [number, number, number]): void {
    // Generate jagged crack path from upper-left to lower-right
    const segments = 12 + Math.floor(Math.random() * 6);
    const startX = w * (0.1 + Math.random() * 0.15);
    const startY = h * (0.1 + Math.random() * 0.15);
    const endX = w * (0.75 + Math.random() * 0.15);
    const endY = h * (0.75 + Math.random() * 0.15);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;
      // Jagged offsets (larger in middle, smaller at ends)
      const jag = Math.sin(t * Math.PI) * 60;
      this.riftPath.push({
        x: baseX + (Math.random() - 0.5) * jag,
        y: baseY + (Math.random() - 0.5) * jag,
      });
    }

    // Energy particles leaking from the rift
    for (let i = 0; i < 20; i++) {
      const idx = Math.floor(Math.random() * this.riftPath.length);
      const seg = this.riftPath[idx];
      this.riftParticles.push({
        x: seg.x + (Math.random() - 0.5) * 10,
        y: seg.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: Math.random() * 3000,
        maxLife: 2000 + Math.random() * 2000,
        size: 1.5 + Math.random() * 3,
        spawnIdx: idx,
      });
    }

    // Ambient glow orb along the rift center
    const midSeg = this.riftPath[Math.floor(this.riftPath.length / 2)];
    this.orbs.push({
      x: midSeg.x, y: midSeg.y,
      radius: Math.min(w, h) * 0.25,
      color,
      pulse: 0,
      pulseSpeed: 0.0006,
    });
  }

  private _genVortex(cx: number, cy: number, w: number, h: number, color: [number, number, number]): void {
    this.vortexCx = cx;
    this.vortexCy = cy;
    const dim = Math.min(w, h);

    // Spiral arms
    const armCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < armCount; i++) {
      this.vortexArms.push({
        angleOffset: (Math.PI * 2 / armCount) * i,
        turns: 1.2 + Math.random() * 0.5,
        maxRadius: dim * (0.3 + Math.random() * 0.1),
        width: 2 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.1,
      });
    }

    // Orbital particles
    for (let i = 0; i < 15; i++) {
      this.vortexParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: dim * (0.05 + Math.random() * 0.3),
        speed: 0.003 + Math.random() * 0.005,
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }

    // Central glow
    this.orbs.push({
      x: cx, y: cy,
      radius: dim * 0.12,
      color,
      pulse: 0,
      pulseSpeed: 0.0008,
    });

    // Outer halo
    this.orbs.push({
      x: cx, y: cy,
      radius: dim * 0.35,
      color,
      pulse: Math.PI,
      pulseSpeed: 0.0004,
    });
  }

  private _genGhost(w: number, h: number, color: [number, number, number]): void {
    const wispCount = 8 + Math.floor(Math.random() * 3);
    for (let i = 0; i < wispCount; i++) {
      // Shift color slightly per wisp for variety
      const cr = Math.max(0, Math.min(255, color[0] + (Math.random() - 0.5) * 40));
      const cg = Math.max(0, Math.min(255, color[1] + (Math.random() - 0.5) * 40));
      const cb = Math.max(0, Math.min(255, color[2] + (Math.random() - 0.5) * 40));
      this.ghostWisps.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.015,
        vy: (Math.random() - 0.5) * 0.015,
        radiusX: 40 + Math.random() * 80,
        radiusY: 20 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0003,
        alpha: 0.03 + Math.random() * 0.05,
        fadePhase: Math.random() * Math.PI * 2,
        fadeSpeed: 0.0003 + Math.random() * 0.0004,
        color: [cr, cg, cb],
      });
    }
  }

  private _genEarth(cx: number, cy: number, w: number, h: number, _color: [number, number, number]): void {
    const dim = Math.min(w, h);
    this.earthRadius = dim * 0.15;
    this.earthCx = cx;
    this.earthCy = cy;
    this.earthRotation = 0;
    this.moonOrbitRadius = this.earthRadius * 3.5;
    this.moonRadius = this.earthRadius * 0.27;
    this.moonOrbitAngle = Math.random() * Math.PI * 2;

    // Generate continent-like patches (longitude/latitude offsets on the sphere)
    const continentDefs: { lon: number; lat: number; size: number; color: [number, number, number] }[] = [
      { lon: -0.3, lat: 0.2, size: 0.35, color: [50, 120, 50] },   // Americas-ish
      { lon: -0.2, lat: -0.15, size: 0.2, color: [60, 130, 55] },   // S. America-ish
      { lon: 0.3, lat: 0.3, size: 0.4, color: [55, 115, 45] },      // Eurasia-ish
      { lon: 0.35, lat: -0.1, size: 0.3, color: [140, 130, 70] },   // Africa-ish
      { lon: 0.7, lat: -0.35, size: 0.2, color: [130, 120, 60] },   // Australia-ish
      { lon: 0.0, lat: 0.45, size: 0.15, color: [200, 210, 220] },  // Arctic-ish
      { lon: 0.0, lat: -0.45, size: 0.2, color: [210, 220, 230] },  // Antarctic-ish
    ];
    this.earthContinents = continentDefs;

    // Cloud bands
    for (let i = 0; i < 6; i++) {
      this.earthClouds.push({
        angle: Math.random() * Math.PI * 2,
        arcLen: 0.4 + Math.random() * 0.8,
        y: (Math.random() - 0.5) * 1.6,  // -0.8 to 0.8 normalized
        speed: 0.00015 + Math.random() * 0.0002,
        alpha: 0.15 + Math.random() * 0.2,
      });
    }
  }

  update(dt: number, _w: number, _h: number): void {
    const scale = dt / 16.67;

    for (const r of this.rings) {
      r.angle += r.speed * scale;
    }
    for (const o of this.orbs) {
      o.pulse += o.pulseSpeed * dt;
    }
    for (const c of this.crystals) {
      // Slerp-like rotation: lerp toward target, pick new when close
      const diff = Math.atan2(
        Math.sin(c.targetAngle - c.currentAngle),
        Math.cos(c.targetAngle - c.currentAngle),
      );
      c.currentAngle += diff * Math.min(1, 1.5 * dt / 1000);
      if (Math.abs(diff) < 0.1) {
        c.targetAngle = Math.random() * Math.PI * 2;
      }
      // Vertical bob
      c.bobPhase += dt * 0.001;
      c.y = c.baseY + Math.sin(c.bobPhase) * 8;
      c.pulse += c.pulseSpeed * dt;
    }

    // --- Blackhole-specific animation ---
    if (this.universeType === 'blackhole') {
      this.bhPulse += dt * 0.002;

      // Spaghettified streaks spiral inward
      for (const s of this.streaks) {
        s.angle += s.speed * scale;
        s.radius -= s.infall * scale;
        // Respawn when consumed
        if (s.radius < this.blackHoleRadius * 0.8) {
          s.radius = s.startRadius;
          s.angle = Math.random() * Math.PI * 2;
        }
      }

      // Captured photons orbit chaotically
      for (const p of this.photons) {
        p.angle += p.speed * scale;
        p.wobblePhase += 0.03 * scale;
      }

      // Gravitational wave pulses
      this.gravWaveCooldown -= dt;
      if (this.gravWaveCooldown <= 0) {
        this.gravWaveCooldown = 2500 + Math.random() * 2000;
        const dim = Math.max(_w, _h);
        this.gravWaves.push({
          radius: this.blackHoleRadius,
          maxRadius: dim * 0.5,
          speed: 0.08 + Math.random() * 0.04,
          alpha: 0.2,
        });
      }

      for (let i = this.gravWaves.length - 1; i >= 0; i--) {
        const gw = this.gravWaves[i];
        gw.radius += gw.speed * dt;
        gw.alpha = 0.2 * (1 - gw.radius / gw.maxRadius);
        if (gw.radius >= gw.maxRadius) {
          this.gravWaves.splice(i, 1);
        }
      }
    }

    // --- Aurora animation ---
    if (this.universeType === 'aurora') {
      this.auroraTime += dt;
      for (const curtain of this.auroraCurtains) {
        curtain.hue = (curtain.hue + curtain.hueSpeed * dt + 360) % 360;
        curtain.widthWavePhase += curtain.widthWaveSpeed * dt;
        for (const p of curtain.points) {
          p.phase += p.freq * dt;
          p.phase2 += p.freq2 * dt;
        }
      }
      for (const s of this.auroraShimmers) {
        s.y += s.vy * dt;
        s.fadePhase += s.fadeSpeed * dt;
        s.alpha = Math.max(0, Math.sin(s.fadePhase) * 0.7);
        // Respawn when off-screen
        if (s.y < -10) {
          s.y = _h + 10;
          s.x = _w * (0.05 + Math.random() * 0.9);
        }
      }
    }

    // --- Mycelium animation ---
    if (this.universeType === 'mycelium') {
      for (const node of this.myceliumNodes) {
        node.pulse += node.pulseSpeed * dt;
      }
      for (const tendril of this.myceliumTendrils) {
        for (const trav of tendril.travelers) {
          trav.t += trav.speed * dt;
          if (trav.t > 1) trav.t -= 1;
        }
      }
    }

    // --- Rift animation ---
    if (this.universeType === 'rift') {
      this.riftPulse += dt * 0.002;
      for (const p of this.riftParticles) {
        p.x += p.vx * scale;
        p.y += p.vy * scale;
        p.life += dt;
        if (p.life >= p.maxLife) {
          // Respawn near the crack
          const seg = this.riftPath[p.spawnIdx];
          p.x = seg.x + (Math.random() - 0.5) * 10;
          p.y = seg.y + (Math.random() - 0.5) * 10;
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = (Math.random() - 0.5) * 0.3;
          p.life = 0;
        }
      }
    }

    // --- Vortex animation ---
    if (this.universeType === 'vortex') {
      this.vortexAngle += 0.0008 * scale;
      for (const p of this.vortexParticles) {
        p.angle += p.speed * scale;
      }
    }

    // --- Ghost animation ---
    if (this.universeType === 'ghost') {
      for (const wisp of this.ghostWisps) {
        wisp.x += wisp.vx * dt;
        wisp.y += wisp.vy * dt;
        wisp.rotation += wisp.rotSpeed * dt;
        wisp.fadePhase += wisp.fadeSpeed * dt;
        // Wrap around screen edges
        if (wisp.x < -wisp.radiusX) wisp.x = _w + wisp.radiusX;
        if (wisp.x > _w + wisp.radiusX) wisp.x = -wisp.radiusX;
        if (wisp.y < -wisp.radiusY) wisp.y = _h + wisp.radiusY;
        if (wisp.y > _h + wisp.radiusY) wisp.y = -wisp.radiusY;
      }
    }

    // --- Earth animation ---
    if (this.universeType === 'earth') {
      this.earthRotation += 0.0003 * scale;
      this.moonOrbitAngle += 0.0008 * scale;
      for (const cloud of this.earthClouds) {
        cloud.angle += cloud.speed * dt;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.scale <= 0.01) return;

    const prevOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';

    ctx.save();
    // Scale from center
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-cx, -cy);

    // Glowing orbs
    for (const o of this.orbs) {
      const pulseFactor = 0.7 + Math.sin(o.pulse) * 0.3;
      const r = o.radius * pulseFactor;
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
      const [cr, cg, cb] = o.color;
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.3)`);
      grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.1)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x - r, o.y - r, r * 2, r * 2);
    }

    // --- Cosmic Devourer blackhole rendering ---
    if (this.universeType === 'blackhole' && this.blackHoleRadius > 0) {
      this._renderBlackhole(ctx);
    }

    // Rotating rings
    for (const r of this.rings) {
      ctx.save();
      ctx.translate(r.cx, r.cy);
      ctx.rotate(r.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, r.radiusX, r.radiusY, 0, 0, Math.PI * 2);
      const [cr, cg, cb] = r.color;
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Crystal clusters — dual-layer shards with light dispersion beams
    for (const cluster of this.crystals) {
      ctx.save();
      ctx.translate(cluster.x, cluster.y);
      ctx.rotate(cluster.currentAngle);

      const pf = 0.7 + Math.sin(cluster.pulse) * 0.3; // pulse factor

      // --- 1. Incoming white beam (tapered, behind everything) ---
      const beam = cluster.incomingBeam;
      const bsx = Math.cos(beam.angle) * beam.length;
      const bsy = Math.sin(beam.angle) * beam.length;
      const perp = beam.angle + Math.PI / 2;
      const pc = Math.cos(perp);
      const ps = Math.sin(perp);

      ctx.beginPath();
      ctx.moveTo(bsx + pc * beam.startWidth * 0.5, bsy + ps * beam.startWidth * 0.5);
      ctx.lineTo(bsx - pc * beam.startWidth * 0.5, bsy - ps * beam.startWidth * 0.5);
      ctx.lineTo(-pc * beam.endWidth * 0.5, -ps * beam.endWidth * 0.5);
      ctx.lineTo(pc * beam.endWidth * 0.5, ps * beam.endWidth * 0.5);
      ctx.closePath();
      const bGrad = ctx.createLinearGradient(bsx, bsy, 0, 0);
      bGrad.addColorStop(0, 'rgba(255,255,255,0)');
      bGrad.addColorStop(0.3, `rgba(255,255,255,${0.06 * pf})`);
      bGrad.addColorStop(1, `rgba(255,255,255,${0.08 * pf})`);
      ctx.fillStyle = bGrad;
      ctx.fill();

      // --- 2. Outgoing rainbow rays (21 sub-rays, behind shards) ---
      for (const ray of cluster.rays) {
        const [cr, cg, cb] = ray.color;
        const ra = ray.alpha * pf;
        const rEnd = ray.length * pf;

        ctx.save();
        ctx.rotate(ray.angle);

        const grad = ctx.createLinearGradient(0, 0, rEnd, 0);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${ra})`);
        grad.addColorStop(0.15, `rgba(${cr},${cg},${cb},${ra * 0.7})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

        ctx.beginPath();
        ctx.moveTo(0, -0.5);
        ctx.lineTo(rEnd, -ray.width * 0.5);
        ctx.lineTo(rEnd, ray.width * 0.5);
        ctx.lineTo(0, 0.5);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // --- 3. Shards: faceted crystal rendering ---
      for (const shard of cluster.shards) {
        ctx.save();
        ctx.translate(shard.ox, shard.oy);
        ctx.rotate(shard.angle);

        // Draw each triangular facet with per-facet shading
        for (const facet of shard.facets) {
          const [fr, fg, fb] = facet.baseColor;

          ctx.beginPath();
          ctx.moveTo(facet.p0.x, facet.p0.y);
          ctx.lineTo(facet.p1.x, facet.p1.y);
          ctx.lineTo(facet.p2.x, facet.p2.y);
          ctx.closePath();

          // Gradient from centroid (dark) to outer edge midpoint (bright)
          const midEdgeX = (facet.p1.x + facet.p2.x) / 2;
          const midEdgeY = (facet.p1.y + facet.p2.y) / 2;
          const grad = ctx.createLinearGradient(
            facet.p0.x, facet.p0.y,
            midEdgeX, midEdgeY,
          );
          const dk = 0.4; // dark factor for centroid side
          grad.addColorStop(0, `rgba(${Math.round(fr * dk)},${Math.round(fg * dk)},${Math.round(fb * dk)},${0.92 * pf})`);
          grad.addColorStop(1, `rgba(${fr},${fg},${fb},${0.88 * pf})`);
          ctx.fillStyle = grad;
          ctx.fill();

          // Thin dark edge between facets
          ctx.strokeStyle = `rgba(10,10,20,${0.5 * pf})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Specular highlight on select facets
          if (facet.isSpecular) {
            const specGrad = ctx.createRadialGradient(
              midEdgeX, midEdgeY, 0,
              midEdgeX, midEdgeY, 6,
            );
            specGrad.addColorStop(0, `rgba(255,255,255,${0.7 * pf})`);
            specGrad.addColorStop(0.3, `rgba(200,220,255,${0.3 * pf})`);
            specGrad.addColorStop(1, 'rgba(200,220,255,0)');
            ctx.fillStyle = specGrad;
            ctx.fill();
          }
        }

        // Outer edge glow (clearcoat effect)
        ctx.beginPath();
        for (let i = 0; i < shard.vertices.length; i++) {
          const v = shard.vertices[i];
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(180,200,255,${0.35 * pf})`;
        ctx.lineWidth = 1.0;
        ctx.shadowColor = 'rgba(180,200,255,0.3)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      ctx.restore();
    }

    // --- end crystal clusters ---

    // Mana sun bright core
    if (this.universeType === 'mana' && this.orbs.length > 0) {
      const sun = this.orbs[0];
      const [cr, cg, cb] = sun.color;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      const coreR = sun.radius * 0.4;
      const sunGrad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, coreR);
      sunGrad.addColorStop(0, `rgba(255,255,255,0.9)`);
      sunGrad.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.6)`);
      sunGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = sunGrad;
      ctx.arc(sun.x, sun.y, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Aurora rendering ---
    if (this.universeType === 'aurora') {
      this._renderAurora(ctx);
    }

    // --- Mycelium rendering ---
    if (this.universeType === 'mycelium') {
      this._renderMycelium(ctx);
    }

    // --- Rift rendering ---
    if (this.universeType === 'rift') {
      this._renderRift(ctx);
    }

    // --- Vortex rendering ---
    if (this.universeType === 'vortex') {
      this._renderVortex(ctx);
    }

    // --- Ghost rendering ---
    if (this.universeType === 'ghost') {
      this._renderGhost(ctx);
    }

    // --- Earth rendering ---
    if (this.universeType === 'earth') {
      this._renderEarth(ctx);
    }

    ctx.restore();
    ctx.globalCompositeOperation = prevOp;
  }

  /** Full Cosmic Devourer rendering (called within the scale transform) */
  private _renderBlackhole(ctx: CanvasRenderingContext2D): void {
    const bx = this.bhCx;
    const by = this.bhCy;
    const hr = this.blackHoleRadius;
    const pulse = Math.sin(this.bhPulse) * 0.5 + 0.5;

    // 1. Spacetime distortion grid
    ctx.globalCompositeOperation = 'lighter';
    for (const line of this.gridLines) {
      if (line.type === 'radial') {
        // Radial line that curves inward near the hole
        ctx.beginPath();
        const outerR = hr * 7;
        const steps = 30;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const r = hr * 1.2 + (outerR - hr * 1.2) * t;
          // Warp: angle bends toward the hole at close range
          const warp = (1 - t) * (1 - t) * 0.4;
          const a = line.angle + warp;
          const px = bx + Math.cos(a) * r;
          const py = by + Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(100,140,255,${line.alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else {
        // Concentric ring — distorted (squeezed near the hole)
        const distort = 1 - (hr / line.radius) * 0.3;
        ctx.beginPath();
        ctx.ellipse(bx, by, line.radius, line.radius * distort, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100,140,255,${line.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // 2. Gravitational wave expanding rings
    for (const gw of this.gravWaves) {
      if (gw.alpha <= 0) continue;
      ctx.beginPath();
      ctx.arc(bx, by, gw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140,180,255,${gw.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Spaghettified matter streaks
    for (const s of this.streaks) {
      const tailAngle = s.angle - s.length;
      const steps = 20;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = tailAngle + (s.angle - tailAngle) * t;
        // Radius shrinks along the streak toward the head
        const r = s.radius + (s.startRadius - s.radius) * (1 - t) * 0.3;
        const px = bx + Math.cos(a) * r;
        const py = by + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const grad = ctx.createLinearGradient(
        bx + Math.cos(tailAngle) * s.radius,
        by + Math.sin(tailAngle) * s.radius,
        bx + Math.cos(s.angle) * s.radius,
        by + Math.sin(s.angle) * s.radius,
      );
      grad.addColorStop(0, `hsla(${s.hue},90%,60%,0)`);
      grad.addColorStop(0.5, `hsla(${s.hue},90%,65%,${s.alpha * 0.6})`);
      grad.addColorStop(1, `hsla(${s.hue},95%,75%,${s.alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.shadowColor = `hsla(${s.hue},90%,60%,0.4)`;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Event horizon with pulsing dark-energy edge
    ctx.globalCompositeOperation = 'source-over';

    // Dark energy edge glow (pulsing)
    const edgeGlow = hr * (1.3 + pulse * 0.2);
    const edgeGrad = ctx.createRadialGradient(bx, by, hr * 0.8, bx, by, edgeGlow);
    edgeGrad.addColorStop(0, 'rgba(0,0,0,1)');
    edgeGrad.addColorStop(0.6, 'rgba(0,0,0,0.95)');
    edgeGrad.addColorStop(0.8, `rgba(60,0,20,${0.3 + pulse * 0.2})`);
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(bx, by, edgeGlow, 0, Math.PI * 2);
    ctx.fillStyle = edgeGrad;
    ctx.fill();

    // Solid black event horizon
    ctx.beginPath();
    ctx.arc(bx, by, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // 5. Captured photon halo
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.photons) {
      const wobbleR = p.radius + Math.sin(p.wobblePhase) * p.radius * p.wobble;
      const px = bx + Math.cos(p.angle) * wobbleR;
      const py = by + Math.sin(p.angle) * wobbleR;
      const alpha = 0.5 + Math.sin(p.wobblePhase * 2) * 0.3;

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,230,255,${alpha})`;
      ctx.shadowColor = 'rgba(200,220,255,0.6)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private _renderAurora(ctx: CanvasRenderingContext2D): void {
    // Sort back-to-front by depth
    const sorted = [...this.auroraCurtains].sort((a, b) => a.depth - b.depth);

    for (const curtain of sorted) {
      const h = curtain.hue;
      const s = curtain.sat;
      const l = curtain.light;
      const widthMod = 0.7 + Math.sin(curtain.widthWavePhase) * 0.3;

      // Build center spine and per-point width
      const spine: { x: number; y: number; w: number; hue: number }[] = [];
      for (let i = 0; i < curtain.points.length; i++) {
        const p = curtain.points[i];
        const yFrac = i / (curtain.points.length - 1);
        const wave1 = Math.sin(p.phase) * p.amp;
        const wave2 = Math.sin(p.phase2) * p.amp2;
        const x = p.baseX + wave1 + wave2;
        // Width varies along height — wider in the middle
        const heightEnvelope = Math.sin(yFrac * Math.PI);
        const w = curtain.baseWidth * widthMod * (0.3 + heightEnvelope * 0.7);
        // Hue shifts along the curtain height
        const localHue = (h + yFrac * 30 - 15 + Math.sin(p.phase * 0.5) * 10 + 360) % 360;
        spine.push({ x, y: p.y, w, hue: localHue });
      }

      // Draw filled ribbon with per-segment color strips
      for (let i = 0; i < spine.length - 1; i++) {
        const s0 = spine[i];
        const s1 = spine[i + 1];
        const yFrac = i / (spine.length - 1);
        // Vertical fade: transparent at top and bottom edges
        const vFade = Math.sin(yFrac * Math.PI);
        const localAlpha = curtain.alpha * vFade;
        if (localAlpha < 0.002) continue;

        const midHue = (s0.hue + s1.hue) / 2;

        // Outer glow layer
        ctx.beginPath();
        ctx.moveTo(s0.x - s0.w * 0.5, s0.y);
        ctx.lineTo(s1.x - s1.w * 0.5, s1.y);
        ctx.lineTo(s1.x + s1.w * 0.5, s1.y);
        ctx.lineTo(s0.x + s0.w * 0.5, s0.y);
        ctx.closePath();
        ctx.fillStyle = `hsla(${midHue},${s}%,${l}%,${localAlpha * 0.5})`;
        ctx.shadowColor = `hsla(${midHue},${s}%,${l + 10}%,${localAlpha})`;
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner bright core (narrower, brighter)
        const coreW = 0.3;
        ctx.beginPath();
        ctx.moveTo(s0.x - s0.w * coreW, s0.y);
        ctx.lineTo(s1.x - s1.w * coreW, s1.y);
        ctx.lineTo(s1.x + s1.w * coreW, s1.y);
        ctx.lineTo(s0.x + s0.w * coreW, s0.y);
        ctx.closePath();
        ctx.fillStyle = `hsla(${midHue},${s - 10}%,${l + 15}%,${localAlpha * 0.8})`;
        ctx.fill();

        // Hot white center line (very narrow, highest intensity)
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.strokeStyle = `hsla(${midHue},40%,90%,${localAlpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Shimmer particles
    for (const s of this.auroraShimmers) {
      if (s.alpha < 0.01) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},80%,80%,${s.alpha})`;
      ctx.shadowColor = `hsla(${s.hue},80%,70%,${s.alpha * 0.5})`;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private _renderMycelium(ctx: CanvasRenderingContext2D): void {
    // Tendrils
    for (const tendril of this.myceliumTendrils) {
      const from = this.myceliumNodes[tendril.from];
      const to = this.myceliumNodes[tendril.to];
      const [cr, cg, cb] = from.color;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(tendril.cx, tendril.cy, to.x, to.y);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${tendril.alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.3)`;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Traveling lights along the tendril
      for (const trav of tendril.travelers) {
        const t = trav.t;
        const invT = 1 - t;
        // Quadratic bezier point
        const px = invT * invT * from.x + 2 * invT * t * tendril.cx + t * t * to.x;
        const py = invT * invT * from.y + 2 * invT * t * tendril.cy + t * t * to.y;
        ctx.beginPath();
        ctx.arc(px, py, trav.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${trav.alpha})`;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},0.6)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Nodes
    for (const node of this.myceliumNodes) {
      const pf = 0.7 + Math.sin(node.pulse) * 0.3;
      const r = node.radius * pf;
      const [cr, cg, cb] = node.color;
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.4)`);
      grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.15)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(node.x - r, node.y - r, r * 2, r * 2);

      // Bright center dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2 + pf * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.5 * pf})`;
      ctx.fill();
    }
  }

  private _renderRift(ctx: CanvasRenderingContext2D): void {
    if (this.riftPath.length < 2) return;
    const pulse = Math.sin(this.riftPulse) * 0.5 + 0.5;

    // Get color from the orb (ambient glow)
    const orbColor = this.orbs.length > 0 ? this.orbs[this.orbs.length - 1].color : [255, 30, 60] as [number, number, number];
    const [cr, cg, cb] = orbColor;

    // Outer glow pass
    ctx.beginPath();
    ctx.moveTo(this.riftPath[0].x, this.riftPath[0].y);
    for (let i = 1; i < this.riftPath.length; i++) {
      ctx.lineTo(this.riftPath[i].x, this.riftPath[i].y);
    }
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.08 + pulse * 0.04})`;
    ctx.lineWidth = 12;
    ctx.shadowColor = `rgba(${cr},${cg},${cb},0.4)`;
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(this.riftPath[0].x, this.riftPath[0].y);
    for (let i = 1; i < this.riftPath.length; i++) {
      ctx.lineTo(this.riftPath[i].x, this.riftPath[i].y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + pulse * 0.1})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgba(${cr},${cg},${cb},0.6)`;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Energy particles
    for (const p of this.riftParticles) {
      const lifeRatio = 1 - p.life / p.maxLife;
      const alpha = lifeRatio * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.4)`;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private _renderVortex(ctx: CanvasRenderingContext2D): void {
    const vcx = this.vortexCx;
    const vcy = this.vortexCy;
    const color = this.orbs.length > 0 ? this.orbs[0].color : [40, 100, 255] as [number, number, number];
    const [cr, cg, cb] = color;

    // Spiral arms
    for (const arm of this.vortexArms) {
      const steps = 80;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = this.vortexAngle + arm.angleOffset + t * arm.turns * Math.PI * 2;
        const radius = t * arm.maxRadius;
        const px = vcx + Math.cos(angle) * radius;
        const py = vcy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${arm.alpha})`;
      ctx.lineWidth = arm.width;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.3)`;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Orbital particles
    for (const p of this.vortexParticles) {
      const px = vcx + Math.cos(p.angle + this.vortexAngle) * p.radius;
      const py = vcy + Math.sin(p.angle + this.vortexAngle) * p.radius;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${p.alpha})`;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private _renderGhost(ctx: CanvasRenderingContext2D): void {
    for (const wisp of this.ghostWisps) {
      const fadeFactor = 0.5 + Math.sin(wisp.fadePhase) * 0.5;
      const alpha = wisp.alpha * fadeFactor;
      if (alpha < 0.005) continue;

      const [cr, cg, cb] = wisp.color;
      ctx.save();
      ctx.translate(wisp.x, wisp.y);
      ctx.rotate(wisp.rotation);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, wisp.radiusX);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
      grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;

      // Draw as a scaled ellipse
      ctx.scale(1, wisp.radiusY / wisp.radiusX);
      ctx.beginPath();
      ctx.arc(0, 0, wisp.radiusX, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private _renderEarth(ctx: CanvasRenderingContext2D): void {
    const ex = this.earthCx;
    const ey = this.earthCy;
    const r = this.earthRadius;

    // --- Atmosphere glow (outer ring) ---
    ctx.globalCompositeOperation = 'lighter';
    const atmosGrad = ctx.createRadialGradient(ex, ey, r * 0.9, ex, ey, r * 1.4);
    atmosGrad.addColorStop(0, 'rgba(60,140,255,0.25)');
    atmosGrad.addColorStop(0.5, 'rgba(40,100,220,0.1)');
    atmosGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // --- Earth body ---
    ctx.globalCompositeOperation = 'source-over';

    // Ocean base: radial gradient (bright blue center, dark limb)
    const oceanGrad = ctx.createRadialGradient(
      ex - r * 0.25, ey - r * 0.2, r * 0.1,
      ex, ey, r,
    );
    oceanGrad.addColorStop(0, '#4a90d9');
    oceanGrad.addColorStop(0.6, '#2a5ea8');
    oceanGrad.addColorStop(1, '#0a1e3c');
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();

    // Clip to Earth sphere for continents and clouds
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.clip();

    // --- Continents ---
    for (const c of this.earthContinents) {
      // Convert longitude/latitude to screen position with rotation
      const lon = c.lon + this.earthRotation;
      // Simple spherical-ish projection
      const projX = Math.sin(lon * Math.PI) * r * 0.9;
      const projY = c.lat * r * 2;
      // Depth fade: continents near the limb are dimmer
      const depth = Math.cos(lon * Math.PI);
      if (depth < -0.1) continue; // behind the sphere

      const alpha = Math.max(0, depth) * 0.7;
      const size = c.size * r * (0.6 + depth * 0.4);
      const [cr, cg, cb] = c.color;

      const contGrad = ctx.createRadialGradient(
        ex + projX, ey + projY, 0,
        ex + projX, ey + projY, size,
      );
      contGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
      contGrad.addColorStop(0.7, `rgba(${cr},${cg},${cb},${alpha * 0.5})`);
      contGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = contGrad;
      ctx.beginPath();
      ctx.arc(ex + projX, ey + projY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Cloud wisps ---
    ctx.globalCompositeOperation = 'lighter';
    for (const cloud of this.earthClouds) {
      const yPos = ey + cloud.y * r;
      const xOffset = Math.sin(cloud.angle) * r * 0.5;
      ctx.strokeStyle = `rgba(255,255,255,${cloud.alpha})`;
      ctx.lineWidth = r * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex + xOffset, yPos, r * 0.7, cloud.angle, cloud.angle + cloud.arcLen);
      ctx.stroke();
    }

    ctx.restore(); // pop clip

    // --- Limb darkening (edge shading) ---
    ctx.globalCompositeOperation = 'source-over';
    const limbGrad = ctx.createRadialGradient(
      ex - r * 0.25, ey - r * 0.2, r * 0.3,
      ex, ey, r,
    );
    limbGrad.addColorStop(0, 'rgba(0,0,0,0)');
    limbGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
    limbGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = limbGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();

    // --- Thin atmosphere rim highlight ---
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(100,180,255,0.35)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(80,160,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ex, ey, r + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- Moon ---
    const mx = ex + Math.cos(this.moonOrbitAngle) * this.moonOrbitRadius;
    const my = ey + Math.sin(this.moonOrbitAngle) * this.moonOrbitRadius * 0.3; // flattened orbit
    const mr = this.moonRadius;

    // Moon glow
    ctx.globalCompositeOperation = 'lighter';
    const moonGlowGrad = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2);
    moonGlowGrad.addColorStop(0, 'rgba(200,200,220,0.1)');
    moonGlowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moonGlowGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.globalCompositeOperation = 'source-over';
    const moonGrad = ctx.createRadialGradient(
      mx - mr * 0.2, my - mr * 0.2, mr * 0.1,
      mx, my, mr,
    );
    moonGrad.addColorStop(0, '#c8c8d0');
    moonGrad.addColorStop(0.7, '#888890');
    moonGrad.addColorStop(1, '#404048');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }
}
