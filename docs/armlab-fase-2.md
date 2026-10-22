# ArmLab — Fase 2: Crear

> **Objetivo:** que el usuario arme su propio brazo — agregar y quitar
> articulaciones, cambiar tipo, editar parámetros DH y límites — y pueda
> descargarlo como archivo y volver a cargarlo arrastrándolo sobre la página.
>
> **Requisito:** Fase 1 terminada y publicada.
>
> **Lo más importante de esta fase no se ve:** el formato de archivo. Si queda
> bien definido, agregar cuentas de usuario en la Fase 5 es casi trivial — una
> fila en base de datos que guarda exactamente este mismo JSON. Si queda mal, hay
> que rehacerlo todo.

---

## Índice de pasos

| # | Paso | Commit |
|---|---|---|
| 1 | Decisión de diseño: qué es editable | — |
| 2 | `format.ts` — el formato de archivo | ✅ |
| 3 | Pruebas de ida y vuelta | ✅ |
| 4 | Refactor: el diseño es una sola cosa | ✅ |
| 5 | Las operaciones de edición | ✅ |
| 6 | `JointEditor.tsx` | ✅ |
| 7 | Pestañas: Mover / Editar | ✅ |
| 8 | Descargar el diseño | ✅ |
| 9 | Cargar un archivo | ✅ |
| 10 | Avisos honestos | ✅ |
| 11 | Empezar desde cero | ✅ |
| 12 | Publicar | push |

---

## Paso 1 — Decisión de diseño: qué es editable

Hay una ambigüedad en el modelo que conviene resolver antes de escribir nada.

En la interfaz `Joint`, el campo `theta` cumple dos papeles en una articulación
de revoluta: es un parámetro DH **y** es la variable articular que mueve el
deslizador. Lo mismo pasa con `d` en una prismática. Si el editor y el deslizador
escriben los dos sobre el mismo campo, van a pelearse.

**La decisión:**

> El **robot** define la estructura: tipo de cada articulación, los parámetros
> DH que son fijos, y los límites.
> La **pose** (`q`) es un arreglo aparte con la posición actual de cada
> articulación.
> El editor toca el robot. El deslizador toca la pose. Nunca se cruzan.

En la práctica:

| Tipo | El editor permite cambiar | El deslizador mueve |
|---|---|---|
| Revoluta (R) | `d`, `a`, `alpha`, límites | `theta` |
| Prismática (P) | `theta`, `a`, `alpha`, límites | `d` |

En el editor, el campo que es variable aparece deshabilitado con la nota
"variable — use el deslizador". Eso le enseña al usuario qué significa la
convención DH sin tener que explicárselo.

El archivo guarda las dos cosas: la estructura y la pose.

---

## Paso 2 — `format.ts`, el formato de archivo

Archivo nuevo en el núcleo. Es TypeScript puro, así que respeta la regla de
`core/`.

**`src/core/format.ts`**

