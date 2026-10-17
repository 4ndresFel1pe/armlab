# ArmLab — Fase 0: el motor

> **Estado:** ✅ terminada.
>
> **Objetivo:** tener el repositorio creado en GitHub y el núcleo matemático
> (`src/core/`) portado a TypeScript, con pruebas que pasen.
>
> **Al terminar esta fase todavía no hay nada visual.** Es la fase menos vistosa
> y la más valiosa: un motor de cinemática con pruebas es exactamente lo que un
> revisor técnico busca en un portafolio.
>
> **Material necesario:** el archivo `Simulador de Brazo Robótico.html`, en el
> bloque `==MATH-START==` / `==MATH-END==`.

---

## Índice de pasos

| # | Paso | Commit |
|---|---|---|
| 1 | Requisitos previos | — |
| 2 | Crear el proyecto con Vite | ✅ |
| 3 | Conectar con GitHub | push |
| 4 | Limpiar la plantilla | ✅ |
| 5 | Crear la estructura de carpetas | ✅ |
| 6 | Instalar Vitest | ✅ |
| 7 | `types.ts` — el contrato | ✅ |
| 8 | `linalg.ts` — álgebra lineal | ✅ |
| 9 | `dh.ts` — Denavit–Hartenberg | ✅ |
| 10 | `kinematics.ts` — cinemática directa | ✅ |
| 11 | `jacobian.ts` — Jacobiano geométrico | ✅ |
| 12 | `manipulability.ts` — Yoshikawa | ✅ |
| 13 | `presets.ts` — robots de ejemplo | ✅ |
| 14 | README y cierre | ✅ |

---

## Paso 1 — Requisitos previos

Verifique que tiene lo necesario. Abra una terminal y ejecute:

```bash
node --version
```
Muestra la versión de Node.js. **Necesita 20 o superior.** Si no lo tiene,
descárguelo de nodejs.org (la versión marcada LTS).

```bash
npm --version
```
`npm` es el gestor de paquetes de Node. Viene incluido con Node, así que si el
comando anterior funcionó, este también debería.

```bash
git --version
```
Verifica que Git está instalado. Si no, descárguelo de git-scm.com.

Si es la primera vez que usa Git en este equipo, configure su identidad —
queda grabada en cada commit:

```bash
git config --global user.name "Andres Felipe"
git config --global user.email "su-correo@ejemplo.com"
```
- `config` edita la configuración de Git.
- `--global` aplica a todos los repositorios de su usuario, no solo a uno.

---

## Paso 2 — Crear el proyecto con Vite

Ubíquese en la carpeta donde guarda sus proyectos y ejecute:

```bash
npm create vite@latest armlab -- --template react-ts
```

Desglose:
- `npm create vite@latest` descarga y ejecuta el generador de proyectos de Vite
  en su versión más reciente. No instala nada permanente.
- `armlab` es el nombre de la carpeta que va a crear.
- `--` separa los argumentos de `npm` de los argumentos del generador. Sin esto,
  npm se come la bandera siguiente.
- `--template react-ts` elige la plantilla de React con TypeScript.

Luego:

```bash
cd armlab
```
Entra a la carpeta recién creada.

```bash
npm install
```
Lee `package.json` e instala todas las dependencias dentro de `node_modules/`.
La primera vez tarda un poco.

```bash
npm run dev
```
Levanta el servidor de desarrollo. Le imprime una dirección (normalmente
`http://localhost:5173`). Ábrala: debe ver la página de bienvenida de Vite +
React. Con eso confirma que todo quedó bien.

Para detener el servidor: `Ctrl + C` en la terminal.

### Commit

```bash
git init -b main
```
- `init` crea el repositorio Git local (una carpeta oculta `.git/`).
- `-b main` nombra la rama inicial `main` en vez de `master`.

```bash
git add .
```
Pone todos los archivos nuevos o modificados en el *área de preparación*
(staging), que es la lista de lo que va a entrar al próximo commit. El punto
significa "todo desde la carpeta actual hacia abajo".

```bash
git commit -m "chore: proyecto base con Vite + React + TypeScript"
```
- `commit` guarda una instantánea de lo que está en staging.
- `-m` permite escribir el mensaje ahí mismo; sin esa bandera, Git abre un
  editor de texto.

