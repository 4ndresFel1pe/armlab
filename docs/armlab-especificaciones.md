# ArmLab — Especificaciones del proyecto

> Documento de contexto. Sirve para retomar el proyecto en cualquier momento o
> para abrir un chat nuevo con toda la información necesaria.
>
> **Estado:** Fase 0 terminada — núcleo matemático en `src/core/` con pruebas.
> **Siguiente paso:** Fase 1 — Ver.

---

## 1. Qué es

Un simulador web de brazos robóticos **seriales** para estudiantes.

El usuario entra, explora brazos de ejemplo, arma el suyo con parámetros
Denavit–Hartenberg, lo mueve, le define trayectorias y se descarga un archivo
con el diseño y su ficha técnica.

**Nombre:** ArmLab
**Repositorio:** `github.com/4ndresFel1pe/armlab`
**Naturaleza:** proyecto personal de portafolio. Sin fecha límite, sin equipo,
sin cliente. Se avanza por pedazos.

### Para quién

Dos perfiles, los dos importan:

- **El que ya vio robótica**: quiere experimentar con DH, Jacobiano,
  singularidades y manipulabilidad.
- **El que va empezando**: quiere entender qué es una articulación, ver el brazo
  moverse y, si le interesa, obtener información suficiente para intentar
  construirlo.

La interfaz debe servir a los dos: lo básico visible, lo avanzado disponible
pero sin estorbar.

### Los primeros 10 minutos del usuario

1. Entra y ve una galería de brazos de ejemplo.
2. Abre uno, lo mueve con deslizadores, ve la punta desplazarse en 3D.
3. Si le interesa, entra a "crear" y empieza el suyo.
4. Lo descarga como archivo. La página avisa que no guarda nada.

---

## 2. Alcance

### Dentro

- Cadenas **seriales** con convención **DH estándar**.
- Cinemática directa, Jacobiano geométrico, valores singulares,
  manipulabilidad de Yoshikawa, cinemática inversa por DLS.
- Articulaciones de revoluta (R) y prismáticas (P).
- Visualización 3D interactiva.
- Trayectorias: el usuario marca poses, la aplicación las reproduce.
- Descarga y carga de diseños en archivo `.json`.
- Ficha técnica para quien quiera construirlo: medidas de eslabones, rangos de
  cada articulación, **torque requerido por articulación**, volumen del espacio
  de trabajo.

### Fuera (decidido explícitamente)

- ❌ **Cotización y precios.** Un catálogo de componentes envejece mal y no
  aporta a lo educativo.
- ❌ **Anuncios.** Condicionar una descarga a ver un anuncio va contra las
  políticas de AdSense, el ingreso a esta escala es despreciable, y le resta
  seriedad al portafolio. Si algún día se quiere monetizar, un enlace discreto
  de "apoyar el proyecto" en el pie de página.
- ❌ **Mecanismos paralelos** (tipo cinco barras / Plotclock). Matemáticamente
  son otro motor, otra interfaz y otros resultados: el doble de trabajo. Posible
  fase futura, no ahora.
- ❌ **Backend propio.** Toda la simulación corre en el navegador.
- ❌ **Cuentas de usuario** en las primeras fases. Ver sección 5.

---

## 3. Decisiones técnicas

### Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Empaquetador | **Vite** | Rápido, estándar actual, plantilla React+TS lista |
| Interfaz | **React** | Andrés quiere aprenderlo en este proyecto |
| Lenguaje | **TypeScript** | El motor mezcla radianes, grados, vectores y matrices; los tipos atrapan errores que un solo desarrollador no vería |
| 3D | **three.js plano** (no react-three-fiber) | Ver nota abajo |
| Pruebas | **Vitest** | Integrado con Vite, sin configuración extra |
| Despliegue | **Vercel / Netlify / Cloudflare Pages** | Sitio estático, gratis de verdad |

**Nota sobre el 3D:** existe `react-three-fiber`, que es la forma "React" de usar
three.js. Es elegante, pero **no se usa al principio**. El riesgo: si algo no se
ve en pantalla, no se sabe si falló React o three.js. En cambio se hace un
componente `<Viewport3D>` que por dentro usa three.js imperativo con `useRef` y
`useEffect`. React se aprende donde de verdad se nota (paneles, formularios,
estado compartido, navegación). Migrar a R3F después implica reescribir un solo
archivo.

### Arquitectura

```
armlab/
├── src/
│   ├── core/      ← TypeScript puro: matemática y modelo del robot
│   ├── viewer/    ← componente 3D (three.js)
│   ├── ui/        ← paneles, formularios, controles
│   └── app/       ← páginas y navegación
├── docs/          ← este documento y los de cada fase
└── tests/         ← o `.test.ts` junto a cada módulo de core
```

**La regla que sostiene todo el proyecto:**

> Nada dentro de `src/core/` puede importar React, three.js ni tocar el DOM.

Si abre un archivo de `core/` y ve un `document.getElementById`, algo se rompió.
Esa regla es lo que permite probar el motor con tests, reutilizarlo en otro lado,
y lo que diferencia este proyecto de los prototipos de un solo archivo.

### Unidades

> **El núcleo trabaja en SI: metros, radianes, kilogramos.**
> La interfaz muestra centímetros y grados. La conversión ocurre solo en la
> frontera entre `core/` y `ui/`.

Razón: evita toda una clase de errores (pasar grados donde se esperaban
radianes) y deja listo el cálculo de torque de la Fase 4, que necesita SI.

### Formato de archivo

El `.json` descargable es la columna vertebral del proyecto. Si se define bien
ahora, agregar cuentas después es casi trivial: una fila en base de datos que
guarda exactamente el mismo JSON.

