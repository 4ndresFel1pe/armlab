import { useEffect, useState } from 'react';

/** ¿Lo que se arrastra trae archivos? (y no un texto seleccionado de la página) */
function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

/**
 * Escucha archivos arrastrados sobre toda la ventana.
 * Devuelve si hay uno encima, para poder mostrar un aviso visual.
 *
 * `onFile` va en las dependencias del efecto: si el que llama no la envuelve
 * en useCallback, los escuchadores se quitan y se vuelven a poner en cada
 * repintado.
 */
export function useFileDrop(onFile: (file: File) => void): boolean {
  const [over, setOver] = useState(false);

  useEffect(() => {
    // dragenter y dragleave se disparan cada vez que el cursor entra o sale de
    // CUALQUIER elemento de la página, no solo de la ventana. Se cuentan:
    // mientras el contador sea mayor que cero, el archivo sigue encima.
    let depth = 0;

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();                 // sin esto, 'drop' nunca ocurre
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();                 // sin esto, el navegador abre el archivo
      depth = 0;
      setOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFile(file);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return over;
}