> Vite ya incluye un `.gitignore` que excluye `node_modules/` y `dist/`.
> Esas carpetas **nunca** se suben: la primera pesa cientos de megas y se
> regenera con `npm install`; la segunda es código compilado.

---

## Paso 3 — Conectar con GitHub

**En la web de GitHub:**

1. Botón **New repository**.
2. Nombre: `armlab`.
3. Público.
4. ⚠️ **No marque** "Add a README", ni `.gitignore`, ni licencia. Si GitHub crea
   archivos, el repositorio remoto tendrá commits que el suyo local no conoce y
   el primer `push` va a fallar.
5. **Create repository.**

**De vuelta en la terminal:**

```bash
git remote add origin https://github.com/4ndresFel1pe/armlab.git
```
- `remote add` registra un repositorio remoto.
- `origin` es el nombre corto que le da (es la convención).
- Después va la URL que GitHub le muestra.

```bash
git push -u origin main
```
- `push` sube los commits locales al remoto.
- `-u` (de *upstream*) vincula su rama `main` local con la `main` de `origin`.
  Gracias a eso, de aquí en adelante basta escribir `git push` a secas.

Recargue la página de GitHub: ya debe ver sus archivos.

> **De aquí en adelante**, después de cada commit ejecute `git push` para
> mantener el repositorio alimentado.

---

## Paso 4 — Limpiar la plantilla

La plantilla de Vite trae una demo que estorba.

**Borre** estos archivos:
- `src/App.css`
- `src/assets/react.svg`
- `public/vite.svg`

> **Con Vite 8** la plantilla trae otros archivos de demo: `src/assets/hero.png`,
> `src/assets/vite.svg`, `public/icons.svg` y `public/favicon.svg`. También
> sobran. Y al reemplazar el bloque `"scripts"` en el Paso 6, conserve el
> script `"lint": "oxlint"` que trae la plantilla.

**Reemplace** el contenido de `src/App.tsx` por algo mínimo:

```tsx
function App() {
  return <h1>ArmLab</h1>;
}

export default App;
```

**Limpie** `src/index.css`: borre todo lo que traía y déjelo vacío por ahora
(los estilos vienen en la Fase 1).

**Revise** `src/main.tsx`: si quedó alguna importación de `App.css`, bórrela.
Las importaciones de `./index.css` y de `App` se quedan.

**Verifique** que `index.html` no haga referencia a `vite.svg` en el `<link rel="icon">`;
si la hace, borre esa línea.

Ejecute `npm run dev` otra vez. Debe ver solo el título "ArmLab" sin errores en
la consola del navegador.

```bash
git add .
git commit -m "chore: limpiar plantilla de Vite"
git push
```

---

## Paso 5 — Crear la estructura de carpetas

Dentro de `src/`, cree estas carpetas:

```
src/
├── core/      ← matemática y modelo del robot (TypeScript puro)
├── viewer/    ← componente 3D (Fase 1)
├── ui/        ← paneles y controles (Fase 1)
└── app/       ← páginas y navegación (Fase 1)
```

En esta fase solo se llena `core/`. Las otras tres quedan vacías; Git no sube
carpetas vacías, así que no aparecerán en GitHub hasta que tengan archivos. No
es problema.

> **Recuerde la regla:** nada dentro de `core/` puede importar React, three.js
> ni tocar el DOM. Si algún archivo de `core/` tiene un `import` de esos, algo se
> desvió del diseño.

---

## Paso 6 — Instalar Vitest

```bash
npm install -D vitest
```
- `install` instala un paquete.
- `-D` (abreviatura de `--save-dev`) lo registra como *dependencia de
  desarrollo*: se usa para probar, no forma parte del sitio publicado.

Abra `package.json` y agregue un script dentro del bloque `"scripts"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview",
  "test": "vitest"
}
```

> Los demás ya existen; solo agregue `"test"` y recuerde la coma al final de la
> línea anterior.

Ahora `npm test` ejecuta las pruebas en modo observador: se quedan corriendo y
se vuelven a ejecutar solas cada vez que guarda un archivo.

```bash
git add .
git commit -m "chore: configurar Vitest"
git push
```

---

## Paso 7 — `types.ts`, el contrato

Este es el archivo del que depende todo lo demás. Se lo doy completo porque
define el diseño del núcleo.

**`src/core/types.ts`**