```ts
import type { Joint, JointType, Robot } from './types';

export const FORMAT_NAME = 'armlab';
export const FORMAT_VERSION = 1;

/** Lo que el usuario está editando: estructura del robot + pose actual. */
export interface Design {
  robot: Robot;
  pose: number[];
}

/** La forma exacta del archivo .json que se descarga. */
export interface ArmLabFile {
  format: typeof FORMAT_NAME;
  formatVersion: number;
  savedAt: string;
  /** Las unidades quedan escritas en el archivo: es autodescriptivo. */
  units: { length: 'm'; angle: 'rad' };
  robot: { name: string; joints: Joint[] };
  pose: number[];
}

// ---------------------------------------------------------------- escribir

export function serialize(design: Design): string {
  const file: ArmLabFile = {
    format: FORMAT_NAME,
    formatVersion: FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    units: { length: 'm', angle: 'rad' },
    robot: {
      name: design.robot.name,
      joints: design.robot.joints.map(j => ({ ...j })),
    },
    pose: [...design.pose],
  };
  return JSON.stringify(file, null, 2);
}

// ----------------------------------------------------------------- leer

export type ParseResult =
  | { ok: true; design: Design }
  | { ok: false; error: string };

export function parse(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' };
  }

  if (!isObject(raw)) {
    return { ok: false, error: 'El archivo no contiene un objeto.' };
  }
  if (raw.format !== FORMAT_NAME) {
    return { ok: false, error: 'Este archivo no es un diseño de ArmLab.' };
  }
  if (!isFiniteNumber(raw.formatVersion)) {
    return { ok: false, error: 'El archivo no indica su versión de formato.' };
  }
  if (raw.formatVersion > FORMAT_VERSION) {
    return {
      ok: false,
      error:
        `El archivo usa la versión ${raw.formatVersion} del formato y esta ` +
        `página entiende hasta la ${FORMAT_VERSION}. Actualice la página.`,
    };
  }

  const data = migrate(raw);

  if (!isObject(data.robot) || !Array.isArray(data.robot.joints)) {
    return { ok: false, error: 'El archivo no describe ningún robot.' };
  }
  if (data.robot.joints.length === 0) {
    return { ok: false, error: 'El robot no tiene articulaciones.' };
  }
  if (data.robot.joints.length > 12) {
    return { ok: false, error: 'El robot tiene demasiadas articulaciones.' };
  }

  const joints: Joint[] = [];
  for (let i = 0; i < data.robot.joints.length; i++) {
    const j = parseJoint(data.robot.joints[i]);
    if (!j) return { ok: false, error: `La articulación ${i + 1} está dañada.` };
    joints.push(j);
  }

  if (!Array.isArray(data.pose) || data.pose.length !== joints.length) {
    return { ok: false, error: 'La pose no corresponde con las articulaciones.' };
  }
  const pose = data.pose.map((v: unknown, i: number) =>
    isFiniteNumber(v) ? clamp(v, joints[i].qMin, joints[i].qMax) : joints[i].qMin,
  );

  const name =
    typeof data.robot.name === 'string' && data.robot.name.trim()
      ? data.robot.name.trim().slice(0, 60)
      : 'Brazo sin nombre';

  return { ok: true, design: { robot: { name, joints }, pose } };
}

/**
 * Punto de entrada para convertir archivos viejos al formato actual.
 * Hoy no hace nada porque solo existe la versión 1. El día que cambie el
 * formato, aquí se escribe la conversión y los archivos de los usuarios
 * siguen abriendo.
 */
function migrate(raw: Record<string, unknown>): any {
  // if (raw.formatVersion === 1) { ...convertir a 2...  }
  return raw;
}

// ------------------------------------------------------------- ayudantes

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Devuelve la articulación validada, o null si algo no cuadra. */
function parseJoint(v: unknown): Joint | null {
  if (!isObject(v)) return null;
  if (v.type !== 'R' && v.type !== 'P') return null;

  const nums = ['theta', 'd', 'a', 'alpha', 'qMin', 'qMax'] as const;
  for (const k of nums) {
    if (!isFiniteNumber(v[k])) return null;
  }
  if ((v.qMin as number) >= (v.qMax as number)) return null;

  return {
    type: v.type as JointType,
    theta: v.theta as number,
    d: v.d as number,
    a: v.a as number,
    alpha: v.alpha as number,
    qMin: v.qMin as number,
    qMax: v.qMax as number,
  };
}
```

### Por qué tanta validación

El archivo viene de afuera. Puede estar corrupto, puede ser de otra aplicación,
puede haber sido editado a mano, o puede venir de alguien con malas intenciones.
Si entra un `NaN` en un parámetro DH, la cinemática empieza a devolver `NaN`, el
robot desaparece de la pantalla y el error aparece diez archivos más allá, sin
pista de dónde vino.

**La regla:** valide en la frontera, no adentro. Después de `parse()`, el resto
del programa puede confiar ciegamente en los datos.

### Sobre `ParseResult`

```ts
type ParseResult = { ok: true; design: Design } | { ok: false; error: string };
```

Eso es una *unión discriminada*: el campo `ok` dice cuál de las dos formas es.
TypeScript lo entiende, así que después de un `if (result.ok)` sabe que existe
`result.design`, y en el `else` sabe que existe `result.error`. Si intenta leer
`result.design` sin comprobar, le marca error.

Es mejor que lanzar excepciones: el que llama **no puede olvidarse** de manejar
el fallo, porque el compilador no lo deja.

### Sobre `migrate`

Hoy no hace nada y podría parecer código inútil. No lo es: es el gancho que
permite que el formato evolucione. El día que agregue, por ejemplo, la masa de
cada eslabón para la Fase 4, `migrate` le pone un valor por defecto a los
archivos viejos y siguen abriendo. Sin ese gancho, el día que cambie algo los
archivos de sus usuarios se vuelven basura.

```bash
git add .
git commit -m "feat(core): formato de archivo con versión y validación"
git push
```

---

## Paso 3 — Pruebas de ida y vuelta

**`src/core/format.test.ts`**

La prueba más valiosa es la de *ida y vuelta*: serializar un diseño, volver a
leerlo, y comprobar que salió igual a como entró.

