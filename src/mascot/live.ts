import {
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Mood } from './KhaoTang';
import glbUrl from './renders/khaotang.glb?url';

/**
 * The live ข้าวตัง: the GLB from tools/blender/khaotang.py, posed and animated by hand
 * (breathing, blinks, ear twitches, a swaying tail, looking at your finger, a hop on tap).
 * The camera and lights copy the Blender stills, so swapping a still for this lines up.
 */

type Pose = { head: [number, number, number]; ears: number };

// tools/blender/khaotang.py CAMERA: azimuth 22°, elevation 10°, 5.8 away, aimed at z 1.25, 70mm on a 36mm-tall sensor
const CAM = { az: 22, el: 10, dist: 5.8, targetY: 1.25, fov: MathUtils.radToDeg(2 * Math.atan(18 / 70)) };

let model: Promise<Object3D> | undefined;
function loadModel(): Promise<Object3D> {
  model ??= new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(glbUrl)
    .then((g) => g.scene)
    .catch((e: unknown) => {
      model = undefined; // let a later mount try again
      throw e;
    });
  return model;
}

/** Soft contact shadow under the paws, like the Blender shadow catcher. */
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export interface Live {
  setMood(mood: Mood): void;
  dispose(): void;
}

/**
 * Draws into a fresh canvas inside `host` (a lost context can't be reused, and React may
 * mount twice). Never throws: if WebGL fails, nothing is drawn and the still stays.
 */