```ts
/**
 * Tipos base del núcleo de ArmLab.
 *
 * CONVENCIÓN DE UNIDADES: todo el núcleo trabaja en SI.
 *   - longitudes en metros
 *   - ángulos en radianes
 *   - masas en kilogramos
 * La conversión a centímetros y grados ocurre solo en la interfaz.
 */

/** Tipo de articulación: Revoluta (gira) o Prismática (desliza). */
export type JointType = 'R' | 'P';

/**
 * Una articulación descrita con los cuatro parámetros DH estándar.
 *
 * La variable articular q es:
 *   - theta, si el tipo es 'R'
 *   - d,     si el tipo es 'P'
 * El otro parámetro queda fijo.
 */
export interface Joint {
  type: JointType;
  /** Ángulo de x(i-1) a x(i) alrededor de z(i-1). Radianes. */
  theta: number;
  /** Desplazamiento sobre z(i-1). Metros. */
  d: number;
  /** Longitud del eslabón, sobre x(i). Metros. */
  a: number;
  /** Torsión: ángulo de z(i-1) a z(i) alrededor de x(i). Radianes. */
  alpha: number;
  /** Límite inferior de q. Radianes si es 'R', metros si es 'P'. */
  qMin: number;
  /** Límite superior de q. */
  qMax: number;
}

/** Un robot: una cadena serial de articulaciones. */
export interface Robot {
  name: string;
  joints: Joint[];
}

/** Vector de 3 componentes: [x, y, z]. */
export type Vec3 = [number, number, number];

/** Fila de una matriz 4x4. */
export type Row4 = [number, number, number, number];

/**
 * Matriz homogénea 4x4, almacenada por filas.
 * M[fila][columna] — igual que en los libros de texto.
 */
export type Mat4 = [Row4, Row4, Row4, Row4];

/** Matriz de tamaño variable (el Jacobiano es 6 x n). */
export type Matrix = number[][];
```

Fíjese en `Mat4`: al declararla como cuatro filas de exactamente cuatro números,
TypeScript le avisa si escribe una matriz con una fila de tres. Con `number[][]`
no se daría cuenta.

```bash
git add .
git commit -m "feat(core): tipos base del núcleo"
git push
```

---

## Paso 8 — `linalg.ts`, álgebra lineal

**Qué hay que portar** del HTML (bloque `==MATH-START==`):

| Función en el HTML | Qué hace |
|---|---|
| `eye(n)` | Matriz identidad |
| `matMul(A, B)` | Producto de matrices |
| `transpose(A)` | Transpuesta |
| `col3(T, c)` | Columna `c` de una 4x4, solo filas 0–2 |
| `sub3(a, b)` | Resta de vectores |
| `cross3(a, b)` | Producto cruz |
| `norm3(a)` | Magnitud |
| `clamp(v, lo, hi)` | Acota un valor a un rango |
| `symEig(S)` | Valores y vectores propios (método de Jacobi) |
| `solve3(A, b)` | Resuelve un sistema 3x3 por regla de Cramer |

**El trabajo de portar** es básicamente:
1. Copiar el cuerpo de la función.
2. Agregarle tipos a los parámetros y al retorno.
3. Ponerle `export` adelante.

Ejemplo de cómo queda una:

```ts
import type { Vec3 } from './types';

/** Producto cruz de dos vectores de 3 componentes. */
export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
```

> `import type` en vez de `import` normal: le dice a TypeScript que solo
> necesita esos nombres para verificar tipos, y los borra al compilar. Es la
> forma correcta de importar interfaces y alias de tipo.

**El único complicado es `symEig`.** Devuelve un objeto con dos cosas, así que
necesita un tipo de retorno:

```ts
export interface EigenResult {
  /** Valores propios, en el orden en que los dejó el algoritmo. */
  values: number[];
  /** vectors[k][p] = componente k del vector propio p. */
  vectors: number[][];
}

export function symEig(S: Matrix): EigenResult {
  // ... portar tal cual del HTML
}
```

El cuerpo se copia sin tocar: es método de Jacobi para matrices simétricas y ya
está probado.

> **TypeScript 6 trae `strict` activado por defecto.** En `solve3` aparecen dos
> errores al copiar tal cual: el parámetro de la función interna `det` necesita
> tipo (`(M: Matrix) =>`), y el `.map()` final devuelve `number[]`, no `Vec3`
> (se arregla devolviendo `[x(0), x(1), x(2)]`).

### Prueba