```ts
import { describe, it, expect } from 'vitest';
import { serialize, parse } from './format';
import { PRESETS } from './presets';
import { jointValue } from './dh';

describe('format', () => {
  it('ida y vuelta: lo que se guarda es lo que se lee', () => {
    const design = {
      robot: PRESETS[0],
      pose: PRESETS[0].joints.map(jointValue),
    };

    const result = parse(serialize(design));

    expect(result.ok).toBe(true);
    if (!result.ok) return;                    // para que TypeScript se calme
    expect(result.design.robot.name).toBe(design.robot.name);
    expect(result.design.robot.joints).toEqual(design.robot.joints);
    expect(result.design.pose).toEqual(design.pose);
  });
});
```

Agregue pruebas para los casos de fallo. Cada una debe devolver `ok: false`:

- Texto que no es JSON: `parse('esto no es json')`
- JSON de otra cosa: `parse('{"hola": 1}')`
- Versión del futuro: un archivo con `formatVersion: 99`
- Articulación con `NaN`: un archivo con `"a": null`
- Pose de largo distinto al número de articulaciones
- `qMin` mayor que `qMax`

Y una de comportamiento: una pose fuera de los límites debe quedar **acotada**,
no rechazada. Un archivo con `pose: [999]` y límites de ±π debe abrir con la
pose en π.

> Estas pruebas valen más que las de la matemática. La cinemática falla de
> forma ruidosa y evidente; un archivo mal validado falla en silencio y mucho
> después.

```bash
git add .
git commit -m "test(core): pruebas del formato de archivo"
git push
```

---

## Paso 4 — Refactor: el diseño es una sola cosa

En la Fase 1, `App.tsx` tiene dos estados separados:

```tsx
const [robot, setRobot] = useState<Robot>(...);
const [q, setQ] = useState<number[]>(...);
```

Eso funcionaba cuando el robot era fijo. Ahora que se puede agregar y quitar
articulaciones, los dos **tienen que cambiar juntos**: si agrega una
articulación y olvida alargar la pose, `q[i]` queda `undefined` y la cinemática
devuelve `NaN`.

La solución es hacer imposible el error: un solo estado.

```tsx
import type { Design } from '../core/format';

const [design, setDesign] = useState<Design>({
  robot: PRESETS[0],
  pose: PRESETS[0].joints.map(jointValue),
});
```

Es el mismo tipo `Design` que serializa el archivo, así que guardar es
literalmente `serialize(design)`.

Ajuste los lugares donde antes usaba `robot` y `q`:

```tsx
<Simulator design={design} ... />
```

y dentro de `Simulator`, `design.robot` y `design.pose`.

> **Cuándo pasar a `useReducer`.** Con el estado agrupado y media docena de
> operaciones, `useState` con funciones ayudantes alcanza. Si esto crece a
> quince operaciones o aparece deshacer/rehacer, ahí sí conviene `useReducer`:
> concentra todos los cambios en una sola función y es más fácil de probar. No
> hace falta todavía.

```bash
git add .
git commit -m "refactor(app): agrupar robot y pose en un solo estado"
git push
```

---

## Paso 5 — Las operaciones de edición

Todas van en `App.tsx`. Cada una recibe el diseño anterior y devuelve uno nuevo
— **nunca** modifica el que recibió.

**`src/app/App.tsx`** — las operaciones:

```tsx
import type { Joint, JointType } from '../core/types';

/** Articulación que se agrega al presionar "+". */
function defaultJoint(): Joint {
  return {
    type: 'R',
    theta: 0,
    d: 0,
    a: 0.1,                      // 10 cm
    alpha: 0,
    qMin: -Math.PI,
    qMax: Math.PI,
  };
}

/** Límites por defecto según el tipo, en unidades SI. */
function defaultLimits(type: JointType) {
  return type === 'R'
    ? { qMin: -Math.PI, qMax: Math.PI }   // ±180°
    : { qMin: 0, qMax: 0.2 };             // 0 a 20 cm
}
```

Y dentro del componente:

