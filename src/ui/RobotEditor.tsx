import type { JointType, Robot } from '../core/types';
import { MAX_JOINTS } from '../core/edit';
import type { JointPatch } from '../core/edit';
import { JointEditor } from './JointEditor';

/** Lo que el editor le puede pedir al dueño del estado (App). */
export interface EditActions {
  patchJoint: (index: number, patch: JointPatch) => void;
  changeType: (index: number, type: JointType) => void;
  removeJoint: (index: number) => void;
  addJoint: () => void;
  rename: (name: string) => void;
}

interface Props {
  robot: Robot;
  pose: number[];
  actions: EditActions;
}

/** La pestaña "Editar": nombre del brazo, una tarjeta por articulación y "Agregar". */
export function RobotEditor({ robot, pose, actions }: Props) {
  const full = robot.joints.length >= MAX_JOINTS;

  return (
    <div className="editor">
      <label className="field name-field">
        <span>Nombre del brazo</span>
        <input
          type="text"
          value={robot.name}
          maxLength={60}
          onChange={e => actions.rename(e.target.value)}
        />
      </label>

      <p className="help">
        Parámetros DH estándar: θ y d se miden sobre z<sub>i−1</sub>; a y α,
        sobre x<sub>i</sub>. Use las flechas ↑ ↓ para ajustar un campo.
      </p>

      {robot.joints.map((joint, i) => (
        <JointEditor
          key={i}
          joint={joint}
          index={i}
          q={pose[i]}
          canDelete={robot.joints.length > 1}
          onPatch={actions.patchJoint}
          onChangeType={actions.changeType}
          onDelete={actions.removeJoint}
        />
      ))}

      <button className="btn add-joint" onClick={actions.addJoint} disabled={full}>
        {full ? `Máximo ${MAX_JOINTS} articulaciones` : '+ Agregar articulación'}
      </button>
    </div>
  );
}
