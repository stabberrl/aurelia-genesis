# Manual técnico de Aurelia Genesis

**Estado:** manual operativo del prototipo local · **Actualizado:** 2026-08-02

## 1. Propósito y límites

Aurelia Genesis es una plataforma de investigación local para agentes sintéticos con estado persistente. El término «alma» es una denominación de interfaz y documentación; no es una afirmación de consciencia, persona digital, experiencia subjetiva ni organismo biológico.

El sistema separa deliberadamente cuatro tareas:

| Componente | Responsabilidad | No hace |
| --- | --- | --- |
| Genesis World | Cuerpo, grilla, objetos, consecuencias y persistencia | No decide metas cognitivas |
| Controlador de infancia | Exploración local, memoria tabular y pruebas corporales | No es AERA ni aprendizaje general |
| AERA | Núcleo cognitivo externo, percepciones y comandos tipados | No administra la interfaz ni recibe ejecución ilimitada |
| Fast Downward | Planificación simbólica opcional para un estado ya conocido | No aprende, no fija objetivos y no se ejecuta solo |

La interfaz HTML es una vista de observación. Las operaciones reales también están disponibles por la API local y por los módulos del runtime.

## 2. Requisitos

- Node.js compatible con el proyecto y `npm`.
- Git, incluidos los submódulos si se utilizará AERA.
- Para AERA: herramientas C++/CMake y dependencias documentadas en [aera-integration.md](aera-integration.md).
- Para Fast Downward: una compilación local externa que contenga `fast-downward.py`. No se versiona ni instala automáticamente.

Instalación básica:

```powershell
git clone https://github.com/stabberrl/aurelia-genesis.git
Set-Location aurelia-genesis
git submodule update --init --recursive
npm install
npm test
```

La prueba no debe modificar la población versionada. Los estados generados se guardan en `var/`, que está excluido de Git.

## 3. Inicio seguro

1. Copia `.env.example` a `.env` si tu herramienta de inicio carga ese archivo, o define variables en la sesión de terminal.
2. Mantén `FLUCTLIGHT_HOST=127.0.0.1`. No expongas la cámara a la red sin una revisión explícita de seguridad.
3. Inicia el servidor:

```powershell
npm start
```

4. Abre `http://127.0.0.1:4747`.
5. Comprueba salud y enlace AERA:

```powershell
Invoke-RestMethod http://127.0.0.1:4747/api/health
```

`aera-awaiting-link` significa que Genesis funciona localmente, pero AERA no ha completado el enlace TCP. No es una inteligencia de respaldo ni se simula una respuesta en su ausencia.

### AERA

En otra terminal, cuando el entorno nativo esté preparado:

```powershell
npm run aera:build
npm run aera:start
```

El estado sano esperado es `connected: true` y `mode: aera-primary`. Los comandos recibidos se limitan al conjunto cerrado de acciones de Genesis. Si el controlador de infancia está activo, Genesis rechaza comandos externos para no mezclar dos autoridades de acción.

## 4. Configuración

| Variable | Predeterminado | Efecto |
| --- | --- | --- |
| `FLUCTLIGHT_HOST` | `127.0.0.1` | Dirección del servidor local |
| `FLUCTLIGHT_PORT` | `4747` | Puerto HTTP |
| `FLUCTLIGHT_AWAKE_SOULS` | `soul-001-alba-0001` | Almas activas, separadas por coma |
| `AERA_HOST` / `AERA_PORT` | `127.0.0.1` / `8080` | Transporte TCP hacia AERA |
| `FLUCTLIGHT_CHECKPOINT_MS` | `300000` | Intervalo de checkpoints, en milisegundos |
| `FLUCTLIGHT_CHECKPOINT_RETENTION` | `24` | Número de checkpoints conservados |
| `FLUCTLIGHT_HEARTBEAT_MS` | `60000` | Intervalo del latido cognitivo |
| `FLUCTLIGHT_HEARTBEAT_FASTFORWARD` | `0` | Ciclos rápidos de prueba; no usar como evidencia |
| `FLUCTLIGHT_LEARNING_CHAMBER` | desactivado | Habilita observación externa gradual |
| `FLUCTLIGHT_LEARNING_INTERVAL_MS` | `180000` | Ritmo mínimo de la cámara de aprendizaje |
| `FLUCTLIGHT_AUTONOMOUS_EXPLORATION` | desactivado | Habilita el ciclo autónomo de exploración documentado |
| `FLUCTLIGHT_LIBRETRANSLATE_URL` | `http://127.0.0.1:5000/translate` | Traductor local opcional |
| `FLUCTLIGHT_LEXICON_PATH` | ruta interna | Ruta alternativa del léxico local |
| `FAST_DOWNWARD_HOME` | sin configurar | Carpeta externa con `fast-downward.py` |