```tsx
/** Cambia uno o varios campos de una articulación. */
function patchJoint(index: number, patch: Partial<Joint>) {
  setDesign(prev => {
    const joints = prev.robot.joints.map((j, i) =>
      i === index ? { ...j, ...patch } : j,
    );
    const j = joints[index];
    const pose = prev.pose.map((v, i) =>
      i === index ? Math.min(j.qMax, Math.max(j.qMin, v)) : v,
    );
    return { robot: { ...prev.robot, joints }, pose };
  });
}

/** Cambia el tipo: la variable articular pasa a ser otra, con otros límites. */
function changeType(index: number, type: JointType) {
  setDesign(prev => {
    const limits = defaultLimits(type);
    const joints = prev.robot.joints.map((j, i) =>
      i === index ? { ...j, type, ...limits } : j,
    );
    const pose = prev.pose.map((v, i) =>
      i === index ? (type === 'R' ? 0 : limits.qMin) : v,
    );
    return { robot: { ...prev.robot, joints }, pose };
  });
}

function addJoint() {
  setDesign(prev => {
    if (prev.robot.joints.length >= 8) return prev;   // tope sensato
    const j = defaultJoint();
    return {
      robot: { ...prev.robot, joints: [...prev.robot.joints, j] },
      pose: [...prev.pose, 0],
    };
  });
}

function removeJoint(index: number) {
  setDesign(prev => {
    if (prev.robot.joints.length <= 1) return prev;   // nunca dejar cero
    return {
      robot: {
        ...prev.robot,
        joints: prev.robot.joints.filter((_, i) => i !== index),
      },
      pose: prev.pose.filter((_, i) => i !== index),
    };
  });
}

function renameRobot(name: string) {
  setDesign(prev => ({ ...prev, robot: { ...prev.robot, name } }));
}
```

### Lo que hay que entender de este código

**`{ ...objeto, campo: valor }`** es el *spread*: copia todas las propiedades del
objeto y sobrescribe las que nombre después. Es la forma estándar de "cambiar"
algo sin mutarlo.

**`Partial<Joint>`** es un tipo de TypeScript que convierte todos los campos de
`Joint` en opcionales. Permite llamar `patchJoint(0, { a: 0.15 })` sin tener que
pasar los otros cinco campos.

**Cada operación toca el robot y la pose en el mismo `setDesign`.** Esa es la
razón del refactor del paso anterior: es imposible alargar uno y olvidar el otro.

**`patchJoint` reacota la pose.** Si el usuario baja `qMax` por debajo de la
posición actual, la pose se ajusta sola. Sin eso, el brazo quedaría fuera de sus
propios límites.

**Devolver `prev` sin cambios** (en `addJoint` cuando ya hay 8) es la forma
correcta de rechazar una operación: React detecta que el estado es el mismo
objeto y no repinta.

```bash
git add .
git commit -m "feat(app): operaciones de edición del diseño"
git push
```

---

## Paso 6 — `JointEditor.tsx`

Un componente por articulación con: encabezado, selector de tipo, los cuatro
parámetros DH y los límites.

**`src/ui/JointEditor.tsx`** — estructura:

```tsx
interface Props {
  joint: Joint;
  index: number;
  canDelete: boolean;
  onPatch: (index: number, patch: Partial<Joint>) => void;
  onChangeType: (index: number, type: JointType) => void;
  onDelete: (index: number) => void;
}
```

### El selector de tipo

Dos botones con `aria-pressed`, no un `<select>`: se ve mejor y comunica que son
dos opciones excluyentes.

```tsx
<div className="seg">
  <button
    aria-pressed={joint.type === 'R'}
    onClick={() => onChangeType(index, 'R')}
  >
    Revoluta
  </button>
  <button
    aria-pressed={joint.type === 'P'}
    onClick={() => onChangeType(index, 'P')}
  >
    Prismática
  </button>
</div>
```

`aria-pressed` le dice a los lectores de pantalla cuál está activo, y además
sirve para darle estilo con el selector CSS `[aria-pressed="true"]`.

### Los campos numéricos

Cada parámetro es un `<input type="number">` que trabaja en unidades de
interfaz. El de la variable articular va deshabilitado:

```tsx
const isVariable = (key: 'theta' | 'd') =>
  (joint.type === 'R' && key === 'theta') || (joint.type === 'P' && key === 'd');
```

Para θ y α, el valor mostrado es `toDeg(joint.theta)` y al escribir se convierte
con `toRad`. Para d y a, `toCm` y `toM`.

**Problema que se va a encontrar.** Si escribe esto:

```tsx
<input
  type="number"
  value={toCm(joint.a)}
  onChange={e => onPatch(index, { a: toM(Number(e.target.value)) })}
/>
```

...el campo se comporta raro: al borrar todo para escribir otro número, aparece
un 0; y si escribe "0,5" el punto decimal se le borra. Pasa porque el valor va y
vuelve convertido en cada tecla.

**Solución:** guarde el texto crudo en estado local y avise al padre solo cuando
sea un número válido.

```tsx
const [text, setText] = useState(String(toCm(joint.a)));

// si el valor cambia desde afuera (cargar un archivo), sincronice
useEffect(() => { setText(String(toCm(joint.a))); }, [joint.a]);

<input
  type="number"
  value={text}
  onChange={e => {
    setText(e.target.value);
    const n = Number(e.target.value);
    if (e.target.value !== '' && Number.isFinite(n)) {
      onPatch(index, { a: toM(n) });
    }
  }}
/>
```

