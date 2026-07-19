# Seguridad del prototipo

## Estado conocido — 2026-07-19

AgentOS fue retirado del camino de ejecución y de las dependencias de Node. AERA
se ejecutará como un proceso separado y solo aceptará el protocolo cognitivo
validado; los clientes no pueden inyectar código.

Mitigaciones actuales:

- El servidor escucha únicamente en `127.0.0.1`.
- Los directorios privados de las almas no se sirven por HTTP.
- Los eventos recibidos por la API tienen tipos y tamaño limitados.
- La interfaz no permite seleccionar motores, rutas ni código.

La licencia de AERA incorpora la cláusula CADIA, que prohíbe emplearlo para causar
daño físico o angustia emocional grave, invadir la privacidad o preparar actos
de guerra. Genesis adopta esos límites como requisitos del sistema.
