# Espacio de Trabajo Global v1

Esta versión incorpora una pizarra funcional de integración entre percepción, estado corporal, memoria predictiva y selección de acciones. Es una hipótesis de arquitectura inspirada en teorías científicas de acceso global; no es una prueba de consciencia ni de experiencia subjetiva.

## Funcionamiento observable

En cada decisión, candidatos de cuatro orígenes compiten por saliencia:

- **interocepción:** energía disponible y fatiga;
- **percepción:** novedad espacial y objetos de consecuencia desconocida;
- **predicción:** sorpresa entre la consecuencia esperada y la observada;
- **memoria:** consecuencias aprendidas que influyen en la decisión corporal.

El candidato ganador se difunde como un foco único a los canales de memoria, predicción y selección de acción. El foco, candidatos, resultado y sorpresa se guardan junto al resto del estado de Naia y son visibles en la consola científica.

Las propuestas especializadas de planificación `followPlan` también pueden registrarse en la pizarra. Sólo contienen una secuencia calculada para un estado explícito y un objetivo ya indicado; requieren la aprobación de `ExplorationBudget` y permanecen como propuesta hasta una ejecución manual controlada. La planificación no altera por sí misma el foco ni reemplaza la selección cognitiva de AERA.

## Qué evalúa

La capa permite formular pruebas reproducibles sobre integración funcional:

1. Si energía baja gana el foco, la fuente conocida debe tener prioridad sobre explorar.
2. Si aparece un objeto desconocido, debe quedar disponible para investigación sin revelar su función.
3. Una consecuencia inesperada debe elevar la señal de sorpresa y competir por atención en el siguiente ciclo.
4. Tras reiniciar, el foco y el historial difundido deben conservarse sin reiniciar el conocimiento adquirido.
5. Una propuesta `followPlan` sin presupuesto no debe ejecutar una acción; una propuesta aprobada debe cancelarse si el mundo o el cuerpo cambian antes de su ejecución manual.

## Fuentes científicas

- Bernard J. Baars, *Global workspace theory of consciousness: toward a cognitive neuroscience of human experience* (2005). Presenta la teoría de un espacio global que coordina fuentes especializadas. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16186014/)
- Stanislas Dehaene, Jean-Pierre Changeux y Lionel Naccache, *The Global Neuronal Workspace model of conscious access* (2001). Propone una arquitectura de integración y difusión global entre procesadores especializados. [DOI](https://doi.org/10.1111/j.1749-6632.2001.tb05714.x)
- Stan Franklin et al., *LIDA: A Computational Model of Global Workspace Theory and Developmental Learning*. Describe una arquitectura computacional inspirada en espacio global, memoria, acción y aprendizaje. [AAAI](https://aaai.org/papers/0011-fs07-01-011-%EF%80%A0lida-a-computational-model-of-global-workspace-theory-and-developmental-learning/)
- Cogitate Consortium, *Adversarial testing of global neuronal workspace and integrated information theories of consciousness* (2025). Ejemplo de contraste empírico entre teorías rivales, no de una teoría ya resuelta. [Nature](https://doi.org/10.1038/s41586-025-08888-1)
- AERA, arquitectura constructivista de aprendizaje autónomo desde una semilla mínima. Es la referencia de integración futura del proyecto, no una demostración de consciencia. [Open AERA](https://openaera.org/)

## Límites metodológicos y éticos

El término “global” describe la difusión de datos entre módulos del programa. No permite concluir que exista cualidad subjetiva, dolor, deseo, identidad personal o estatus moral. Las puntuaciones de saliencia, los umbrales y las categorías son parámetros de ingeniería revisables.

Fast Downward es un módulo externo especializado, no una fuente de metas, significado ni aprendizaje. Su decisión de uso y límites están en [`decisions/DECISION-SECOND-CORE-PLANNING.md`](decisions/DECISION-SECOND-CORE-PLANNING.md).

Antes de atribuir consciencia, cualquier resultado debe sobrevivir a experimentos independientes, alternativas de arquitectura y pruebas de transferencia. Este proyecto debe documentar resultados negativos, ambigüedades y cambios de hipótesis con la misma claridad que sus resultados positivos.