Conviene sacar eso a un componente propio, `NumberField`, y usarlo en los seis
campos. Es el primer componente reutilizable del proyecto.

### Los límites

Dos campos, mínimo y máximo, en grados o centímetros según el tipo. Valide que
el mínimo sea menor que el máximo **antes** de llamar a `onPatch`; si no,
simplemente no avise al padre y deje que el usuario termine de escribir.

### Botón de eliminar

Deshabilitado cuando `canDelete` es falso (hay una sola articulación).

```bash
git add .
git commit -m "feat(ui): editor de articulaciones"
git push
```

---

## Paso 7 — Pestañas: Mover / Editar

El panel izquierdo ahora tiene dos modos. En `Simulator.tsx`:

```tsx
const [tab, setTab] = useState<'move' | 'edit'>('move');
```

```tsx
<div className="tabs">
  <button
    className="tab"
    aria-selected={tab === 'move'}
    onClick={() => setTab('move')}
  >
    Mover
  </button>
  <button
    className="tab"
    aria-selected={tab === 'edit'}
    onClick={() => setTab('edit')}
  >
    Editar
  </button>
</div>

{tab === 'move' ? (
  <JointSliders ... />
) : (
  <RobotEditor ... />
)}
```

El `{condición ? A : B}` es la forma de JSX de elegir entre dos cosas. Lo que no
se escoge **no se pinta**, no es que quede oculto con CSS: React lo desmonta.

> **Dato útil:** por eso el estado local de un componente se pierde al cambiar
> de pestaña. Si el usuario estaba escribiendo en un campo del editor, cambia a
> "Mover" y vuelve, el texto vuelve al valor del estado global. En este caso está
> bien y es lo esperado.

`RobotEditor.tsx` envuelve la lista: el nombre del robot arriba (un
`<input type="text">` conectado a `renameRobot`), los `JointEditor` en el medio,
y el botón "Agregar articulación" al final.

Agregue al CSS:

```css
.tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--line);
        margin-bottom: 12px; }
.tab { border: 0; background: none; padding: 8px 12px; cursor: pointer;
       color: var(--muted); border-bottom: 2px solid transparent;
       font-weight: 600; }
.tab[aria-selected="true"] { color: var(--ink);
                             border-bottom-color: var(--accent); }

.seg { display: inline-flex; border: 1px solid var(--line);
       border-radius: 5px; overflow: hidden; }
.seg button { border: 0; background: var(--panel-2); padding: 3px 9px;
              cursor: pointer; font-size: 12.5px; color: var(--muted); }
.seg button + button { border-left: 1px solid var(--line); }
.seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }

.fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.fields label { display: grid; gap: 2px; font-size: 11.5px;
                color: var(--muted); }
.fields input { padding: 4px 6px; border: 1px solid var(--line);
                border-radius: 4px; background: var(--panel-2);
                font-family: ui-monospace, monospace; width: 100%; }
.fields input:disabled { opacity: .55; }
```

```bash
git add .
git commit -m "feat(ui): pestañas mover y editar"
git push
```

---

## Paso 8 — Descargar el diseño

**`src/ui/download.ts`**

```ts
/** Dispara la descarga de un texto como archivo. */
export function downloadText(
  filename: string,
  text: string,
  mime = 'application/json',
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/** Convierte "Brazo Antropomórfico 3R" en "brazo-antropomorfico-3r". */
export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')                      // separa letras de sus tildes
      .replace(/[\u0300-\u036f]/g, '')       // borra las tildes sueltas
      .replace(/[^a-z0-9]+/g, '-')           // todo lo demás, a guiones
      .replace(/^-+|-+$/g, '')               // sin guiones al inicio ni al final
      .slice(0, 50) || 'brazo'
  );
}
```

Qué hace cada pieza de `downloadText`:

- **`new Blob([text], { type: mime })`** empaqueta el texto como si fuera un
  archivo en memoria.
- **`URL.createObjectURL(blob)`** le da una dirección temporal, del estilo
  `blob:https://...`, que el navegador sabe resolver.
- **`a.download = filename`** le dice al navegador que descargue en vez de
  navegar, y con qué nombre.
- **`a.click()`** simula el clic. No hace falta agregar el enlace al documento.
- **`URL.revokeObjectURL(url)`** libera la memoria. Sin esta línea, el blob se
  queda vivo hasta recargar la página: un usuario que guarde veinte veces deja
  veinte copias en memoria.

