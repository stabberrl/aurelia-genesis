import process from "node:process";
import { Lexicon, normalizeWord, wordsIn } from "../src/lexicon/lexicon.mjs";

const soulId = process.argv.find((arg) => arg.startsWith("--soul="))?.slice(7) || "soul-001-alba-0001";
const curriculum = {
  existencia: "ser existir vida vivir realidad mundo presencia origen final cambio continuidad nacimiento muerte creación forma estado materia energía causa efecto posibilidad",
  identidad: "yo tú él ella nosotros persona individuo nombre identidad propio otro mismo alguien nadie carácter personalidad conciencia alma mente cuerpo historia recuerdo",
  lenguaje: "palabra frase nombre verbo sustantivo adjetivo pronombre significado definición idioma español lenguaje gramática sonido letra sílaba pregunta respuesta afirmación negación conversación",
  pensamiento: "pensar saber conocer entender aprender recordar olvidar imaginar creer dudar decidir elegir comparar reconocer descubrir idea concepto razón atención intención memoria",
  percepción: "ver mirar oír escuchar tocar sentir oler gustar percibir luz color sonido silencio contacto temperatura dolor placer señal intensidad distancia movimiento",
  cuerpo: "cabeza rostro ojo oído boca lengua mano brazo pierna pie piel corazón sangre respiración voz hambre sed sueño fuerza salud herida",
  acción: "hacer actuar mover caminar correr detener abrir cerrar tomar dejar dar recibir buscar encontrar crear destruir comenzar terminar intentar lograr fallar ayudar",
  necesidad: "necesitar querer desear preferir pedir aceptar rechazar tener carecer proteger descansar comer beber dormir respirar aprender comunicar pertenecer seguridad libertad cuidado",
  emoción: "alegría tristeza miedo ira calma sorpresa curiosidad confianza amor afecto vergüenza culpa orgullo esperanza ansiedad soledad empatía deseo alivio dolor",
  relación: "familia madre padre hijo hija hermano hermana amigo amistad compañero enemigo desconocido vínculo encuentro separación cercanía compañía grupo comunidad pareja cuidado",
  sociedad: "humano sociedad cultura regla ley acuerdo permiso prohibición deber derecho responsabilidad trabajo juego enseñanza aprendizaje cooperación conflicto paz violencia poder autoridad",
  tiempo: "tiempo instante momento ahora antes después pasado presente futuro día noche mañana tarde ayer hoy mañana inicio duración espera frecuencia edad antiguo nuevo",
  espacio: "espacio lugar aquí allí cerca lejos dentro fuera arriba abajo delante detrás izquierda derecha centro borde camino dirección posición tamaño profundidad superficie",
  naturaleza: "naturaleza tierra agua aire fuego cielo sol luna estrella nube lluvia viento árbol planta flor animal ave pez piedra montaña río mar",
  entorno: "casa puerta ventana pared suelo techo mesa silla cama ropa herramienta objeto alimento libro imagen música refugio jardín habitación cámara puente",
  cualidad: "bueno malo grande pequeño fuerte débil rápido lento claro oscuro caliente frío suave duro lleno vacío simple complejo igual diferente verdadero falso",
  cantidad: "uno dos tres cuatro cinco mucho poco todo nada parte mitad más menos primero último número cantidad medida orden conjunto único varios suficiente",
  lógica: "sí no porque entonces si aunque y o pero también tampoco siempre nunca quizás posible imposible correcto incorrecto relación condición consecuencia contradicción evidencia",
  valor: "bien mal verdad mentira justicia injusticia respeto dignidad bondad crueldad autonomía honestidad lealtad confianza promesa elección límite consentimiento daño beneficio propósito",
  comunicación: "hablar decir contar preguntar responder explicar describir llamar nombrar repetir pronunciar callar escuchar comprender señalar mostrar avisar agradecer saludar despedir conversar",
};

const categories = Object.entries(curriculum).map(([category, text]) => ({ category, words: wordsIn(text) }));
const seenWords = new Set();
const flat = categories.flatMap(({ category, words }) => words.map((word) => ({ word, category })))
  .filter(({ word }) => !seenWords.has(word) && seenWords.add(word))
  .slice(0, 400);
if (flat.length !== 400) throw new Error(`El currículo requiere 400 conceptos únicos; sólo se encontraron ${flat.length}.`);

const lexicon = new Lexicon();
const concepts = flat.map(({ word, category }) => {
  const entry = lexicon.find(word).find(({ word: found }) => normalizeWord(found) === word) || lexicon.find(word)[0];
  if (!entry) throw new Error(`El concepto «${word}» no existe en el órgano léxico.`);
  return { word, category, pos: entry.pos, definition: entry.senses[0].glosses[0] };
});
const vocabulary = new Set(concepts.map(({ word }) => word));
const associations = [];
const keys = new Set();
const add = (source, target, relation, evidence) => {
  if (source === target) return;
  const key = `${source}\0${target}\0${relation}`;
  if (keys.has(key) || associations.length >= 2000) return;
  keys.add(key);
  associations.push({ source, target, relation, evidence });
};

for (const concept of concepts) {
  for (const mentioned of wordsIn(concept.definition)) {
    if (vocabulary.has(mentioned)) add(concept.word, mentioned, "definition_mentions", "La definición léxica menciona el concepto destino.");
  }
  const entry = lexicon.find(concept.word)[0];
  for (const sense of entry.senses) {
    for (const synonym of sense.synonyms || []) if (vocabulary.has(normalizeWord(synonym))) add(concept.word, normalizeWord(synonym), "synonym", "Relación declarada por Wikcionario.");
    for (const antonym of sense.antonyms || []) if (vocabulary.has(normalizeWord(antonym))) add(concept.word, normalizeWord(antonym), "antonym", "Relación declarada por Wikcionario.");
  }
}

for (const { category, words } of categories) {
  for (let index = 0; index < words.length; index += 1) {
    for (let offset = 1; offset <= 6; offset += 1) add(words[index], words[(index + offset) % words.length], "shared_domain", `Ambos conceptos pertenecen al dominio ${category}.`);
  }
}

const relationCycle = ["supports", "precedes", "contextualizes", "contrasts_with"];
for (let sourceIndex = 0; associations.length < 2000; sourceIndex += 1) {
  const source = concepts[sourceIndex % concepts.length];
  const target = concepts[(sourceIndex * 17 + 43) % concepts.length];
  add(source.word, target.word, relationCycle[sourceIndex % relationCycle.length], "Enlace transversal del currículo básico; requiere confirmación por experiencia.");
}

const result = lexicon.injectCurriculum(soulId, concepts, associations);
console.log(JSON.stringify({ ...result, categories: categories.length }, null, 2));
lexicon.close();
