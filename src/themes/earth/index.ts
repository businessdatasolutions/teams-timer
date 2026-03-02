import * as THREE from 'three';
import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';

const TEXTURE_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/';

// Atmosphere shaders (Fresnel glow effect)
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vEyeVector = -vec3(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    float intensity = pow(0.6 - dot(vNormal, normalize(vEyeVector)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }
`;

class EarthTheme extends BaseTheme {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private earth!: THREE.Mesh;
  private clouds!: THREE.Mesh;
  private moonOrbit!: THREE.Group;
  private clock = new THREE.Clock();
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private ringEl!: HTMLCanvasElement;
  private ringCtx!: CanvasRenderingContext2D;
  private lastProgress = 0;
  private isDragging = false;
  private previousMouse = { x: 0, y: 0 };
  private spherical = new THREE.Spherical(6, Math.PI / 3, 0);

  init(config: AppConfig): void {
    // Hide the 2D canvas from BaseTheme — we use Three.js instead
    this.canvas.style.display = 'none';
    this.container.style.background = '#000';

    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCameraFromSpherical();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    sunLight.position.set(10, 5, 5);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    // Stars background
    this.createStars();

    // Earth, clouds, atmosphere, moon
    const loader = new THREE.TextureLoader();
    this.createEarth(loader);
    this.createMoon(loader);

    // Orbit controls (manual)
    this.setupOrbitControls();

    // Timer HUD
    this.createHUD(config);
  }

  private createStars(): void {
    const positions = new Float32Array(15000 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      const r = 300 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }

  private createEarth(loader: THREE.TextureLoader): void {
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);

    // Atmosphere glow
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), atmosphereMat);
    atmosphere.scale.setScalar(1.04);
    this.scene.add(atmosphere);

    // Earth body
    const earthMat = new THREE.MeshPhongMaterial({ shininess: 10, color: 0x4466aa });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earth);

    // Load textures async
    loader.load(`${TEXTURE_BASE}earth_atmos_2048.jpg`, (tex) => {
      (this.earth.material as THREE.MeshPhongMaterial).map = tex;
      (this.earth.material as THREE.MeshPhongMaterial).color.set(0xffffff);
      (this.earth.material as THREE.MeshPhongMaterial).needsUpdate = true;
    });
    loader.load(`${TEXTURE_BASE}earth_normal_2048.jpg`, (tex) => {
      (this.earth.material as THREE.MeshPhongMaterial).normalMap = tex;
      (this.earth.material as THREE.MeshPhongMaterial).needsUpdate = true;
    });
    loader.load(`${TEXTURE_BASE}earth_specular_2048.jpg`, (tex) => {
      (this.earth.material as THREE.MeshPhongMaterial).specularMap = tex;
      (this.earth.material as THREE.MeshPhongMaterial).needsUpdate = true;
    });

    // Cloud layer
    const cloudsMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      color: 0xaaaaaa,
    });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), cloudsMat);
    this.clouds.scale.setScalar(1.01);
    this.scene.add(this.clouds);

    loader.load(`${TEXTURE_BASE}earth_clouds_1024.png`, (tex) => {
      (this.clouds.material as THREE.MeshStandardMaterial).map = tex;
      (this.clouds.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      (this.clouds.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
  }

  private createMoon(loader: THREE.TextureLoader): void {
    this.moonOrbit = new THREE.Group();
    const moonMat = new THREE.MeshStandardMaterial({ roughness: 1, color: 0x888888 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 32), moonMat);
    moon.position.x = 4;
    this.moonOrbit.add(moon);
    this.scene.add(this.moonOrbit);

    loader.load(`${TEXTURE_BASE}moon_1024.jpg`, (tex) => {
      (moon.material as THREE.MeshStandardMaterial).map = tex;
      (moon.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      (moon.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
  }

  private setupOrbitControls(): void {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.spherical.theta -= dx * 0.005;
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi + dy * 0.005));
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
      this.updateCameraFromSpherical();
    });

    el.addEventListener('pointerup', () => { this.isDragging = false; });
    el.addEventListener('pointerleave', () => { this.isDragging = false; });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(2, Math.min(20, this.spherical.radius + e.deltaY * 0.01));
      this.updateCameraFromSpherical();
    }, { passive: false });
  }

  private updateCameraFromSpherical(): void {
    if (!this.camera) return;
    this.camera.position.setFromSpherical(this.spherical);
    this.camera.lookAt(0, 0, 0);
  }

  private createHUD(config: AppConfig): void {
    // Progress ring canvas
    this.ringEl = document.createElement('canvas');
    this.ringEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;';
    this.container.appendChild(this.ringEl);
    this.ringCtx = this.ringEl.getContext('2d')!;

    // Title
    this.titleEl = document.createElement('div');
    this.titleEl.style.cssText =
      'position:absolute;top:2rem;left:2rem;z-index:10;pointer-events:none;' +
      "font-family:'Segoe UI',system-ui,sans-serif;color:white;opacity:0.8;" +
      'font-size:1.8rem;font-weight:300;letter-spacing:0.3em;text-transform:uppercase;' +
      'text-shadow:0 0 20px rgba(100,180,255,0.4);';
    this.titleEl.textContent = 'The Pale Blue Dot';
    this.container.appendChild(this.titleEl);

    // Timer overlay
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText =
      'font-size:5rem;font-weight:200;color:rgba(200,220,255,0.9);' +
      'text-shadow:0 0 40px rgba(100,180,255,0.5),0 0 80px rgba(100,180,255,0.2);' +
      "font-family:'Segoe UI',system-ui,sans-serif;letter-spacing:8px;";

    this.textEl = document.createElement('div');
    this.textEl.style.cssText =
      'font-size:1.2rem;color:rgba(200,220,255,0.5);' +
      'text-shadow:0 0 20px rgba(100,180,255,0.3);' +
      "font-family:'Segoe UI',system-ui,sans-serif;margin-top:0.5rem;letter-spacing:4px;text-transform:uppercase;";
    this.textEl.textContent = config.text;

    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    this.container.appendChild(overlay);

    // Controls hint
    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute;bottom:2rem;right:2rem;z-index:10;pointer-events:none;' +
      'color:rgba(255,255,255,0.25);font-size:0.7rem;text-align:right;' +
      "font-family:'Segoe UI',system-ui,sans-serif;line-height:1.6;";
    hint.innerHTML = 'Left Click: Orbit View<br>Scroll: Zoom In/Out';
    this.container.appendChild(hint);

    // Vignette
    const vignette = document.createElement('div');
    vignette.style.cssText =
      'position:absolute;inset:0;pointer-events:none;z-index:3;' +
      'box-shadow:inset 0 0 200px rgba(0,0,0,1);';
    this.container.appendChild(vignette);
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.ringEl.width = w;
    this.ringEl.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  update(_dt: number, timerState: TimerState): void {
    this.timerEl.textContent = timerState.formatted;
    this.lastProgress = timerState.progress;

    const elapsed = this.clock.getElapsedTime();
    if (this.earth) this.earth.rotation.y = elapsed * 0.05;
    if (this.clouds) this.clouds.rotation.y = elapsed * 0.06;
    if (this.moonOrbit) this.moonOrbit.rotation.y = elapsed * 0.15;
  }

  render(_ctx: CanvasRenderingContext2D): void {
    this.renderer.render(this.scene, this.camera);

    // Progress ring
    const w = this.ringEl.width;
    const h = this.ringEl.height;
    this.ringCtx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.2;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + this.lastProgress * Math.PI * 2;

    // Track ring
    this.ringCtx.beginPath();
    this.ringCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ringCtx.strokeStyle = 'rgba(100,180,255,0.08)';
    this.ringCtx.lineWidth = 2;
    this.ringCtx.stroke();

    // Progress arc
    this.ringCtx.beginPath();
    this.ringCtx.arc(cx, cy, radius, startAngle, endAngle);
    this.ringCtx.strokeStyle = 'rgba(100,180,255,0.5)';
    this.ringCtx.lineWidth = 2;
    this.ringCtx.shadowColor = 'rgba(100,180,255,0.7)';
    this.ringCtx.shadowBlur = 18;
    this.ringCtx.stroke();
    this.ringCtx.shadowBlur = 0;
  }

  onComplete(): void {
    // Gentle flash on completion
    this.timerEl.style.color = 'rgba(100,200,255,1)';
    this.timerEl.style.textShadow = '0 0 60px rgba(100,180,255,0.8)';
  }

  dispose(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.ringEl.remove();
    this.titleEl.remove();
    super.dispose();
  }
}

export default EarthTheme;
