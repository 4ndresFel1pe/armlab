import { useState } from 'react';
import type { Robot } from '../core/types';
import type { Design } from '../core/format';
import {
  addJoint,
  changeJointType,
  designFromRobot,
  patchJoint,
  removeJoint,
  renameRobot,
  setJointValue,
} from '../core/edit';
import { PRESETS } from '../core/presets';
import type { EditActions } from '../ui/RobotEditor';
import { Gallery } from './Gallery';
import { Simulator } from './Simulator';

type View = 'gallery' | 'sim';

export default function App() {
  const [view, setView] = useState<View>('gallery');
  // Robot y pose en un solo estado: cambian juntos o no cambian.
  const [design, setDesign] = useState<Design>(() => designFromRobot(PRESETS.servo4));

  /** Abre un robot: carga su pose inicial y cambia de pantalla. */
  function openRobot(robot: Robot) {
    setDesign(designFromRobot(robot));
    setView('sim');
  }

  /** Mueve una sola articulación (deslizador). */
  function updatePose(index: number, valueSI: number) {
    setDesign(prev => setJointValue(prev, index, valueSI));
  }

  /** Aplica una operación de edición (de core/edit.ts) sobre el diseño actual. */
  function edit(op: (prev: Design) => Design) {
    setDesign(op);
  }

  const actions: EditActions = {
    patchJoint: (i, patch) => edit(d => patchJoint(d, i, patch)),
    changeType: (i, type) => edit(d => changeJointType(d, i, type)),
    removeJoint: i => edit(d => removeJoint(d, i)),
    addJoint: () => edit(addJoint),
    rename: name => edit(d => renameRobot(d, name)),
  };

  if (view === 'gallery') {
    return <Gallery onSelect={openRobot} />;
  }

  return (
    <Simulator
      design={design}
      actions={actions}
      onJointChange={updatePose}
      onBack={() => setView('gallery')}
    />
  );
}
