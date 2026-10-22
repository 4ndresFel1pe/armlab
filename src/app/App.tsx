import { useCallback, useState } from 'react';
import type { Robot } from '../core/types';
import type { Design } from '../core/format';
import { parse, serialize } from '../core/format';
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
import { downloadText, slug } from '../ui/download';
import { useFileDrop } from '../ui/useFileDrop';
import type { EditActions } from '../ui/RobotEditor';
import { Gallery } from './Gallery';
import { Simulator } from './Simulator';

type View = 'gallery' | 'sim';

/** Un diseño de ArmLab pesa unos pocos kilobytes. */
const MAX_FILE_BYTES = 1_000_000;

export default function App() {
  const [view, setView] = useState<View>('gallery');
  // Robot y pose en un solo estado: cambian juntos o no cambian.
  const [design, setDesign] = useState<Design>(() => designFromRobot(PRESETS.servo4));
  /** Sube cada vez que se abre un diseño: le dice al visor que encuadre. */
  const [frameKey, setFrameKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** Abre un diseño (ejemplo o archivo) y pasa al simulador. */
  const openDesign = useCallback((next: Design) => {
    setDesign(next);
    setFrameKey(k => k + 1);
    setError(null);
    setView('sim');
  }, []);

  /**
   * Lee un archivo arrastrado o escogido con "Abrir". Todo lo que venga de
   * afuera pasa por parse(): después de eso, el resto del programa confía en
   * los datos.
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setError('El archivo es demasiado grande para ser un diseño de ArmLab.');
        return;
      }
      let text: string;
      try {
        text = await file.text();
      } catch {
        setError(`No se pudo leer «${file.name}».`);
        return;
      }
      const result = parse(text);
      if (!result.ok) {
        setError(`No se pudo abrir «${file.name}». ${result.error}`);
        return;
      }
      openDesign(result.design);
    },
    [openDesign],
  );

  const dragging = useFileDrop(handleFile);

  /** Mueve una sola articulación (deslizador). */
  function updatePose(index: number, valueSI: number) {
    setDesign(prev => setJointValue(prev, index, valueSI));
  }

  /** Aplica una operación de edición (de core/edit.ts) sobre el diseño actual. */
  function edit(op: (prev: Design) => Design) {
    setDesign(op);
  }

  /** Descarga el diseño como "nombre-del-brazo.armlab.json". */
  function download() {
    downloadText(`${slug(design.robot.name)}.armlab.json`, serialize(design));
  }

  const actions: EditActions = {
    patchJoint: (i, patch) => edit(d => patchJoint(d, i, patch)),
    changeType: (i, type) => edit(d => changeJointType(d, i, type)),
    removeJoint: i => edit(d => removeJoint(d, i)),
    addJoint: () => edit(addJoint),
    rename: name => edit(d => renameRobot(d, name)),
  };

  return (
    <div className="app">
      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar mensaje">
            ×
          </button>
        </div>
      )}

      {view === 'gallery' ? (
        <Gallery onSelect={(robot: Robot) => openDesign(designFromRobot(robot))} />
      ) : (
        <Simulator
          design={design}
          frameKey={frameKey}
          actions={actions}
          onJointChange={updatePose}
          onDownload={download}
          onOpenFile={handleFile}
          onBack={() => setView('gallery')}
        />
      )}

      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <p>Suelte el archivo para abrirlo</p>
        </div>
      )}
    </div>
  );
}
