import type { Robot } from '../core/types';
import { PRESETS } from '../core/presets';
import { OpenFileButton } from '../ui/OpenFileButton';

interface Props {
  onSelect: (robot: Robot) => void;
  onNew: () => void;
  onOpenFile: (file: File) => void;
  /** El diseño abierto, si lo hay: la galería ofrece volver a él. */
  current?: { name: string; dirty: boolean };
  onResume: () => void;
}

/** Los robots de ejemplo como arreglo, en el orden en que están escritos. */
const ROBOTS = Object.values(PRESETS);

export function Gallery({ onSelect, onNew, onOpenFile, current, onResume }: Props) {
  return (
    <div className="gallery">
      <h1>ArmLab</h1>
      <p>
        Simulador de brazos robóticos seriales. Escoja uno para empezar, cree
        el suyo o abra un diseño que haya descargado (también puede
        arrastrarlo sobre la página).
      </p>

      <div className="gallery-actions">
        {current && (
          <button className="resume" onClick={onResume}>
            Volver a «{current.name || 'Brazo sin nombre'}»
            {current.dirty && <span> · cambios sin descargar</span>}
          </button>
        )}
        <OpenFileButton onFile={onOpenFile} label="Abrir archivo" />
      </div>

      <div className="gallery-grid">
        <button className="card card-new" onClick={onNew}>
          <h3>+ Empezar desde cero</h3>
          <p>Un brazo de dos articulaciones para editar a su gusto.</p>
        </button>

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
