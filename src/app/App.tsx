import { useState } from 'react';
import type { Robot } from '../core/types';
import type { Design } from '../core/format';
import { jointValue } from '../core/dh';
import { PRESETS } from '../core/presets';
import { Gallery } from './Gallery';
import { Simulator } from './Simulator';

type View = 'gallery' | 'sim';

/** El diseño que se obtiene al abrir un robot: su estructura y su pose inicial. */
function designFromRobot(robot: Robot): Design {
  return { robot, pose: robot.joints.map(jointValue) };
}

export default function App() {
  const [view, setView] = useState<View>('gallery');
  // Robot y pose en un solo estado: cambian juntos o no cambian.
  const [design, setDesign] = useState<Design>(() => designFromRobot(PRESETS.servo4));

  /** Abre un robot: carga su pose inicial y cambia de pantalla. */
  function openRobot(robot: Robot) {
    setDesign(designFromRobot(robot));
    setView('sim');
  }

  /** Mueve una sola articulación, creando un arreglo nuevo. */
  function updatePose(index: number, valueSI: number) {
    setDesign(prev => ({
      ...prev,
      pose: prev.pose.map((v, i) => (i === index ? valueSI : v)),
    }));
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
