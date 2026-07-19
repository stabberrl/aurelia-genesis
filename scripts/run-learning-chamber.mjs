import { LearningChamber } from "../src/learning/learning-chamber.mjs";
import { LexiconRegistry } from "../src/lexicon/registry.mjs";
import { validateLanguage } from "../src/lexicon/languages.mjs";
import { validateSoulId } from "../src/runtime/registry.mjs";

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.join("=")];
}));
const soulId = options.soul || "soul-001-alba-0001";
const language = validateLanguage(options.language || "es");
if (!validateSoulId(soulId)) throw new Error("Alma no válida.");

const lexicons = new LexiconRegistry();
try {
  const chamber = new LearningChamber(lexicons.get(language), {
    terms: options.term ? [options.term] : undefined,
  });
  const result = await chamber.tick(soulId);
  console.log(JSON.stringify(result, null, 2));
} finally {
  lexicons.close();
}
