import type { Robot } from '../core/types';
import { forwardKinematics, rpyZYX } from '../core/kinematics';
import { dhParams } from '../core/dh';
import { col3 } from '../core/linalg';
import { toCm, toDeg, fmt } from './units';

interface Props {
  robot: Robot;
  q: number[];
}

export function ResultsPanel({ robot, q }: Props) {
  // Valores derivados: se calculan en cada repintado, no se guardan en estado.
  const { T } = forwardKinematics(robot.joints, q);
  const Tn = T[robot.joints.length];        // marco del efector (base → efector)
  const p = col3(Tn, 3);                     // posición [x, y, z] en metros
  const [roll, pitch, yaw] = rpyZYX(Tn);     // orientación en radianes

  return (
    <>
      <section className="result">
        <h2>Posición del efector</h2>
        <div className="vec">
          <span><em>x</em>{fmt(toCm(p[0]))} cm</span>
          <span><em>y</em>{fmt(toCm(p[1]))} cm</span>
          <span><em>z</em>{fmt(toCm(p[2]))} cm</span>
        </div>
      </section>

      <section className="result">
        <h2>Orientación (RPY, ZYX)</h2>
        <div className="vec">
          <span><em>roll</em>{fmt(toDeg(roll), 1)}°</span>
          <span><em>pitch</em>{fmt(toDeg(pitch), 1)}°</span>
          <span><em>yaw</em>{fmt(toDeg(yaw), 1)}°</span>
        </div>
      </section>

      <section className="result">
        <h2>Tabla DH</h2>
        <table className="data">
          <thead>
            <tr>
              <th>i</th>
              <th>Tipo</th>
              <th>θ (°)</th>
              <th>d (cm)</th>
              <th>a (cm)</th>
              <th>α (°)</th>
            </tr>
          </thead>
          <tbody>
            {robot.joints.map((joint, i) => {
              const [theta, d, a, alpha] = dhParams(joint, q[i]);
              const isR = joint.type === 'R';

              return (
                <tr key={i} className={`is-${joint.type}`}>
                  <td>{i + 1}</td>
                  <td>{joint.type}</td>
                  <td className={isR ? 'is-var' : undefined}>{fmt(toDeg(theta), 1)}</td>
                  <td className={isR ? undefined : 'is-var'}>{fmt(toCm(d))}</td>
                  <td>{fmt(toCm(a))}</td>
                  <td>{fmt(toDeg(alpha), 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
