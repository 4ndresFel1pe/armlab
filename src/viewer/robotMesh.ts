import * as THREE from 'three';
import type { Robot, Vec3 } from '../core/types';
import { forwardKinematics } from '../core/kinematics';
import { dhParams } from '../core/dh';
import { clamp, col3 } from '../core/linalg';

/** Colores del prototipo HTML (tema claro). */
const COLOR = {
  link: 0xc94f17,                        // eslabones: naranja
  metal: 0x39414b,                       // base, carcasas de revoluta y efector
  pris: 0x127486,                        // carcasas de prismática
  steel: 0x97a1ac,                       // vástago de prismática
  axes: [0xd2382d, 0x2b9147, 0x2d5fd3],  // marcos DH: x rojo, y verde, z azul
};

const UP_Y = new THREE.Vector3(0, 1, 0);

/** Convierte un Vec3 del núcleo ([x, y, z]) en un vector de three.js. */
const toV = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

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

/** Dibuja una esfera de radio `radius` centrada en `p`. */
function sphereAt(
  group: THREE.Group,
  p: THREE.Vector3,
  radius: number,
  material: THREE.Material,
): void {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material);
  mesh.position.copy(p);
  mesh.scale.setScalar(radius);
  group.add(mesh);
}

/**
 * Unidad visual u: 1/45 del alcance del robot, igual que en el prototipo.
 * El alcance suma |a| y |d| de todas las articulaciones; en una prismática se
 * usa su extensión máxima. Todos los grosores se expresan en múltiplos de u,
 * así un brazo chico y uno grande se ven igual de proporcionados.
 */
function visualUnit(robot: Robot): number {
  let reach = 0;
  for (const j of robot.joints) {
    const dMax = j.type === 'P'
      ? Math.max(Math.abs(j.qMin), Math.abs(j.qMax))
      : Math.abs(j.d);
    reach += Math.abs(j.a) + dMax;
  }
  return clamp(Math.max(reach, 0.05) / 45, 0.003, 0.04);
}

/** Vacía un grupo y libera la memoria de sus geometrías y materiales. */
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

/** Llena `group` con la geometría del robot en la configuración `q`. */
export function buildRobotMesh(
  group: THREE.Group,
  robot: Robot,
  q: number[],
  showFrames = true,
): void {
  const u = visualUnit(robot);
  const { T } = forwardKinematics(robot.joints, q);
  const n = robot.joints.length;

  // Un material por color, compartido por todas las piezas de este dibujo.
  const std = (color: number) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 });
  const mat = {
    link: std(COLOR.link),
    metal: std(COLOR.metal),
    pris: std(COLOR.pris),
    steel: std(COLOR.steel),
  };

  // Base (eslabón 0): un disco justo debajo del origen.
  cylinderBetween(group, new THREE.Vector3(0, 0, -1.2 * u), new THREE.Vector3(0, 0, 0), 5 * u, mat.metal);

  robot.joints.forEach((joint, i) => {
    const o = toV(col3(T[i], 3));          // 1. origen del marco anterior
    const z = toV(col3(T[i], 2));          // 2. eje de la articulación
    const d = dhParams(joint, q[i])[1];    //    d_i real (es la variable si es prismática)
    const elbow = o.clone().addScaledVector(z, d);   // 3. codo = o + d_i · z
    const end = toV(col3(T[i + 1], 3));    // 4. origen del marco siguiente
    const isP = joint.type === 'P';

    // 5a. Tramo d_i sobre z. En una prismática es el vástago que sale y entra.
    if (Math.abs(d) > 1e-9) {
      cylinderBetween(group, o, elbow, (isP ? 0.5 : 0.75) * u, isP ? mat.steel : mat.link);
    }

    // 5b. Tramo a_i, del codo al marco siguiente, con una esfera que tapa la unión.
    if (elbow.distanceTo(end) > 1e-9) {
      cylinderBetween(group, elbow, end, 0.75 * u, mat.link);
      sphereAt(group, elbow, 0.75 * u, mat.link);
    }

    // 6. Carcasa sobre el eje z: cilindro grueso si gira, caja si desliza.
    if (!isP) {
      const bottom = o.clone().addScaledVector(z, -1.7 * u);
      const top = o.clone().addScaledVector(z, 1.7 * u);
      cylinderBetween(group, bottom, top, 1.5 * u, mat.metal);
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat.pris);
      const basis = new THREE.Matrix4().makeBasis(toV(col3(T[i], 0)), toV(col3(T[i], 1)), z);
      box.quaternion.setFromRotationMatrix(basis);   // la caja se alinea con el marco
      box.position.copy(o).addScaledVector(z, 1.6 * u);
      box.scale.set(2.6 * u, 2.6 * u, 4.2 * u);
      group.add(box);
    }
  });

  // Efector final.
  sphereAt(group, toV(col3(T[n], 3)), 1.1 * u, mat.metal);

  // Marcos DH {0}…{n}: tres ejes cortos en el origen de cada marco.
  if (showFrames) {
    const axisMat = COLOR.axes.map(color => new THREE.MeshBasicMaterial({ color }));
    for (let i = 0; i <= n; i++) {
      const o = toV(col3(T[i], 3));
      const length = (i === 0 ? 6 : 4.5) * u;
      for (let a = 0; a < 3; a++) {
        const tip = o.clone().addScaledVector(toV(col3(T[i], a)), length);
        cylinderBetween(group, o, tip, 0.14 * u, axisMat[a]);
      }
    }
  }
}