Sobre `normalize('NFD')`: separa cada letra acentuada en dos caracteres — la
letra base y la tilde. Así el `replace` siguiente borra solo las tildes y deja
"antropomorfico" en vez de perder la vocal.

### El botón

En la barra superior de `Simulator`:

```tsx
<button
  className="btn"
  onClick={() =>
    downloadText(`${slug(design.robot.name)}.armlab.json`, serialize(design))
  }
>
  Descargar
</button>
```

La doble extensión `.armlab.json` hace que el archivo se reconozca como JSON
—se puede abrir en cualquier editor— pero deja claro de dónde salió.

```bash
git add .
git commit -m "feat(ui): descargar el diseño como archivo"
git push
```

---

## Paso 9 — Cargar un archivo

Dos caminos para lo mismo: arrastrar el archivo sobre la página, o escogerlo con
un botón. Hacen falta los dos — arrastrar no funciona en móvil ni con teclado.

**`src/ui/useFileDrop.ts`** — un *hook* propio:

```ts
import { useState, useEffect } from 'react';

/**
 * Escucha archivos arrastrados sobre toda la ventana.
 * Devuelve si hay uno encima, para poder mostrar un aviso visual.
 */
export function useFileDrop(onFile: (file: File) => void): boolean {
  const [over, setOver] = useState(false);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();                 // sin esto, 'drop' nunca ocurre
      setOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setOver(false);   // salió de la ventana
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFile(file);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return over;
}
```

**La línea que decide todo** es `e.preventDefault()` en `dragover`. El
comportamiento por defecto del navegador al arrastrar un archivo es abrirlo en
una pestaña nueva; si no lo cancela, el evento `drop` **nunca se dispara**. Es el
error número uno con arrastrar y soltar, y no da ningún mensaje: simplemente no
pasa nada.

**Un detalle del hook:** `onFile` está en la lista de dependencias. Si el padre
define esa función dentro del cuerpo del componente, será una función nueva en
cada repintado y el efecto se desuscribirá y resuscribirá constantemente.
Envuélvala con `useCallback`:

```tsx
const handleFile = useCallback((file: File) => { ... }, []);
```

`useCallback` devuelve la misma función entre repintados mientras sus
dependencias no cambien.

### Leer el archivo

```tsx
async function handleFile(file: File) {
  if (file.size > 1_000_000) {
    setError('El archivo es demasiado grande para ser un diseño de ArmLab.');
    return;
  }
  const text = await file.text();
  const result = parse(text);
  if (!result.ok) {
    setError(result.error);
    return;
  }
  setDesign(result.design);
  setView('sim');
  setError(null);
}
```

`file.text()` devuelve una promesa con el contenido. `await` espera a que
llegue, y por eso la función se marca `async`.

El tope de tamaño es una precaución barata: un diseño de ArmLab pesa unos pocos
kilobytes. Si alguien suelta un video de 2 GB, mejor rechazarlo antes de
intentar leerlo.

### El botón de abrir

```tsx
<label className="btn">
  Abrir
  <input
    type="file"
    accept=".json,application/json"
    style={{ display: 'none' }}
    onChange={e => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = '';          // permite reabrir el mismo archivo
    }}
  />
</label>
```

Dos trucos:

- El `<input type="file">` es feo e imposible de maquetar, así que se esconde
  dentro de un `<label>`. Un clic sobre la etiqueta activa el campo.
- **`e.target.value = ''`** al final: sin esa línea, si el usuario abre un
  archivo, le hace un cambio y trata de abrir el mismo archivo otra vez, el
  evento `change` no se dispara —el valor no cambió— y parece que el botón se
  dañó.

### Mostrar el error

Un `useState<string | null>` y un recuadro que solo aparece si hay mensaje:

```tsx
{error && (
  <div className="error" role="alert">
    {error}
    <button onClick={() => setError(null)}>×</button>
  </div>
)}
```

`role="alert"` hace que los lectores de pantalla lo anuncien en cuanto aparece.

```bash
git add .
git commit -m "feat(ui): cargar diseños desde archivo"
git push
```

---

## Paso 10 — Avisos honestos

La página no guarda nada. Hay que decirlo, sin asustar.

### La franja

Discreta, arriba, con botón de cerrar:

```tsx
const [noticeOpen, setNoticeOpen] = useState(true);
```

```tsx
{noticeOpen && (
  <div className="notice">
    Esta página no guarda sus diseños. Descargue el archivo para conservarlo.
    <button onClick={() => setNoticeOpen(false)} aria-label="Cerrar aviso">
      ×
    </button>
  </div>
)}
```

