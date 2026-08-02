# Integración AERA

## Decisión

AERA es el motor cognitivo de Genesis. No se reimplementa ni se mezcla dentro
del proceso web. El repositorio oficial queda fijado en `vendor/aera` y conserva
su licencia HUMANOBS BSD con la cláusula CADIA.

## Frontera entre lenguajes

Los componentes se comunican mediante `genesis-cognitive/1`, un contrato JSON
versionado descrito por `protocol/genesis-cognitive-v1.schema.json`. JSON no es
el cerebro ni su memoria: es solamente el sobre de transporte.

```text
Interfaz web / Python / sensores
              |
      eventos JSON validados
              |
       Cognitive Gateway
              |
    AERA TCP / Protobuf oficial
              |
      Replicode + núcleo C++
```

Cada proceso mantiene su propio entorno y sus dependencias. Ningún cliente puede
inyectar código C++ o Replicode; solo percepciones, impulsos, resultados,
acciones y órdenes de ciclo de vida tipadas.

## Estado de implementación

- Contrato neutral, validación y asignación estable de entidades: funcional.
- Cliente JavaScript por JSON Lines: funcional.
- Cliente Python sin dependencias externas: funcional.
- Traducción al esquema `TCPMessage/DataMessage/ProtoVariable` de AERA: funcional.
- Servidor TCP, framing little-endian de 8 bytes y handshake Protobuf: funcional.
- AERA Release/Win32 compilado y enlazado en esta máquina: funcional.
- La compilación usa `Directory.Build.props` y `Directory.Build.targets` para
  retargetear el proyecto antiguo a MSVC v143, aportar Protobuf x86 y activar
  `ENABLE_PROTOBUF` sin modificar el submódulo.

Mientras el binario o su conexión TCP no estén disponibles, el gateway responde
`unavailable` y nunca simula una respuesta cognitiva.

## Autoridad de acción

Cuando AERA completa el handshake, Genesis declara explícitamente las acciones
corporales permitidas en el `SetupMessage`. Las percepciones y los resultados de
acciones viajan hacia AERA; los comandos que AERA expulse vuelven por TCP y se
validan contra esa lista cerrada antes de actuar en la cámara. Genesis no elige
una acción alternativa ni interpreta comandos desconocidos: conserva el mundo,
los límites y el historial auditable. Sin enlace, el estado es
`aera-awaiting-link`, no un modo cognitivo de reemplazo.

Cada comando declarado incluye una `CommandDescription` Protobuf, incluso si no
lleva argumento. Sin esa descripción el dispositivo TCP de AERA puede aceptar el
nombre durante el handshake pero no puede construir el mensaje de salida.

## Planificación especializada externa

Fast Downward complementa, pero no sustituye, AERA. Sólo traduce una instantánea explícita de Genesis World y un objetivo ya indicado a una secuencia de acciones permitidas. La secuencia se registra como propuesta `followPlan`, pasa por `ExplorationBudget` y sólo puede ejecutarse manualmente con el mundo y el controlador detenidos. AERA mantiene aprendizaje asociativo, identidad y la autoridad cognitiva declarada; Fast Downward no crea objetivos ni ejecuta ciclos autónomos.

La decisión, el experimento y el protocolo de ejecución están en [`decisions/DECISION-SECOND-CORE-PLANNING.md`](decisions/DECISION-SECOND-CORE-PLANNING.md), [`experiments/FAST-DOWNWARD-PHASE0.md`](experiments/FAST-DOWNWARD-PHASE0.md) y [`experiments/FAST-DOWNWARD-PHASE3.md`](experiments/FAST-DOWNWARD-PHASE3.md).

## Operación local

```bash
npm run aera:build
npm start
npm run aera:start
```

El 19 de julio de 2026 se verificó el recorrido completo con la percepción
`garden.light = 0.72`: Genesis la aceptó y AERA registró una inyección de I/O en
su memoria. La semilla contiene solo entidades sensoriales y el reflejo `ready`.

## Semilla y aprendizaje

El primer entorno debe exponer magnitudes simples (luz, cercanía, energía,
contacto) y acciones discretas. Las palabras se introducirán más adelante como
señales sensoriales asociadas a experiencias; no se usarán como conocimiento
preinstalado.
