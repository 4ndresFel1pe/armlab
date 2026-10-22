import { useState } from 'react';
import type { Robot } from '../core/types';
import type { Design } from '../core/format';
import { designFromRobot, setJointValue } from '../core/edit';
import { PRESETS } from '../core/presets';
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

  if (view === 'gallery') {
    return <Gallery onSelect={openRobot} />;
  }

  return (
    <Simulator
      design={design}
      onJointChange={updatePose}
      onBack={() => setView('gallery')}
    />
  );
}
