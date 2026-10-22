import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Robot } from '../core/types';
import { buildRobotMesh, disposeGroup, robotReach } from './robotMesh';

/** Objetos de three.js que deben sobrevivir entre repintados de React. */
interface Scene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  robotGroup: THREE.Group;
  grid: THREE.GridHelper;
}

interface Props {
  robot: Robot;
  q: number[];
  /**
   * Cambia cada vez que se abre un diseño (ejemplo, archivo o uno nuevo).
   * La cámara se encuadra solo cuando cambia este número.
   */
  frameKey?: number;
}

/** Dirección desde la que mira la cámara: vista isométrica, como el prototipo. */
const ISO_DIR = new THREE.Vector3(1, -1.25, 0.85).normalize();

/** Coloca la cámara y la rejilla de acuerdo con el tamaño del robot. */
function frameRobot(s: Scene, robot: Robot): void {
  const reach = robotReach(robot);
  const target = new THREE.Vector3(0, 0, reach * 0.2);   // un poco arriba de la base
  const distance = reach * 1.85 + 0.12;                   // más lejos si el robot es grande
  const fit = Math.min(s.camera.aspect, 1);              // visor más alto que ancho (celular): alejarse más

  s.camera.position.copy(target).addScaledVector(ISO_DIR, distance / fit);
  s.controls.target.copy(target);
  s.controls.update();

  // La rejilla mide 1 m con 20 divisiones (celdas de 5 cm). Para robots
  // grandes se duplica: 2 m con celdas de 10 cm.
  s.grid.scale.setScalar(reach > 0.9 ? 2 : 1);
}

export function Viewport3D({ robot, q, frameKey = 0 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  /** El frameKey con el que se encuadró la escena actual. */
  const framedRef = useRef<number | null>(null);

  // --- Efecto 1: montar la escena. Corre una sola vez. ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce1e6);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    camera.up.set(0, 0, 1);              // z hacia arriba: convención robótica
    camera.position.set(0.6, -0.8, 0.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;       // la cámara frena suave
    controls.target.set(0, 0, 0.15);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x50575f, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(1, -1.2, 2);
    scene.add(sun);

    const grid = new THREE.GridHelper(1, 20, 0xaab3be, 0xc8cfd6);
    grid.rotation.x = Math.PI / 2;       // la rejilla en el plano XY
    scene.add(grid);

    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // El canvas debe seguir el tamaño del contenedor.
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);     // false: no toca el estilo CSS
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frameId = 0;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      controls.update();                 // necesario por enableDamping
      renderer.render(scene, camera);
    };
    loop();

    sceneRef.current = { renderer, scene, camera, controls, robotGroup, grid };

    // --- Limpieza: se ejecuta al desmontar el componente ---
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      disposeGroup(robotGroup);
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss();       // suelta el contexto WebGL ya, sin esperar al navegador
      renderer.domElement.remove();
      sceneRef.current = null;
      framedRef.current = null;          // la próxima escena se encuadra de nuevo
    };
  }, []);

  // --- Efecto 2: redibujar cuando cambia el robot o su configuración ---
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    disposeGroup(s.robotGroup);
    buildRobotMesh(s.robotGroup, robot, q);
  }, [robot, q]);

  // --- Efecto 3: encuadrar la cámara solo al abrir un diseño ---
  // Mover un deslizador no debe mover la cámara, y editar un parámetro
  // tampoco: con el editor, el robot cambia en cada tecla, y la cámara
  // saltaría mientras el usuario la está usando. Por eso se compara frameKey.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || framedRef.current === frameKey) return;
    framedRef.current = frameKey;
    frameRobot(s, robot);
  }, [robot, frameKey]);

  return <div ref={mountRef} className="viewport" />;
}