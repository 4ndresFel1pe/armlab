# ArmLab

Simulador web de brazos robóticos seriales para estudiantes.

Cinemática directa por Denavit–Hartenberg, Jacobiano geométrico y
manipulabilidad de Yoshikawa — todo calculado en el navegador.

## Estado

🚧 En construcción.

-  **Fase 0 — El motor:** núcleo matemático en TypeScript con pruebas.
-  **Fase 1 — Ver:** galería de ejemplos, visor 3D y deslizadores por articulación.

## Desarrollo

```bash
npm install   # instalar dependencias
npm run dev   # servidor de desarrollo
npm test      # ejecutar pruebas
npm run build # compilar para producción
npm run lint  # revisar el código con oxlint
```

## Arquitectura

- `src/core/` — matemática y modelo del robot. TypeScript puro, sin DOM.
- `src/viewer/` — visualización 3D (desde la Fase 1).
- `src/ui/` — componentes de interfaz (desde la Fase 1).
- `src/app/` — páginas y navegación (desde la Fase 1).

El núcleo trabaja en unidades SI (metros, radianes, kilogramos). La interfaz
muestra centímetros y grados; la conversión ocurre solo en la frontera entre
`core/` y `ui/`.

### Núcleo (`src/core/`)

| Módulo | Contenido |
|---|---|
| `types.ts` | Tipos base: articulación, robot, vectores y matrices |
| `linalg.ts` | Álgebra lineal: productos, transpuesta, valores propios (Jacobi) |
| `dh.ts` | Matriz Denavit–Hartenberg estándar |
| `kinematics.ts` | Cinemática directa y ángulos roll-pitch-yaw |
| `jacobian.ts` | Jacobiano geométrico 6 × n y Jacobianos de tarea |
| `manipulability.ts` | Valores singulares y manipulabilidad de Yoshikawa |
| `presets.ts` | Nueve robots de ejemplo (planar, SCARA, Stanford, PUMA…) |

## Documentación

- [`docs/armlab-especificaciones.md`](docs/armlab-especificaciones.md) — alcance, decisiones y fases.
- [`docs/armlab-fase-0.md`](docs/armlab-fase-0.md) — plan de la Fase 0.

## Referencias

- Spong, M. W., Hutchinson, S. y Vidyasagar, M. (2006). *Robot Modeling and Control*. Wiley.
- Yoshikawa, T. (1985). Manipulability of robotic mechanisms. *The International Journal of Robotics Research, 4*(2), 3–9.
- Nakamura, Y. y Hanafusa, H. (1986). Inverse kinematic solutions with singularity robustness for robot manipulator control. *Journal of Dynamic Systems, Measurement, and Control, 108*(3), 163–171.