Ejemplo temporal para PowerShell:

```powershell
$env:FAST_DOWNWARD_HOME = "C:\herramientas\fast-downward"
$env:FLUCTLIGHT_CHECKPOINT_MS = "300000"
npm start
```

## 5. Arquitectura de ejecución

```text
Interfaz / API local
        │
        ├── WorldRuntime ── GenesisWorld ── checkpoints
        │        │
        │        └── percepciones/resultados ── Cognitive Gateway ── AERA TCP
        │
        ├── EmbodiedInfancyController (opcional, exploración local)
        └── PlanningCoordinator (manual, opcional)
                   │
                   ├── ExplorationBudget + Global Workspace
                   └── Fast Downward externo → propuesta followPlan → PlanExecutor
```

El orden es relevante: Fast Downward recibe un objetivo que ya fue indicado, no lo selecciona. Una propuesta aprobada no ejecuta nada por sí sola. El ejecutor sólo opera ante una solicitud manual y con el mundo detenido.

## 6. Persistencia, checkpoints y reinicio

| Ruta | Contenido | Tratamiento |
| --- | --- | --- |
| `souls/<id>/` | Identidad y materiales de cada alma | No editar sin migración auditable |
| `var/worlds/` | Mundo y estado del controlador | Generado localmente; excluido de Git |
| `var/checkpoints/` | Capturas recuperables | Retención configurable |
| `var/lexicon/` | Léxicos y asociaciones locales | Excluido de Git |

Crear un checkpoint manual:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:4747/api/checkpoints
```

Al cerrar el servidor con `Ctrl+C`, se intenta guardar un checkpoint completo. Evita terminar el proceso de forma forzada. Si ocurre un cierre inesperado, reinicia el servidor: WorldRuntime y el controlador intentarán recuperar el último estado válido.

## 7. Operación del mundo

Consultar mundo y percepciones:

```powershell
Invoke-RestMethod "http://127.0.0.1:4747/api/world?soulId=soul-001-alba-0001"
```

Controlar tiempo del mundo:

```powershell
Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body '{"command":"pause"}' http://127.0.0.1:4747/api/world/control
```

Acciones manuales permitidas: `observe`, `turnLeft`, `turnRight`, `moveForward`, `touch`, `consume`, `rest`, `wait`, `grip`, `push` y `signal`. Las acciones manuales se bloquean mientras el controlador de infancia está activo.

Controlador corporal:

```powershell
# Consultar
Invoke-RestMethod http://127.0.0.1:4747/api/world/controller

# Pausar o iniciar
Invoke-RestMethod -Method Post -ContentType "application/json" -Body '{"command":"pause"}' http://127.0.0.1:4747/api/world/controller
Invoke-RestMethod -Method Post -ContentType "application/json" -Body '{"command":"start"}' http://127.0.0.1:4747/api/world/controller
```

No inicies simultáneamente el controlador y una ejecución de plan. El servidor lo rechaza para preservar la atribución de cada acción.

## 8. Planificación con Fast Downward

### 8.1 Preparación

Compila Fast Downward externamente y define `FAST_DOWNWARD_HOME` antes de iniciar el servidor. Confirma la disponibilidad:

```powershell
Invoke-RestMethod "http://127.0.0.1:4747/api/planning?soulId=soul-001-alba-0001"
```

Debe aparecer `fastDownwardConfigured: true`. Si no aparece, reinicia el servidor desde una terminal donde la variable exista.

### 8.2 Proponer un plan

La propuesta requiere un objeto real del mundo como objetivo. El identificador se obtiene desde `/api/world`.

```powershell
$request = @{
  soulId = "soul-001-alba-0001"
  targetObjectId = "object-a"
  completion = "consume"
  curiosity = 0.8
  unresolvedNeed = 0.8
  cost = 0.2
} | ConvertTo-Json

Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body $request http://127.0.0.1:4747/api/planning/propose
```

Estados posibles:

| Estado | Significado |
| --- | --- |
| `proposal-ready` | Plan calculado y presupuesto aprobado; todavía no se ejecutó |
| `proposal-blocked` | El presupuesto rechazó la propuesta |
| error 409 | Fast Downward no está configurado o el plan ya no puede ejecutarse |

### 8.3 Ejecutar una propuesta

La ejecución exige: mundo pausado, controlador de infancia pausado, propuesta `ready`, misma pose y misma revisión del mundo que al proponer. Antes de cada acción se verifica de nuevo el estado; cualquier discrepancia cancela el resto.

```powershell
# Pausar mundo y controlador
Invoke-RestMethod -Method Post -ContentType "application/json" -Body '{"command":"pause"}' http://127.0.0.1:4747/api/world/control
Invoke-RestMethod -Method Post -ContentType "application/json" -Body '{"command":"pause"}' http://127.0.0.1:4747/api/world/controller

