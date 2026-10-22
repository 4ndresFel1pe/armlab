import { useRef } from 'react';

interface Props {
  onFile: (file: File) => void;
  label?: string;
}

/**
 * Botón "Abrir": el camino para quien no puede arrastrar (celular, teclado).
 *
 * El <input type="file"> es feo e imposible de maquetar, así que va escondido
 * y un <button> normal le hace clic. Un botón de verdad, y no una etiqueta,
 * para que se pueda alcanzar con Tab y activar con Enter.
 */
export function OpenFileButton({ onFile, label = 'Abrir' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button className="btn" onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';          // permite reabrir el mismo archivo
        }}
      />
    </>
  );
}