export function mountLive(host: HTMLElement, initial: Mood, onFirstFrame: () => void): Live {
  const canvas = document.createElement('canvas');
  canvas.className = 'khaotang__live';
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return { setMood() {}, dispose() {} };
  }
  host.appendChild(canvas);
  let mood = initial;
  let disposed = false;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping; // the stills use Blender's "Standard" view
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  // Blender (x, y, z) is three (x, z, -y)
  scene.add(new HemisphereLight(0xfff6ea, 0xe9dccb, 1.1));
  const key = new DirectionalLight(0xfff4e6, 2.1);
  key.position.set(-3.2, 5, 4);
  const fill = new DirectionalLight(0xe6eeff, 0.55);
  fill.position.set(4, 1.8, 3);
  const rim = new DirectionalLight(0xffffff, 1.6);
  rim.position.set(1.5, 4, -4.5);
  scene.add(key, fill, rim);

  const shadowMap = shadowTexture();
  const shadow = new Mesh(new PlaneGeometry(2.3, 1.7), new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: 0.6 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.12, 0.002, 0.02);
  scene.add(shadow);

  const camera = new PerspectiveCamera(CAM.fov, 1, 0.1, 50);
  const a = MathUtils.degToRad(CAM.az);
  const e = MathUtils.degToRad(CAM.el);
  camera.position.set(CAM.dist * Math.sin(a) * Math.cos(e), CAM.targetY + CAM.dist * Math.sin(e), CAM.dist * Math.cos(a) * Math.cos(e));
  camera.lookAt(0, CAM.targetY, 0);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ---- the cat
  let root: Object3D | undefined;
  let parts: Record<'head' | 'earL' | 'earR' | 'eyeL' | 'eyeR' | 'tail', Object3D> | undefined;
  let sweat: Object3D | undefined;
  let sweatY = 0;
  let poses: Record<Mood, Pose> | undefined;

  const applyMood = () => {
    root?.traverse((o) => {
      const rule = o.userData.moods as string | undefined;
      if (!rule) return;
      const words = rule.split(' ');
      o.visible = words[0].startsWith('-') ? !words.includes(`-${mood}`) : words.includes(mood);
    });
  };

  loadModel()
    .then((m) => {
      if (disposed) return;
      root = m.clone(true);
      scene.add(root);
      // GLTFLoader drops the dots from node names: Eye.L -> EyeL
      const get = (n: string) => root!.getObjectByName(n)!;
      parts = { head: get('Head'), earL: get('EarL'), earR: get('EarR'), eyeL: get('EyeL'), eyeR: get('EyeR'), tail: get('Tail') };
      sweat = root.getObjectByName('Sweat');
      sweatY = sweat?.position.y ?? 0;
      const rootNode = root.getObjectByName('Root') ?? root;
      poses = JSON.parse(rootNode.userData.poses as string) as Record<Mood, Pose>;
      applyMood();
      start();
    })
    .catch(() => {
      /* the still stays on screen */
    });

  // ---- motion
  const t0 = performance.now();
  const look = { x: 0, y: 0 };
  const aim = { x: 0, y: 0 };
  let blinkAt = -1;
  let nextBlink = 1.5;
  let twitchAt = -1;
  let twitchLeft = true;
  let nextTwitch = 3;
  let hopAt = -10;
  let first = true;
  let raf = 0;

  const pulse = (t: number, at: number, length: number) => {
    const p = (t - at) / length;
    return p >= 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!root || !parts || !poses) return;
    const t = (now - t0) / 1000;
    const pose = poses[mood];
    const sleeping = mood === 'sleeping';
    const reading = mood === 'reading';

    // breathing: a slow squash of the whole cat
    const breath = sleeping ? 0.022 * Math.sin((t * 2 * Math.PI) / 3.4) : 0.012 * Math.sin((t * 2 * Math.PI) / 2.8);
    root.scale.set(1 - breath * 0.35, 1 + breath, 1 - breath * 0.35);
    root.position.y = (mood === 'celebrate' ? 0.1 * Math.abs(Math.sin(t * Math.PI * 1.4)) : 0) + 0.16 * pulse(t, hopAt, 0.45);

    // head: the mood's pose, a little sway, and an eye on your finger
    const follows = !sleeping && !reading;
    look.x += ((follows ? aim.x : 0) - look.x) * 0.08;
    look.y += ((follows ? aim.y : 0) - look.y) * 0.08;
    const sway = (sleeping ? 0.04 : 0.03) * Math.sin(t * (sleeping ? 0.6 : 0.8));
    const scan = reading ? 0.1 * Math.sin(t * 1.1) : 0;
    const tremble = mood === 'worried' ? 0.012 * Math.sin(t * 23) : 0;
    const [pitch, yaw, roll] = pose.head.map(MathUtils.degToRad);
    parts.head.rotation.set(pitch + look.y * 0.25, yaw + look.x * 0.45 + scan, -roll + sway + tremble);

    // ears: the mood's droop plus the odd twitch
    if (t > nextTwitch && !sleeping) {
      twitchAt = t;
      twitchLeft = Math.random() < 0.5;
      nextTwitch = t + 4 + Math.random() * 5;
    }
    const twitch = 0.35 * pulse(t, twitchAt, 0.28);
    const droop = MathUtils.degToRad(pose.ears);
    parts.earL.rotation.z = -droop - (twitchLeft ? twitch : 0);
    parts.earR.rotation.z = droop + (twitchLeft ? 0 : twitch);

    // blinks, sometimes twice
    if (t > nextBlink) {
      blinkAt = t;
      nextBlink = t + (Math.random() < 0.2 ? 0.3 : 2.2 + Math.random() * 3.5);
    }
    const lid = 1 - 0.92 * pulse(t, blinkAt, 0.16);
    parts.eyeL.scale.y = parts.eyeR.scale.y = lid;

    parts.tail.rotation.y = (sleeping ? 0.05 : 0.2) * Math.sin(t * (sleeping ? 0.8 : 1.7));
    parts.tail.rotation.z = 0.05 * Math.sin(t * 1.3);
    if (sweat) sweat.position.y = sweatY - 0.025 * Math.abs(Math.sin(t * 2.2));

    renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirstFrame();
    }
  };

  // ---- run only while on screen
  let onScreen = true;
  const start = () => {
    if (!raf && onScreen && !document.hidden && root) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) start();
    else stop();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  const onMove = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    aim.x = MathUtils.clamp((ev.clientX - (r.left + r.width / 2)) / (r.width * 1.5), -1, 1);
    aim.y = MathUtils.clamp((ev.clientY - (r.top + r.height / 2)) / (r.height * 1.5), -1, 1);
  };
  const onTap = (ev: PointerEvent) => {
    onMove(ev);
    hopAt = (performance.now() - t0) / 1000;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerdown', onTap);

  return {
    setMood(next) {
      mood = next;
      applyMood();
    },
    dispose() {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onTap);
      // the model's geometry and materials are shared by every mount and stay cached
      shadow.geometry.dispose();
      (shadow.material as MeshBasicMaterial).dispose();
      shadowMap.dispose();
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
