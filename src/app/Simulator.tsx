import type { Design } from '../core/format';
import { Viewport3D } from '../viewer/Viewport3D';
import { JointSliders } from '../ui/JointSliders';
import { ResultsPanel } from '../ui/ResultsPanel';

interface Props {
  design: Design;
  onJointChange: (index: number, valueSI: number) => void;
  onBack: () => void;
}

export function Simulator({ design, onJointChange, onBack }: Props) {
  const { robot, pose } = design;

  return (
    <div className="app">
      <header className="topbar">
        <h1>{robot.name}</h1>
        <button className="btn" onClick={onBack}>← Galería</button>
      </header>

      <div className="layout">
        <aside className="panel">
          <div className="panel-body">
            <h2>Articulaciones</h2>
            <JointSliders
              joints={robot.joints}
              q={pose}
              onChange={onJointChange}
            />
          </div>
        </aside>

        <Viewport3D robot={robot} q={pose} />

        <aside className="panel">
          <div className="panel-body">
            <ResultsPanel robot={robot} q={pose} />
          </div>
        </aside>
      </div>
    </div>
  );
}
