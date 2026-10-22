import { useId, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { parseDecimal, editableNumber } from './units';

interface Props {
  label: string;
  /** Valor actual, en unidades de interfaz (cm o grados). */
  value: number;
  /**
   * Se llama solo con números válidos, mientras el usuario escribe.
   * Si devuelve `false`, el valor se rechazó y el campo se marca en rojo.
   */
  onChange?: (value: number) => boolean | void;
  disabled?: boolean;
  /** Nota corta debajo del campo. */
  hint?: string;
  /** Cuánto suben o bajan las flechas ↑ ↓ del teclado. */
  step?: number;
}

/** Dos números iguales salvo el ruido de la coma flotante. */
function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

/**
 * Campo numérico que deja escribir tranquilo.
 *
 * Guarda el texto crudo en estado local y avisa al padre solo cuando lo
 * escrito es un número válido. Así no aparecen ceros fantasma al borrar ni se
 * pierde la coma a medio escribir: el texto no va y vuelve convertido en cada
 * tecla.
 *
 * Es `type="text"` y no `type="number"` a propósito: cada navegador trata
 * distinto la coma decimal en los campos numéricos, y aquí se acepta "12,5"
 * igual que "12.5".
 */
export function NumberField({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  step = 1,
}: Props) {
  const id = useId();
  const [text, setText] = useState(() => editableNumber(value));
  const [invalid, setInvalid] = useState(false);
  /** El último `value` que se vio: sirve para notar cuándo cambia. */
  const [seen, setSeen] = useState(value);

  // Si el valor cambia desde afuera (cargar un archivo, cambiar el tipo,
  // mover el deslizador), se reescribe el texto. Si el cambio vino de lo que
  // el usuario está escribiendo, el texto ya representa ese valor y se deja
  // quieto: por eso se compara antes de reemplazar.
  //
  // Se hace aquí, durante el render, y no en un useEffect: React vuelve a
  // pintar el componente de inmediato con el texto nuevo, sin un cuadro
  // intermedio con el texto viejo. Es el patrón que recomienda la
  // documentación de React para "ajustar estado cuando cambia una prop".
  if (!Object.is(value, seen)) {          // Object.is: NaN cuenta como igual a NaN
    setSeen(value);
    setInvalid(false);
    const n = parseDecimal(text);
    if (n === null || !sameNumber(n, value)) setText(editableNumber(value));
  }

  /** Intenta entregar un número al padre y marca el campo según la respuesta. */
  function commit(n: number) {
    const accepted = onChange?.(n) !== false;
    setInvalid(!accepted);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);
    const n = parseDecimal(raw);
    if (n !== null) {
      commit(n);
    } else {
      // "", "-" o "," son números a medio escribir, no errores.
      setInvalid(!/^\s*[-+−]?[.,]?\s*$/.test(raw));
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();                       // que el cursor no salte al inicio
    const n = parseDecimal(text) ?? value;
    const next = n + (e.key === 'ArrowUp' ? step : -step);
    setText(editableNumber(next));
    commit(next);
  }

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={text}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        // Al salir del campo, el texto vuelve al valor real: si quedó a medio
        // escribir o fue rechazado, el usuario ve lo que de verdad quedó.
        onBlur={() => {
          setText(editableNumber(value));
          setInvalid(false);
        }}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