Requisitos desde el primer día:

- Debe llevar un campo **`formatVersion`**. Sin eso, el día que se agregue una
  propiedad nueva, los archivos viejos de los usuarios dejan de abrir.
- La carga debe funcionar **arrastrando el archivo sobre la página**.

El diseño detallado del formato se hace en la Fase 2.

---

## 4. Material de partida

Existen dos prototipos en HTML de un solo archivo. **Sirven como fuente, no como
base de código.**

### `Simulador de Brazo Robótico.html` ← el importante

Contiene, en el bloque marcado `==MATH-START==` / `==MATH-END==`, el motor
completo y funcionando:

- `dhMatrix()` — matriz homogénea DH estándar
- `forwardKinematics()` — cinemática directa
- `geometricJacobian()` — Jacobiano geométrico 6×n
- `symEig()` — valores y vectores propios por método de Jacobi
- `singularValues()`, `manipulability()` — Yoshikawa
- `dlsStep()` — cinemática inversa amortiguada
- `rpyZYX()` — ángulos roll-pitch-yaw
- 9 configuraciones de robots de ejemplo (`PRESETS`)

Esta matemática **ya está probada y funciona**. La Fase 0 la portó a TypeScript
con tests en `src/core/`. Falta portar `dlsStep()`, que entra en la Fase 3.

> ⚠️ Al abrir un chat nuevo, adjunte este archivo HTML.

### `Simulador Plotclock ESP32.html`

Mecanismo paralelo de cinco barras. **Fuera de alcance por ahora.** Se menciona
solo para que no se confunda con el anterior.

---

## 5. Fases

Cada fase deja algo funcionando y publicado. No se pasa a la siguiente con la
anterior a medias.

| Fase | Qué entrega | Estado |
|---|---|---|
| **0 — El motor** | `core/` en TypeScript con tests. Repo creado y publicado en GitHub. | ✅ terminada · `armlab-fase-0.md` |
| **1 — Ver** | Galería de ejemplos, visor 3D, deslizadores por articulación, tabla DH, posición del efector. **Se despliega.** | pendiente |
| **2 — Crear** | Agregar/quitar articulaciones, cambiar tipo y límites, descargar `.json`, cargarlo arrastrándolo. | pendiente |
| **3 — Mover** | Trayectorias con línea de tiempo. Entra la IK por DLS. | pendiente |
| **4 — Construir** | Ficha técnica: medidas, rangos, torque por articulación, volumen del espacio de trabajo. | pendiente |
| **5 — Guardar** *(opcional)* | Cuentas con Supabase. Solo si sigue interesando. | pendiente |

### Detalles que se deciden al llegar a su fase

**Fase 3 — tipo de interpolación.** Dos caminos:

- *Espacio articular*: cada articulación va de un ángulo a otro. Simple, nunca
  falla, pero la punta describe curvas raras.
- *Espacio cartesiano*: la punta va en línea recta. Se ve profesional, pero toca
  resolver IK en cada cuadro y puede atravesar singularidades.

Se empieza por el primero y se agrega el segundo después.

**Fase 4 — torque.** Es el dato más útil para quien quiera construir el brazo, y
la razón número uno por la que los brazos de estudiante fracasan: arman todo y el
servo no levanta ni su propio peso.

Ejemplo concreto: un eslabón de 20 cm que pesa 50 g con una carga de 100 g en la
punta pide cerca de **2,5 kg·cm** en esa articulación. Un SG90 da ~1,8 kg·cm y un
MG90S ~2,2: ninguno aguanta. Eso se le dice al estudiante *antes* de que gaste la
plata, sin nombrar una sola referencia comercial.

---

## 6. Despliegue

Objetivo: costo cero.

- **Sitio estático** en Vercel, Netlify, Cloudflare Pages o GitHub Pages. Todos
  tienen plan gratis sin tarjeta.
- **Si algún día entra la Fase 5**: Supabase (auth + base de datos) tiene plan
  gratis; el proyecto se pausa tras varios días sin actividad y hay que
  reactivarlo manualmente. Alternativas: Firebase, Neon, Turso.
- **Evitar** servidores propios siempre encendidos: los planes gratis duermen
  por inactividad o ya desaparecieron.
- **Dominio**: el subdominio gratis de la plataforma alcanza. Un `.com` cuesta
  unos 40–50 mil pesos al año si se quiere.

> Los planes gratuitos cambian seguido. Verificar condiciones al momento de
> desplegar, no antes.

---

## 7. Cómo trabajar en este proyecto

Esto aplica a cualquier chat de asistencia sobre ArmLab:

- **Andrés escribe el código.** Se pide ayuda puntual en lo que no domina, no
  entregas completas.
- **Todo comando va explicado línea por línea**: qué hace y qué significa cada
  bandera. Es la forma en que aprende.
- **Avance por pedazos.** Cada sesión debe cerrar con algo que funcione y un
  commit en GitHub.
- Respuestas directas y con ejemplos concretos, sin exposición teórica larga.
- Tratamiento de "usted".

---

## 8. Convenciones del repositorio

**Mensajes de commit** (Conventional Commits, se ve bien en un portafolio):

```
feat:  funcionalidad nueva
fix:   corrección de error
chore: configuración, dependencias, mantenimiento
docs:  documentación
test:  pruebas
refactor: reorganización sin cambio de comportamiento
```

Ejemplo: `feat(core): cinemática directa con DH estándar`

**Rama principal:** `main`.
**Idioma:** código y nombres en inglés; comentarios, documentación y interfaz en
español.