# Sustituir PLAN_ID por el id devuelto al proponer
Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body '{"planId":"PLAN_ID"}' http://127.0.0.1:4747/api/planning/execute
```

Resultados: `plan-executed`, `plan-blocked` o `plan-cancelled`. Una cancelación es esperada si el mundo o el cuerpo cambian; propone un plan nuevo en vez de reutilizar el anterior.

Más detalle metodológico: [Fase 0](experiments/FAST-DOWNWARD-PHASE0.md), [Fase 3](experiments/FAST-DOWNWARD-PHASE3.md) y [decisión técnica](decisions/DECISION-SECOND-CORE-PLANNING.md).

## 9. API de consulta principal

| Ruta | Método | Uso |
| --- | --- | --- |
| `/api/health` | GET | Estado del servidor y enlace AERA |
| `/api/souls` | GET | Registro de almas disponibles |
| `/api/world` | GET | Mundo, cuerpo y percepciones |
| `/api/world/control` | POST | Pausa, paso o velocidad del mundo |
| `/api/world/action` | POST | Acción manual validada |
| `/api/world/controller` | GET/POST | Estado y control de infancia |
| `/api/checkpoints` | POST | Captura manual completa |
| `/api/planning` | GET | Planificador, presupuesto y propuestas de sesión |
| `/api/planning/propose` | POST | Crear propuesta de planificación |
| `/api/planning/execute` | POST | Ejecutar manualmente una propuesta aprobada |
| `/api/aera/commands` | GET | Historial de comandos recibidos desde AERA |
| `/api/development` | GET | Indicadores de desarrollo experimentales |

La API no es pública ni autenticada. Está diseñada únicamente para `127.0.0.1`.

## 10. Pruebas y diagnóstico

Ejecuta toda la suite antes de subir cambios:

```powershell
npm test
```

Comprobaciones útiles:

```powershell
node --check src/server.mjs
Get-Content server.error.log -Tail 80
Invoke-RestMethod http://127.0.0.1:4747/api/health
```

| Síntoma | Causa probable | Acción |
| --- | --- | --- |
| La página queda cargando | Servidor detenido o puerto distinto | Ejecuta `npm start` y revisa `/api/health` |
| `aera-awaiting-link` | AERA no está iniciado o no completó handshake | Ejecuta los scripts AERA y revisa host/puerto |
| El planificador devuelve 409 | Falta `FAST_DOWNWARD_HOME` en el proceso del servidor | Define la variable y reinicia `npm start` |
| `world-must-be-paused` | El tiempo del mundo está activo | Pausa `/api/world/control` antes de ejecutar |
| `body-state-changed` o `world-revision-changed` | La propuesta quedó obsoleta | Descarta el plan y vuelve a proponer |
| Acción manual bloqueada | El controlador de infancia está activo | Paúsalo primero |

## 11. Cambios y contribuciones

Cada bloque verificable debe añadir una entrada con hora en [CHANGELOG.md](CHANGELOG.md). Antes de modificar arquitectura, revisa [objectives-and-process.md](objectives-and-process.md), [security.md](security.md) y [CONTRIBUTING.md](../CONTRIBUTING.md).

No subas `var/`, bases léxicas locales, registros, PIDs, binarios de AERA compilados ni Fast Downward. Las dependencias externas conservan sus propias licencias; consulta [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