**`src/core/linalg.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { cross3, norm3, matMul, eye } from './linalg';

describe('linalg', () => {
  it('cross3: x cruz y da z', () => {
    expect(cross3([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });

  it('norm3: vector 3-4-0 mide 5', () => {
    expect(norm3([3, 4, 0])).toBe(5);
  });

  it('matMul: multiplicar por la identidad no cambia nada', () => {
    const A = [[1, 2], [3, 4]];
    expect(matMul(A, eye(2))).toEqual(A);
  });
});
```

Cómo se lee:
- `describe` agrupa pruebas relacionadas; el texto sale en el reporte.
- `it` es una prueba individual. El texto describe qué debería pasar.
- `expect(...).toEqual(...)` compara en profundidad (sirve para arreglos y
  objetos). `toBe(...)` compara por identidad, para números y textos.

Ejecute `npm test`. Debe ver las tres en verde.

```bash
git add .
git commit -m "feat(core): álgebra lineal con pruebas"
git push
```

---

## Paso 9 — `dh.ts`, Denavit–Hartenberg

Se lo doy completo. Es corto y es el corazón de todo.

**`src/core/dh.ts`**

```ts
import type { Joint, Mat4 } from './types';

/**
 * Matriz homogénea de la convención DH estándar:
 *
 *   A = Rot_z(theta) · Trans_z(d) · Trans_x(a) · Rot_x(alpha)
 *
 * @param theta  radianes
 * @param d      metros
 * @param a      metros
 * @param alpha  radianes
 */
export function dhMatrix(
  theta: number,
  d: number,
  a: number,
  alpha: number,
): Mat4 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca,  st * sa, a * ct],
    [st,  ct * ca, -ct * sa, a * st],
    [0,   sa,       ca,      d     ],
    [0,   0,        0,       1     ],
  ];
}

/** Valor actual de la variable articular q: theta si es 'R', d si es 'P'. */
export function jointValue(j: Joint): number {
  return j.type === 'R' ? j.theta : j.d;
}

/**
 * Los cuatro parámetros DH de una articulación, listos para `dhMatrix`.
 * Si se pasa `q`, sustituye la variable articular correspondiente.
 */
export function dhParams(
  j: Joint,
  q?: number,
): [number, number, number, number] {
  const v = q ?? jointValue(j);
  const theta = j.type === 'R' ? v : j.theta;
  const d = j.type === 'P' ? v : j.d;
  return [theta, d, j.a, j.alpha];
}
```

Dos detalles de TypeScript que vale la pena notar:

- `q?: number` — el signo de interrogación marca el parámetro como opcional.
  Quien llame la función puede omitirlo.
- `q ?? jointValue(j)` — el operador `??` (*nullish coalescing*) devuelve el
  lado derecho solo si el izquierdo es `null` o `undefined`. Importante: con
  `||` habría un error, porque `q = 0` es un valor válido pero "falsy", y se
  reemplazaría sin querer.

### Prueba

La prueba va en un archivo aparte, **`src/core/dh.test.ts`**, junto a `dh.ts`.
Vitest ejecuta solo los archivos que terminan en `.test.ts`.

Un caso que se verifica a mano: con `theta = 0`, `d = 0`, `a = L`, `alpha = 0`,
la matriz debe ser una traslación pura de `L` sobre el eje x.

```ts
import { describe, it, expect } from 'vitest';
import { dhMatrix } from './dh';

describe('dhMatrix', () => {
  it('con todo en cero salvo a, da una traslación en x', () => {
    const A = dhMatrix(0, 0, 0.5, 0);
    expect(A[0][3]).toBeCloseTo(0.5);  // posición x
    expect(A[1][3]).toBeCloseTo(0);    // posición y
    expect(A[2][3]).toBeCloseTo(0);    // posición z
  });

  it('girar 90 grados pone la traslación sobre y', () => {
    const A = dhMatrix(Math.PI / 2, 0, 0.5, 0);
    expect(A[0][3]).toBeCloseTo(0);
    expect(A[1][3]).toBeCloseTo(0.5);
  });
});
```

`toBeCloseTo` compara con tolerancia. **Úselo siempre con decimales**: con
`toBe` la prueba fallaría porque `Math.cos(Math.PI/2)` no da exactamente 0, sino
algo como `6.1e-17`.

```bash
git add .
git commit -m "feat(core): matriz DH estándar"
git push
```

