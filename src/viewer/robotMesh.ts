import * as THREE from 'three';
import type { Robot } from '../core/types';

/** Vacía un grupo y libera la memoria de sus geometrías y materiales. */
export function disposeGroup(group: THREE.Group): void;

/** Llena `group` con la geometría del robot en la configuración `q`. */
export function buildRobotMesh(
  group: THREE.Group,
  robot: Robot,
  q: number[],
  showFrames?: boolean,
): void;

const UP_Y = new THREE.Vector3(0, 1, 0);

/**
 * Dibuja un cilindro que va del punto `p` al punto `q`.
 * three.js crea los cilindros apuntando en +y, así que hay que rotarlos
 * para que apunten en la dirección que queremos.
 */

function cylinderBetween(
  group: THREE.Group,
  p: THREE.Vector3,
  q: THREE.Vector3,
  radius: number,
  material: THREE.Material,
): void {
  const dir = q.clone().sub(p);
  const length = dir.length();
  if (length < 1e-9) return;                    // puntos iguales: nada que dibujar

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 24),    // radio 1, alto 1: se escala después
    material,
  );
  mesh.position.copy(p).addScaledVector(dir, 0.5);          // al punto medio
  mesh.quaternion.setFromUnitVectors(UP_Y, dir.normalize()); // gira +y hacia dir
  mesh.scale.set(radius, length, radius);
  group.add(mesh);
}


export function disposeGroup(group: THREE.Group): void {
  group.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
  group.clear();
}