/**
 * Alphabet arménien oriental (orthographe réformée) — 39 lettres, dans l'ordre
 * enseigné en Arménie (Ու et և comptent comme des lettres, Ւ seul n'est plus utilisé).
 */
export type Letter = {
  /** Identifiant stable (utilisé dans les URLs et la base locale). */
  id: string;
  upper: string;
  lower: string;
  /** Nom de la lettre en arménien. */
  name: string;
  /** Nom de la lettre en translittération. */
  nameLatin: string;
  /** Romanisation courante. */
  translit: string;
  ipa: string;
  /** Indication de prononciation pour un francophone. */
  hint: string;
  example: { word: string; translit: string; fr: string };
};

export const LETTERS: Letter[] = [
  { id: "ayb", upper: "Ա", lower: "ա", name: "Այբ", nameLatin: "ayb", translit: "a", ipa: "ɑ", hint: "« a » comme dans « papa »", example: { word: "այգի", translit: "aygi", fr: "jardin" } },
  { id: "ben", upper: "Բ", lower: "բ", name: "Բեն", nameLatin: "ben", translit: "b", ipa: "b", hint: "« b » comme dans « bain »", example: { word: "բարև", translit: "barev", fr: "bonjour" } },
  { id: "gim", upper: "Գ", lower: "գ", name: "Գիմ", nameLatin: "gim", translit: "g", ipa: "ɡ", hint: "« g » dur comme dans « gare »", example: { word: "գորտ", translit: "gort", fr: "grenouille" } },
  { id: "da", upper: "Դ", lower: "դ", name: "Դա", nameLatin: "da", translit: "d", ipa: "d", hint: "« d » comme dans « dos »", example: { word: "դու", translit: "du", fr: "tu" } },
  { id: "yech", upper: "Ե", lower: "ե", name: "Եչ", nameLatin: "yech", translit: "e / ye", ipa: "ɛ / jɛ", hint: "« yé » en début de mot, « é » ailleurs", example: { word: "երեխա", translit: "yerekha", fr: "enfant" } },
  { id: "za", upper: "Զ", lower: "զ", name: "Զա", nameLatin: "za", translit: "z", ipa: "z", hint: "« z » comme dans « zéro »", example: { word: "զրո", translit: "zro", fr: "zéro" } },
  { id: "e", upper: "Է", lower: "է", name: "Է", nameLatin: "é", translit: "e", ipa: "ɛ", hint: "« é », même en début de mot", example: { word: "էջ", translit: "ej", fr: "page" } },
  { id: "et", upper: "Ը", lower: "ը", name: "Ըթ", nameLatin: "ët", translit: "ë", ipa: "ə", hint: "« e » muet comme dans « le »", example: { word: "ընթրիք", translit: "ënt'rik'", fr: "dîner" } },
  { id: "to", upper: "Թ", lower: "թ", name: "Թո", nameLatin: "t'o", translit: "t'", ipa: "tʰ", hint: "« t » aspiré, suivi d'un petit souffle", example: { word: "թռչուն", translit: "t'rrch'un", fr: "oiseau" } },
  { id: "zhe", upper: "Ժ", lower: "ժ", name: "Ժե", nameLatin: "zhe", translit: "zh", ipa: "ʒ", hint: "« j » comme dans « jour »", example: { word: "ժողով", translit: "zhoghov", fr: "réunion" } },
  { id: "ini", upper: "Ի", lower: "ի", name: "Ինի", nameLatin: "ini", translit: "i", ipa: "i", hint: "« i » comme dans « lit »", example: { word: "ինը", translit: "inë", fr: "neuf" } },
  { id: "liun", upper: "Լ", lower: "լ", name: "Լյուն", nameLatin: "lyun", translit: "l", ipa: "l", hint: "« l » comme dans « lune »", example: { word: "լիմոն", translit: "limon", fr: "citron" } },
  { id: "khe", upper: "Խ", lower: "խ", name: "Խե", nameLatin: "khe", translit: "kh", ipa: "χ", hint: "« r » raclé, comme la jota espagnole", example: { word: "խնձոր", translit: "khndzor", fr: "pomme" } },
  { id: "tsa", upper: "Ծ", lower: "ծ", name: "Ծա", nameLatin: "tsa", translit: "ts", ipa: "ts", hint: "« ts » sec, sans souffle", example: { word: "ծիրան", translit: "tsiran", fr: "abricot" } },
  { id: "ken", upper: "Կ", lower: "կ", name: "Կեն", nameLatin: "ken", translit: "k", ipa: "k", hint: "« k » sec, sans souffle (comme en français)", example: { word: "կով", translit: "kov", fr: "vache" } },
  { id: "ho", upper: "Հ", lower: "հ", name: "Հո", nameLatin: "ho", translit: "h", ipa: "h", hint: "« h » expiré, comme en anglais « hat »", example: { word: "հայր", translit: "hayr", fr: "père" } },
  { id: "dza", upper: "Ձ", lower: "ձ", name: "Ձա", nameLatin: "dza", translit: "dz", ipa: "dz", hint: "« dz » comme dans « adze »", example: { word: "ձեռք", translit: "dzerrk'", fr: "main" } },
  { id: "ghat", upper: "Ղ", lower: "ղ", name: "Ղատ", nameLatin: "ghat", translit: "gh", ipa: "ʁ", hint: "« r » grasseyé, comme le « r » français", example: { word: "մեղու", translit: "meghu", fr: "abeille" } },
  { id: "che", upper: "Ճ", lower: "ճ", name: "Ճե", nameLatin: "tche", translit: "ch", ipa: "tʃ", hint: "« tch » sec, sans souffle", example: { word: "ճուտ", translit: "chut", fr: "poussin" } },
  { id: "men", upper: "Մ", lower: "մ", name: "Մեն", nameLatin: "men", translit: "m", ipa: "m", hint: "« m » comme dans « mère »", example: { word: "մուկ", translit: "muk", fr: "souris" } },
  { id: "hi", upper: "Յ", lower: "յ", name: "Հի", nameLatin: "hi", translit: "y", ipa: "j", hint: "« y » comme dans « yaourt »", example: { word: "յոթ", translit: "yot'", fr: "sept" } },
  { id: "nu", upper: "Ն", lower: "ն", name: "Նու", nameLatin: "nu", translit: "n", ipa: "n", hint: "« n » comme dans « nez »", example: { word: "նուռ", translit: "nurr", fr: "grenade" } },
  { id: "sha", upper: "Շ", lower: "շ", name: "Շա", nameLatin: "sha", translit: "sh", ipa: "ʃ", hint: "« ch » comme dans « chat »", example: { word: "շաքար", translit: "shak'ar", fr: "sucre" } },
  { id: "vo", upper: "Ո", lower: "ո", name: "Ո", nameLatin: "vo", translit: "o / vo", ipa: "ɔ / vɔ", hint: "« vo » en début de mot, « o » ailleurs", example: { word: "ոսկոր", translit: "voskor", fr: "os" } },
  { id: "cha", upper: "Չ", lower: "չ", name: "Չա", nameLatin: "tch'a", translit: "ch'", ipa: "tʃʰ", hint: "« tch » aspiré, suivi d'un souffle", example: { word: "չորս", translit: "ch'ors", fr: "quatre" } },
  { id: "pe", upper: "Պ", lower: "պ", name: "Պե", nameLatin: "pe", translit: "p", ipa: "p", hint: "« p » sec, sans souffle (comme en français)", example: { word: "պղպեղ", translit: "pghpegh", fr: "poivre" } },
  { id: "dje", upper: "Ջ", lower: "ջ", name: "Ջե", nameLatin: "dje", translit: "j", ipa: "dʒ", hint: "« dj » comme dans « djembé »", example: { word: "ջուր", translit: "jur", fr: "eau" } },
  { id: "ra", upper: "Ռ", lower: "ռ", name: "Ռա", nameLatin: "rra", translit: "rr", ipa: "r", hint: "« r » roulé, plusieurs battements", example: { word: "ռադիո", translit: "rradio", fr: "radio" } },
  { id: "se", upper: "Ս", lower: "ս", name: "Սե", nameLatin: "se", translit: "s", ipa: "s", hint: "« s » comme dans « sel »", example: { word: "սեր", translit: "ser", fr: "amour" } },
  { id: "vev", upper: "Վ", lower: "վ", name: "Վեվ", nameLatin: "vev", translit: "v", ipa: "v", hint: "« v » comme dans « vent »", example: { word: "վագր", translit: "vagr", fr: "tigre" } },
  { id: "tiun", upper: "Տ", lower: "տ", name: "Տյուն", nameLatin: "tyun", translit: "t", ipa: "t", hint: "« t » sec, sans souffle (comme en français)", example: { word: "տանձ", translit: "tandz", fr: "poire" } },
  { id: "re", upper: "Ր", lower: "ր", name: "Րե", nameLatin: "re", translit: "r", ipa: "ɾ", hint: "« r » battu, un seul coup de langue", example: { word: "րոպե", translit: "rope", fr: "minute" } },
  { id: "tso", upper: "Ց", lower: "ց", name: "Ցո", nameLatin: "ts'o", translit: "ts'", ipa: "tsʰ", hint: "« ts » aspiré, suivi d'un souffle", example: { word: "ցուլ", translit: "ts'ul", fr: "taureau" } },
  { id: "u", upper: "Ու", lower: "ու", name: "Ու", nameLatin: "ou", translit: "u", ipa: "u", hint: "« ou » comme dans « loup »", example: { word: "ուղտ", translit: "ught", fr: "chameau" } },
  { id: "piur", upper: "Փ", lower: "փ", name: "Փյուր", nameLatin: "p'yur", translit: "p'", ipa: "pʰ", hint: "« p » aspiré, suivi d'un souffle", example: { word: "փիղ", translit: "p'igh", fr: "éléphant" } },
  { id: "ke", upper: "Ք", lower: "ք", name: "Քե", nameLatin: "k'e", translit: "k'", ipa: "kʰ", hint: "« k » aspiré, suivi d'un souffle", example: { word: "քամի", translit: "k'ami", fr: "vent" } },
  { id: "yev", upper: "Եվ", lower: "և", name: "Եվ", nameLatin: "yev", translit: "ev / yev", ipa: "ɛv / jɛv", hint: "« yév » en début de mot, « év » ailleurs", example: { word: "անձրև", translit: "andzrev", fr: "pluie" } },
  { id: "o", upper: "Օ", lower: "օ", name: "Օ", nameLatin: "o", translit: "o", ipa: "ɔ", hint: "« o », même en début de mot", example: { word: "օճառ", translit: "ochar", fr: "savon" } },
  { id: "fe", upper: "Ֆ", lower: "ֆ", name: "Ֆե", nameLatin: "fe", translit: "f", ipa: "f", hint: "« f » comme dans « fête »", example: { word: "ֆիլմ", translit: "film", fr: "film" } },
];