---

## Paso 10 — `kinematics.ts`, cinemática directa

Porte `forwardKinematics()` y `rpyZYX()` del HTML.

Firma sugerida:

```ts
export interface ForwardResult {
  /** A[i] = matriz de la articulación i. */
  A: Mat4[];
  /** T[i] = transformación del marco 0 al marco i. T[0] es la identidad. */
  T: Mat4[];
}

export function forwardKinematics(
  joints: Joint[],
  q?: number[],
): ForwardResult
```

El parámetro `q` opcional permite evaluar el robot en una configuración distinta
a la actual sin modificar el objeto — lo necesita la Fase 3 y los barridos de
manipulabilidad.

> `eye()` y `matMul()` devuelven `Matrix`, no `Mat4`. Como un producto 4×4 · 4×4
> siempre da 4×4, aquí es seguro usar la aserción `as Mat4`. Y `rpyZYX` en el
> HTML devolvía grados: en el núcleo devuelve **radianes**.

**Agregue también** una función de conveniencia que no existe en el HTML pero se
va a usar mucho:

```ts
/** Posición del efector final en el marco base. */
export function endEffectorPosition(joints: Joint[], q?: number[]): Vec3
```

### Prueba

Un brazo planar 2R con eslabones de 1 m cada uno:

```ts
const arm: Joint[] = [
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
];
```

- Con `q = [0, 0]`, la punta debe quedar en `(2, 0, 0)`: estirado sobre x.
- Con `q = [π/2, 0]`, en `(0, 2, 0)`: estirado sobre y.
- Con `q = [0, π/2]`, en `(1, 1, 0)`: primer eslabón sobre x, segundo doblado
  hacia y.

Esos tres casos se verifican dibujándolos en papel. Si pasan, la cinemática
directa está bien.

```bash
git add .
git commit -m "feat(core): cinemática directa"
git push
```

---

## Paso 11 — `jacobian.ts`

Porte `geometricJacobian()` y `taskJacobian()` del HTML.

```ts
/** Jacobiano geométrico 6 x n. Filas 0-2: velocidad lineal. Filas 3-5: angular. */
export function geometricJacobian(joints: Joint[], T: Mat4[]): Matrix
```

Las fórmulas, para tenerlas a mano:

```
Revoluta:    J_i = [ z(i-1) × (o_n − o(i-1)) ;  z(i-1) ]
Prismática:  J_i = [ z(i-1) ;  0 ]
```

### Prueba

Con el mismo brazo 2R de arriba en `q = [0, 0]` (estirado sobre x):

- Mover solo la primera articulación hace que la punta se mueva en **+y** a
  razón de 2 m por radián (porque está a 2 m del eje). Entonces
  `J[1][0]` debe dar `2`.
- La segunda articulación mueve la punta en **+y** a 1 m por radián:
  `J[1][1]` debe dar `1`.
- Ninguna de las dos mueve la punta en x: `J[0][0]` y `J[0][1]` deben dar `0`.

```bash
git add .
git commit -m "feat(core): jacobiano geométrico"
git push
```

---

## Paso 12 — `manipulability.ts`

Porte `singularValues()` y `manipulability()` del HTML.

```ts
export interface ManipulabilityResult {
  /** Filas del Jacobiano de tarea. */
  m: number;
  /** Número de articulaciones. */
  n: number;
  /** Valores singulares, de mayor a menor. */
  s: number[];
  /** Medida de Yoshikawa: w = raíz(det(J·Jᵀ)) */
  w: number;
  rank: number;
  /** Rango máximo posible: min(m, n). */
  full: number;
  /** Número de condición: sigma_max / sigma_min. */
  kappa: number;
  /** Isotropía: 1 / kappa. Entre 0 y 1. */
  iso: number;
}

export function manipulability(M: Matrix): ManipulabilityResult
```

### Prueba

El brazo 2R totalmente estirado (`q = [0, 0]`) es **singular**: la punta no
puede moverse en la dirección radial. Entonces:

- `w` debe dar prácticamente `0` (use `toBeCloseTo(0)`).
- `rank` debe ser `1`, no `2`.

Y doblado a 90 grados (`q = [0, π/2]`), `w` debe ser claramente mayor que cero.

Esa pareja de pruebas es la mejor validación de todo el módulo: confirma que el
detector de singularidades funciona.

