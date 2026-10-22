import { useState } from 'react';
import type { Design } from '../core/format';
import { Viewport3D } from '../viewer/Viewport3D';
import { JointSliders } from '../ui/JointSliders';
import { RobotEditor } from '../ui/RobotEditor';
import type { EditActions } from '../ui/RobotEditor';
import { ResultsPanel } from '../ui/ResultsPanel';

export type SimTab = 'move' | 'edit';

interface Props {
  design: Design;
  /** Pestaña con la que abre el simulador. */
  initialTab?: SimTab;
  actions: EditActions;
  onJointChange: (index: number, valueSI: number) => void;
  onBack: () => void;
}

export function Simulator({
  design,
  initialTab = 'move',
  actions,
  onJointChange,
  onBack,
}: Props) {
  const { robot, pose } = design;
  const [tab, setTab] = useState<SimTab>(initialTab);

  return (
    <div className="app">
      <header className="topbar">
        <h1>{robot.name}</h1>
        <button className="btn" onClick={onBack}>← Galería</button>
      </header>

      <div className="layout">
        <aside className="panel">
          <div className="panel-body">
            <div className="tabs" role="tablist" aria-label="Modo del panel">
              <button
                className="tab"
                role="tab"
                aria-selected={tab === 'move'}
                onClick={() => setTab('move')}
              >
                Mover
              </button>
              <button
                className="tab"
                role="tab"
                aria-selected={tab === 'edit'}
                onClick={() => setTab('edit')}
              >
                Editar
              </button>
            </div>

            {/* Lo que no se escoge no se pinta: React lo desmonta. */}
            <div role="tabpanel">
              {tab === 'move' ? (
                <JointSliders
                  joints={robot.joints}
                  q={pose}
                  onChange={onJointChange}
                />
              ) : (
                <RobotEditor robot={robot} pose={pose} actions={actions} />
              )}
            </div>
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
