# Prueba esencial: aprendizaje externo controlado

## Hipótesis

Una entidad de Aurelia Genesis puede ampliar gradualmente su exposición léxica desde una fuente pública sin recibir una personalidad prefabricada, ejecutar instrucciones externas ni confundir información descargada con comprensión demostrada.

## Fuente inicial

La primera fuente es Wiktionary mediante la API de MediaWiki. La cámara sólo realiza solicitudes de lectura para una lista pequeña y revisable de términos fundacionales. No navega enlaces, no ejecuta scripts y no permite que el contenido remoto modifique su configuración.

## Ciclo experimental

1. Seleccionar un término del currículo externo permitido.
2. Solicitar su extracto a Wiktionary.
3. Eliminar caracteres de control y limitar título y contenido.
4. Rechazar entradas ausentes o demasiado breves.
5. Calcular una huella SHA-256 y evitar duplicados.
6. Registrar alma, idioma, fuente, URL, extracto, hora y resultado.
7. Si la observación es válida y el término existe en el léxico local, aumentar únicamente su familiaridad léxica, sin crear memoria episódica.

Las definiciones remotas se almacenan como observaciones externas. No se convierten en asociaciones sensoriales, conceptos fundamentados ni evidencia de comprensión. El avance cognitivo continúa dependiendo de experiencia, repetición y pruebas separadas.

## Controles

- apagada por defecto y activación explícita con `FLUCTLIGHT_LEARNING_CHAMBER=1`;
- intervalo mínimo interno de diez segundos y valor operativo predeterminado de tres minutos;
- lista de términos pequeña y determinista;
- sólo HTTPS hacia Wiktionary;
- tamaño máximo de extracto;
- deduplicación por URL y huella de contenido;
- registro de aceptaciones y rechazos por alma;
- parada conjunta durante el cierre del servidor;
- sin ejecución de acciones externas ni uso de LLM.

## Interfaces auditables

- `GET /api/learning/chamber?soulId=...&language=es`: estado y observaciones recientes.
- `POST /api/learning/chamber/tick`: ejecuta un único ciclo controlado.
- `GET /api/development`: informa observaciones externas totales y aceptadas, sin sumarlas a la puntuación de fase.
- `npm run learn:observe -- --soul=soul-001-alba-0001 --term=existir`: ejecuta una observación reproducible desde la terminal.

## Criterio de éxito inicial

La prueba se considera técnicamente reproducible cuando una entrada real queda registrada con procedencia, una repetición no crea duplicados, el límite de ritmo bloquea ciclos prematuros, el contenido insuficiente se rechaza y ningún extracto crea por sí solo un concepto fundamentado.

Esto demuestra una canalización controlada de observaciones y memoria persistente. No demuestra aprendizaje humano autónomo, comprensión semántica general, consciencia ni fiabilidad de la fuente. Las métricas y políticas seguirán revisándose antes de ampliar el vocabulario o incorporar nuevas fuentes.