```bash
git add .
git commit -m "feat(core): manipulabilidad de Yoshikawa"
git push
```

---

## Paso 13 — `presets.ts`, robots de ejemplo

Porte el objeto `PRESETS` del HTML: son nueve configuraciones (planar 2R, planar
3R, antropomórfico, SCARA, cilíndrico, cartesiano, Stanford, PUMA, brazo de
servos).

⚠️ **Dos conversiones obligatorias** al portar, porque en el HTML estaban en
otras unidades:

- Longitudes (`d`, `a`): estaban en **centímetros** → divida entre 100.
- Ángulos (`theta`, `alpha`, `qMin`, `qMax`): estaban en **grados** →
  multiplique por `Math.PI / 180`.

Conviene escribir un ayudante para no equivocarse:

```ts
const deg = (g: number) => (g * Math.PI) / 180;
const cm  = (c: number) => c / 100;
```

Y usarlo al declarar cada robot, de modo que los números del archivo sigan
leyéndose en las unidades familiares:

```ts
{ type: 'R', theta: deg(30), d: cm(0), a: cm(12), alpha: deg(0),
  qMin: deg(-180), qMax: deg(180) }
```

### Prueba

Una sola, pero cubre mucho: recorra **todos** los presets y verifique que la
cinemática directa no devuelve `NaN` en ninguno. Si un preset quedó mal portado,
esa prueba lo atrapa.

```bash
git add .
git commit -m "feat(core): robots de ejemplo"
git push
```

---

## Paso 14 — README y cierre

Cree un `README.md` en la raíz. Lo va a leer quien entre al repositorio desde su
portafolio, así que vale la pena:

````markdown
# ArmLab

Simulador web de brazos robóticos seriales para estudiantes.

Cinemática directa por Denavit–Hartenberg, Jacobiano geométrico y
manipulabilidad de Yoshikawa — todo calculado en el navegador.

## Estado

🚧 En construcción. Fase 0: núcleo matemático.

## Desarrollo

```bash
npm install   # instalar dependencias
npm run dev   # servidor de desarrollo
npm test      # ejecutar pruebas
npm run build # compilar para producción
```

## Arquitectura

- `src/core/` — matemática y modelo del robot. TypeScript puro, sin DOM.
- `src/viewer/` — visualización 3D.
- `src/ui/` — componentes de interfaz.
- `src/app/` — páginas y navegación.
````

```bash
git add .
git commit -m "docs: README del proyecto"
git push
```

Guarde también este documento y el de especificaciones:

```bash
mkdir docs
```
Crea la carpeta. Mueva ahí `armlab-especificaciones.md` y `armlab-fase-0.md`.

```bash
git add .
git commit -m "docs: especificaciones y plan de la fase 0"
git push
```

---

## Lista de verificación

La Fase 0 está cerrada cuando:

- [x] `npm run dev` levanta sin errores
- [x] `npm test` pasa todas las pruebas
- [x] `npm run build` compila sin errores de TypeScript
- [x] Ningún archivo de `src/core/` importa React, three.js ni toca el DOM
- [x] El repositorio está en GitHub con los commits separados por paso
- [x] Los nueve presets pasan la prueba de cinemática directa

---

## Problemas frecuentes

**`git push` rechazado con "updates were rejected".**
Casi siempre es porque GitHub creó un README al armar el repositorio. Solución:
ejecute `git pull --rebase origin main` y vuelva a hacer push. Ese comando trae
los commits del remoto y pone los suyos encima.

**TypeScript se queja de "Type 'number[]' is not assignable to type 'Mat4'".**
Está devolviendo un arreglo genérico donde se espera la tupla de cuatro filas de
cuatro. Pasa cuando construye la matriz con `map` o similar. Lo más limpio es
escribir las cuatro filas literales, como en `dhMatrix`.

**Una prueba falla por decimales.**
Está usando `toBe` donde debería usar `toBeCloseTo`. Nunca compare resultados de
funciones trigonométricas por igualdad exacta.

**El preset da posiciones enormes o diminutas.**
Se le olvidó convertir centímetros a metros, o grados a radianes. Revise el
Paso 13.

---

## Al terminar

Abra un chat nuevo, adjunte `armlab-especificaciones.md` y pida la **Fase 1:
Ver** — galería de ejemplos, visor 3D y deslizadores por articulación. Ahí entra
React de verdad.
