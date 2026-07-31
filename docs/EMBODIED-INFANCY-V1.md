# Controlador de infancia corporizada v1

Esta fase incorpora a Naia un controlador autónomo mínimo para aprender mediante percepción, acción y consecuencia dentro de la Habitación de Génesis. Su propósito es comprobar una capacidad concreta y reproducible: explorar sin conocer la función de los objetos, distinguir una fuente de energía de un objeto inerte y reutilizar lo aprendido.

## Información disponible para el controlador

El controlador recibe únicamente:

- posición y orientación propias;
- dimensiones del espacio;
- energía y fatiga internas;
- objetos que entran en el campo visual, identificados por color, distancia y posición;
- resultado y cambio energético producido por sus acciones.

No recibe la función real de los objetos, la lista completa de obstáculos ni el mapa privilegiado del investigador. Construye su propio registro de celdas visitadas, obstáculos encontrados y objetos observados.

## Ciclo autónomo

1. Observa su estado y el entorno visible.
2. Registra celdas, objetos y colisiones nuevas.
3. Explora una celda todavía no visitada mediante planificación de ruta.
4. Prueba objetos cuya consecuencia todavía desconoce.
5. Clasifica como fuente energética un objeto cuyo cambio medio de energía supera el umbral experimental.
6. Cuando la energía baja, navega hacia la fuente ya aprendida y la consume.
7. Descansa al superar el umbral de fatiga.

Cada decisión conserva secuencia, tick, acción, motivo, resultado, recompensa y posición anterior y posterior. La consola permite iniciar, pausar, cambiar el ritmo o ejecutar exactamente una decisión.

## Persistencia y seguridad

La memoria del controlador se guarda atómicamente en `var/worlds/infancy-controller-v1.json`, fuera de Git. Los puntos de control automáticos y manuales pausan brevemente el mundo y el controlador para guardar un estado coherente. Después de reiniciar el servidor, la ejecución autónoma permanece pausada hasta una orden explícita.

Las acciones manuales del investigador se bloquean mientras el controlador está activo, evitando mezclar decisiones autónomas con intervenciones humanas sin identificarlas.

## Primera ejecución real

El 25 de julio de 2026 se ejecutó el controlador sobre el estado local persistente de Naia. Después de 801 decisiones registradas:

- conocía 34 celdas;
- había aprendido 3 obstáculos por colisión;
- clasificó `object-a` como `energy-source` tras 6 pruebas, con cambio energético medio `+0,265`;
- clasificó `object-b` como `non-restorative` tras 1 prueba, con cambio energético medio cercano a `0`;
- conservó un único descubrimiento real de fuente energética;
- recuperó la energía corporal hasta aproximadamente `97,2 %`;
- restauró la memoria después de reiniciar el servidor;
- continuó desde la decisión 800 a la 801 sin volver a seleccionar como destino la celda bloqueada que había detenido una versión anterior.

El estado final se guardó manualmente a las `17:52:49` y quedó pausado.

## Interpretación correcta

El resultado demuestra adquisición y reutilización de una asociación instrumental dentro de un entorno pequeño y diseñado. No demuestra consciencia, comprensión semántica, instinto biológico ni inteligencia general.

El controlador es un algoritmo explícitamente construido con exploración, búsqueda de rutas, umbrales y memoria tabular. No es todavía el sistema cognitivo AERA y no debe presentarse como una inteligencia surgida enteramente desde cero. La información espacial propia y las dimensiones de la habitación son proporcionadas por el entorno.

Esta ejecución tampoco constituye una prueba clínica o preregistrada: utilizó el estado persistente de ensayos anteriores. La integridad corporal ya se encontraba en `0 %` debido a una prueba acelerada previa, por lo que la recuperación energética no puede interpretarse como supervivencia. Las pruebas automatizadas separadas verifican determinismo, aprendizaje, reutilización y restauración del estado.

