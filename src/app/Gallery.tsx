import type { Robot } from '../core/types';
import { PRESETS } from '../core/presets';

interface Props {
  onSelect: (robot: Robot) => void;
  /** El diseño abierto, si lo hay: la galería ofrece volver a él. */
  current?: { name: string; dirty: boolean };
  onResume: () => void;
}

/** Los robots de ejemplo como arreglo, en el orden en que están escritos. */
const ROBOTS = Object.values(PRESETS);

export function Gallery({ onSelect, current, onResume }: Props) {
  return (
    <div className="gallery">
      <h1>ArmLab</h1>
      <p>
        Simulador de brazos robóticos seriales. Escoja uno para empezar.
      </p>

      {current && (
        <button className="resume" onClick={onResume}>
          Volver a «{current.name || 'Brazo sin nombre'}»
          {current.dirty && <span> · cambios sin descargar</span>}
        </button>
      )}

      <div className="gallery-grid">
        {ROBOTS.map(robot => {
          const r = robot.joints.filter(j => j.type === 'R').length;
          const p = robot.joints.length - r;

          return (
            <button
              className="card"
              key={robot.name}
              onClick={() => onSelect(robot)}
            >
              <h3>{robot.name}</h3>
              <p>
                {robot.joints.length} grados de libertad
                {' · '}
                {r > 0 && `${r} de revoluta`}
                {r > 0 && p > 0 && ', '}
                {p > 0 && `${p} prismática${p > 1 ? 's' : ''}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
