# Órgano léxico español

Genesis usa un diccionario local SQLite generado desde el Wikcionario en español. El vocabulario no se vuelca como hechos a AERA: cada alma consulta y registra únicamente las palabras que encuentra. Esto conserva una diferencia esencial entre **tener acceso a una definición** y **comprenderla mediante experiencia**.

## Construcción

```powershell
npm run lexicon:import
```

El comando descarga el volcado estructurado de Kaikki/Wiktextract, conserva las entradas cuya lengua es español y crea `var/lexicon/es.sqlite`. Los archivos descargados y la base generada son locales y no se incluyen en Git.

## API

- `GET /api/lexicon/status`: cobertura y procedencia.
- `GET /api/lexicon?word=luz`: definiciones, categoría, formas y relaciones.
- `POST /api/lexicon/encounter`: registra la exposición de un alma a las palabras de un texto. Cuerpo: `{ "soulId": "...", "text": "..." }`.
- `GET /api/concepts?soulId=...`: muestra asociaciones sensoriales aprendidas, con número de muestras, promedio y rango.

Cuando una palabra aparece durante los 30 segundos posteriores a una percepción numérica aceptada por AERA, Genesis crea o refuerza una asociación privada para esa alma. La asociación conserva evidencia estadística y no altera la definición del diccionario.

Fuente: [Wikcionario en español vía Kaikki](https://kaikki.org/eswiktionary/rawdata.html), extraído con [Wiktextract](https://github.com/tatuylonen/wiktextract). El texto de Wikimedia se distribuye bajo CC BY-SA 4.0 y GFDL; deben conservarse atribución y licencia al redistribuir la base derivada.
