import type { Robot } from '../core/types';
import { Viewport3D } from '../viewer/Viewport3D';
import { JointSliders } from '../ui/JointSliders';
import { ResultsPanel } from '../ui/ResultsPanel';

interface Props {
  robot: Robot;
  q: number[];
  onJointChange: (index: number, valueSI: number) => void;
  onBack: () => void;
}

export function Simulator({ robot, q, onJointChange, onBack }: Props) {
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
              q={q}
              onChange={onJointChange}
            />
          </div>
        </aside>

        <Viewport3D robot={robot} q={q} />

        <aside className="panel">
          <div className="panel-body">
            <ResultsPanel robot={robot} q={q} />
          </div>
        </aside>
      </div>
    </div>
  );
}
