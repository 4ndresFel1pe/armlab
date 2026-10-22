import { useCallback, useEffect, useState } from 'react';
import type { Robot } from '../core/types';
import type { Design } from '../core/format';
import { parse, serialize } from '../core/format';
import {
  addJoint,
  changeJointType,
  designFromRobot,
  newDesign,
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
import type { SimTab } from './Simulator';

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
  /** ¿Hubo ediciones desde la última vez que se descargó o se abrió? */
  const [dirty, setDirty] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  /** Pestaña con la que abre el simulador: "Editar" si se empieza de cero. */
  const [startTab, setStartTab] = useState<SimTab>('move');

  /**
   * Abre un diseño (ejemplo o archivo) y pasa al simulador. Si el actual tiene
   * cambios sin descargar, pregunta antes: esta página no guarda nada.
   */
  const openDesign = useCallback(
    (next: Design, tab: SimTab = 'move') => {
      if (
        dirty &&
        !window.confirm(
          'El diseño actual tiene cambios sin descargar y se van a perder. ' +
            '¿Abrir el otro de todas formas?',
        )
      ) {
        return;
      }
      setDesign(next);
      setStartTab(tab);
      setFrameKey(k => k + 1);
      setDirty(false);
      setError(null);
      setView('sim');
    },
    [dirty],
  );

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

  // Si hay cambios sin descargar, el navegador pregunta antes de cerrar la
  // pestaña. Muestra su propio mensaje: no se puede personalizar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  /** Mueve una sola articulación (deslizador). */
  function updatePose(index: number, valueSI: number) {
    setDesign(prev => setJointValue(prev, index, valueSI));
  }

  /**
   * Aplica una operación de edición (de core/edit.ts) sobre el diseño actual.
   * Mover un deslizador no cuenta como edición: solo cambiar la estructura.
   */
  function edit(op: (prev: Design) => Design) {
    setDesign(op);
    setDirty(true);
  }

  /** Descarga el diseño como "nombre-del-brazo.armlab.json". */
  function download() {
    downloadText(`${slug(design.robot.name)}.armlab.json`, serialize(design));
    setDirty(false);
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
      {noticeOpen && (
        <div className="notice">
          <span>
            Esta página no guarda sus diseños. Descargue el archivo para
            conservarlo.
          </span>
          <button onClick={() => setNoticeOpen(false)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar mensaje">
            ×
          </button>
        </div>
      )}

      {view === 'gallery' ? (
        <Gallery
          onSelect={(robot: Robot) => openDesign(designFromRobot(robot))}
          // Un brazo nuevo abre directo en "Editar": es lo que se viene a hacer.
          onNew={() => openDesign(newDesign(), 'edit')}
          onOpenFile={handleFile}
          // Si ya se abrió algo, la galería ofrece volver a ese diseño.
          current={frameKey > 0 ? { name: design.robot.name, dirty } : undefined}
          onResume={() => setView('sim')}
        />
      ) : (
        <Simulator
          design={design}
          initialTab={startTab}
          frameKey={frameKey}
          dirty={dirty}
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
