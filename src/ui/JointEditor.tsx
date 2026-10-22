import type { Joint, JointType } from '../core/types';
import type { JointPatch } from '../core/edit';
import { NumberField } from './NumberField';
import { displayQ, toSI, toCm, toM, toDeg, toRad } from './units';

interface Props {
  joint: Joint;
  index: number;
  /** Valor actual de la variable articular (la pose), en SI. */
  q: number;
  canDelete: boolean;
  onPatch: (index: number, patch: JointPatch) => void;
  onChangeType: (index: number, type: JointType) => void;
  onDelete: (index: number) => void;
}

const VARIABLE_HINT = 'variable — use el deslizador';

/**
 * Editor de una articulación: tipo, los cuatro parámetros DH y los límites.
 *
 * El editor toca el robot; el deslizador toca la pose. El parámetro que es la
 * variable articular (θ si gira, d si desliza) aparece deshabilitado y muestra
 * el valor actual de la pose.
 */
export function JointEditor({
  joint,
  index,
  q,
  canDelete,
  onPatch,
  onChangeType,
  onDelete,
}: Props) {
  const isR = joint.type === 'R';
  const theta = isR ? q : joint.theta;
  const d = isR ? joint.d : q;

  // Los límites están en las unidades de la variable: grados o centímetros.
  const unit = isR ? '°' : 'cm';
  const shown = (si: number) => displayQ(joint, si).value;

  // El mínimo debe quedar por debajo del máximo. Si no, no se avisa al padre:
  // se devuelve false, el campo se marca y el usuario termina de escribir.
  function setMin(v: number) {
    const qMin = toSI(joint, v);
    if (!(qMin < joint.qMax)) return false;
    onPatch(index, { qMin });
  }
  function setMax(v: number) {
    const qMax = toSI(joint, v);
    if (!(qMax > joint.qMin)) return false;
    onPatch(index, { qMax });
  }

  return (
    <div className={`joint is-${joint.type}`}>
      <div className="joint-head">
        <strong>Articulación {index + 1}</strong>
        <button
          className="link-btn"
          onClick={() => onDelete(index)}
          disabled={!canDelete}
          title={canDelete ? undefined : 'El brazo necesita al menos una articulación'}
          aria-label={`Quitar articulación ${index + 1}`}
        >
          Quitar
        </button>
      </div>

      <div className="seg" role="group" aria-label="Tipo de articulación">
        <button aria-pressed={isR} onClick={() => onChangeType(index, 'R')}>
          Revoluta
        </button>
        <button aria-pressed={!isR} onClick={() => onChangeType(index, 'P')}>
          Prismática
        </button>
      </div>

      <div className="fields">
        <NumberField
          label="θ (°)"
          value={toDeg(theta)}
          disabled={isR}
          hint={isR ? VARIABLE_HINT : undefined}
          onChange={v => onPatch(index, { theta: toRad(v) })}
        />
        <NumberField
          label="d (cm)"
          value={toCm(d)}
          disabled={!isR}
          hint={isR ? undefined : VARIABLE_HINT}
          step={0.5}
          onChange={v => onPatch(index, { d: toM(v) })}
        />
        <NumberField
          label="a (cm)"
          value={toCm(joint.a)}
          step={0.5}
          onChange={v => onPatch(index, { a: toM(v) })}
        />
        <NumberField
          label="α (°)"
          value={toDeg(joint.alpha)}
          step={5}
          onChange={v => onPatch(index, { alpha: toRad(v) })}
        />
        <NumberField
          label={`q mín (${unit})`}
          value={shown(joint.qMin)}
          step={isR ? 5 : 0.5}
          onChange={setMin}
        />
        <NumberField
          label={`q máx (${unit})`}
          value={shown(joint.qMax)}
          step={isR ? 5 : 0.5}
          onChange={setMax}
        />
      </div>
    </div>
  );
}