export const LETTERS_BY_ID: Record<string, Letter> = Object.fromEntries(LETTERS.map((l) => [l.id, l]));

/** Lettres dont le son est proche : utilisées comme distracteurs dans les quiz. */
export const SOUND_GROUPS: string[][] = [
  ["pe", "ben", "piur"],
  ["tiun", "da", "to"],
  ["ken", "gim", "ke"],
  ["tsa", "dza", "tso"],
  ["che", "dje", "cha"],
  ["ra", "re"],
  ["yech", "e", "et"],
  ["vo", "o", "u"],
  ["khe", "ghat", "ho"],
  ["zhe", "sha", "za", "se"],
];

/** Lettres qui se ressemblent visuellement (minuscules surtout). */
export const SHAPE_GROUPS: string[][] = [
  ["ben", "ke", "dje"],
  ["vo", "se", "et", "re", "nu"],
  ["da", "ghat", "gim", "za"],
  ["tsa", "che", "dza"],
  ["ini", "khe", "ho"],
  ["ken", "liun"],
  ["tso", "gim"],
  ["tiun", "u"],
  ["hi", "ra"],
  ["pe", "ghat"],
];

/** Lettres homophones en arménien oriental : à distinguer par le nom dans les quiz « son → … ». */
export const HOMOPHONES: string[][] = [
  ["yech", "e"],
  ["vo", "o"],
];