```css
.notice {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 6px 16px; font-size: 12.5px;
  background: var(--panel-2); border-bottom: 1px solid var(--line);
  color: var(--muted);
}
.notice button { border: 0; background: none; cursor: pointer;
                 font-size: 16px; color: var(--muted); }
.error {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 8px 12px; margin-bottom: 10px;
  border: 1px solid #bf3328; border-radius: 5px; font-size: 13px;
}
```

### Avisar antes de cerrar

Si el usuario hizo cambios y va a cerrar la pestaña, el navegador puede
preguntarle si está seguro:

```tsx
useEffect(() => {
  if (!dirty) return;
  const handler = (e: BeforeUnloadEvent) => e.preventDefault();
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [dirty]);
```

`dirty` es un `useState<boolean>` que se pone en `true` en cada edición y vuelve
a `false` al descargar el archivo o al cargar uno.

Dos cosas que saber:

- El navegador muestra **su propio mensaje**, no uno personalizado. Se intentó
  abusar de esa función hace años y los navegadores la cerraron.
- Solo funciona si el usuario interactuó con la página antes. No se puede
  secuestrar una pestaña que nadie tocó.

> **No use el aviso si no hay cambios.** Un diálogo de "¿seguro que quiere
> salir?" en una página donde el usuario no hizo nada es la clase de detalle que
> hace que la gente no vuelva. Por eso va condicionado a `dirty`.

```bash
git add .
git commit -m "feat(ui): avisos de guardado"
git push
```

---

## Paso 11 — Empezar desde cero

En la galería, una tarjeta más —visualmente distinta— que abre un brazo mínimo:

```tsx
const EMPTY: Design = {
  robot: {
    name: 'Mi brazo',
    joints: [
      { type: 'R', theta: 0, d: 0.05, a: 0.1, alpha: 0,
        qMin: -Math.PI, qMax: Math.PI },
      { type: 'R', theta: 0, d: 0,    a: 0.1, alpha: 0,
        qMin: -Math.PI, qMax: Math.PI },
    ],
  },
  pose: [0, 0],
};
```

Dos articulaciones de revoluta, no una: con una sola el usuario no ve que es un
brazo. Dos ya forman una cadena reconocible y tiene algo que mover.

Al abrirlo, lleve al usuario directo a la pestaña **Editar**. Es lo que viene a
hacer.

Agregue también el botón de **Abrir** en la galería, no solo dentro del
simulador: alguien que vuelve con su archivo guardado debe poder abrirlo desde
la primera pantalla.

```bash
git add .
git commit -m "feat(app): crear un brazo desde cero"
git push
```

---

## Paso 12 — Publicar

```bash
npm test
```
Las pruebas del formato deben pasar todas.

```bash
npm run build
```
Verifica los tipos y empaqueta. Si falla, falla también en el servidor.

```bash
npm run preview
```
Sirve `dist/` localmente. **Pruebe aquí la descarga y la carga**: el
comportamiento de los blobs puede variar entre el modo desarrollo y el sitio
compilado.

```bash
git push
```

Vercel republica solo. Espere el minuto y pruebe en el sitio real: descargue un
diseño, recargue la página y vuelva a cargarlo arrastrándolo.

---

## Lista de verificación

La Fase 2 está cerrada cuando:

- [ ] Se pueden agregar y quitar articulaciones, y el brazo 3D responde
- [ ] Cambiar de revoluta a prismática funciona y los límites se ajustan solos
- [ ] Los campos numéricos se dejan editar sin saltos ni ceros fantasma
- [ ] Se descarga un `.armlab.json` con nombre legible
- [ ] Arrastrar ese archivo sobre la página lo abre
- [ ] El botón "Abrir" funciona, **incluso con el mismo archivo dos veces**
- [ ] Un archivo corrupto muestra un mensaje claro y no rompe nada
- [ ] El aviso de "no se guarda" está visible y se puede cerrar
- [ ] Las pruebas de ida y vuelta pasan
- [ ] Publicado y probado en el sitio real

---

## Problemas frecuentes

**Suelto el archivo y no pasa nada.**
Falta `e.preventDefault()` en el manejador de `dragover`. Es el error clásico y
no da ningún aviso.

**El evento de arrastre se dispara cientos de veces.**
`dragover` se emite continuamente mientras el cursor se mueve. Si dentro llama a
`setOver(true)` sin condición, React repinta en cada uno. Guarde el estado solo
cuando cambie: `setOver(prev => prev || true)` no sirve —use una comprobación
explícita o acepte el repintado, que es barato porque el valor no cambia.

**Escribir en un campo numérico es un suplicio.**
Está convirtiendo unidades en cada tecla. Use el patrón de texto crudo en estado
local del Paso 6.

