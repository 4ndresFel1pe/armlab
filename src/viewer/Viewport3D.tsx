import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Robot } from '../core/types';
import { buildRobotMesh, disposeGroup } from './robotMesh';

/** Objetos de three.js que deben sobrevivir entre repintados de React. */
interface Scene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  robotGroup: THREE.Group;
}

interface Props {
  robot: Robot;
  q: number[];
}

export function Viewport3D({ robot, q }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);

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

    sceneRef.current = { renderer, scene, camera, controls, robotGroup };

    // --- Limpieza: se ejecuta al desmontar el componente ---
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      disposeGroup(robotGroup);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, []);

  // --- Efecto 2: redibujar cuando cambia el robot o su configuración ---
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    disposeGroup(s.robotGroup);
    buildRobotMesh(s.robotGroup, robot, q);
  }, [robot, q]);

  return <div ref={mountRef} className="viewport" />;
}