**Agregué una articulación y el robot desapareció.**
La pose quedó más corta que la lista de articulaciones y la cinemática devolvió
`NaN`. Revise que `addJoint` alargue las dos cosas en el mismo `setDesign`.

**Cambié el tipo a prismática y el brazo se fue al infinito.**
Los límites quedaron en radianes (±3,14) pero ahora se interpretan como metros:
el brazo se estira 3 metros. Por eso `changeType` reemplaza los límites.

**Abrir el mismo archivo dos veces no hace nada.**
Falta `e.target.value = ''` al final del `onChange` del `<input type="file">`.

**La descarga trae el archivo vacío o corrupto en el sitio publicado.**
Revise que `URL.revokeObjectURL` esté **después** del `click()`. Si lo llama
antes, el enlace apunta a un blob que ya no existe.

---

## Al terminar

Abra un chat nuevo, adjunte `armlab-especificaciones.md` y pida la **Fase 3:
Mover** — trayectorias con línea de tiempo, interpolación entre poses y la
cinemática inversa por DLS que ya está en el núcleo desde la Fase 0.

---

## Notas de implementación

Lo que se hizo distinto al plan de arriba, y por qué. El código es la
referencia; este plan queda como explicación de cada paso.

| Paso | Cambio respecto al plan | Por qué |
|---|---|---|
| 3 | `PRESETS.servo4` en vez de `PRESETS[0]` | `PRESETS` es un objeto con claves, no un arreglo. |
| 3 | Ida y vuelta con los nueve robots, no solo uno | Cubre prismáticas y nombres con tildes. |
| 3 | Un valor de pose que no es número pasa a 0 (acotado), no a `qMin` | Una revoluta de ±180° abría en −180°. |
| 5 | Las operaciones viven en `src/core/edit.ts` como funciones puras, con pruebas (`edit.test.ts`). `App.tsx` solo hace `setDesign(d => patchJoint(d, i, patch))` | Se prueban sin React. Además, funciones locales sin usar dentro de `App` no compilan con `noUnusedLocals` hasta el paso 7. |
| 5 | `patchJoint` recibe `JointPatch` (todo menos `type`) y rechaza límites cruzados | El tipo solo se cambia con `changeJointType`, que ajusta límites y pose. |
| 5 | `changeJointType` deja fijo el parámetro que era variable en su valor actual, y la nueva variable arranca donde estaba | El brazo no salta al cambiar el tipo: solo cambia qué mueve el deslizador. |
| 6 | `NumberField` es `type="text"` y lee con `parseDecimal` (acepta `12,5` y `12.5`) | Cada navegador trata distinto la coma en `type="number"`. |
| 6 | `NumberField` se sincroniza durante el render (patrón "ajustar estado cuando cambia una prop"), no con `useEffect` | oxlint marca `set-state-in-effect`; así tampoco hay un cuadro con el texto viejo. |
| 6 | Flechas ↑ ↓ suben y bajan el valor; un valor rechazado (límites cruzados) marca el campo en rojo y al salir vuelve al real | Experimentar con DH viendo el brazo moverse. |
| 6 | El campo variable (deshabilitado) muestra el valor actual de la pose | Coincide con la tabla DH del panel derecho. |
| 7 | Pestañas con `role="tablist"` / `role="tab"` | `aria-selected` solo tiene sentido dentro de esos roles. |
| 7 | El visor recibe `frameKey` y encuadra la cámara solo al abrir un diseño | Con el editor el robot cambia en cada tecla y la cámara saltaba mientras se usaba. |
| 8 | `revokeObjectURL` espera un segundo después del `click()` | En algunos navegadores la descarga arranca un instante después. |
| 8 | `slug` corta a 50 caracteres antes de quitar guiones de los extremos | Si no, el nombre podía terminar en `-`. |
| 9 | `useFileDrop` cuenta `dragenter` / `dragleave` y solo reacciona si se arrastran archivos | Safari reporta `relatedTarget` nulo siempre; arrastrar texto de la página no debe mostrar el aviso. |
| 9 | "Abrir" es un `<button>` que hace clic en el `<input type="file">` escondido (`OpenFileButton`) | Una `<label>` no se alcanza con Tab: el botón existe justamente para quien no puede arrastrar. |
| 10 | `dirty` sube solo con ediciones de estructura, no con los deslizadores | Mover un ejemplo no es "trabajo sin guardar". |
| 10 | Confirmación antes de reemplazar un diseño con cambios, marca "Cambios sin descargar" y botón "Volver a «…»" en la galería | Sin esto, ir a la galería y abrir otro ejemplo borraba el trabajo en silencio, y no había cómo volver al diseño. |
