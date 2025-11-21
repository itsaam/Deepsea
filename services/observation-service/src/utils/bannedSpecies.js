/**
 * Liste des animaux terrestres et aériens bannis pour DeepSea
 * Seules les espèces aquatiques sont autorisées
 */

// Mammifères terrestres
const terrestrialMammals = [
  // Grands félins
  "lion",
  "tigre",
  "léopard",
  "jaguar",
  "guépard",
  "panthère",
  "puma",
  "lynx",
  "ocelot",
  "serval",

  // Canidés
  "loup",
  "chien",
  "renard",
  "coyote",
  "chacal",
  "dingo",
  "hyène",

  // Ours
  "ours",
  "grizzly",
  "panda",
  "ours polaire",
  "ours brun",
  "ours noir",

  // Primates
  "singe",
  "chimpanzé",
  "gorille",
  "orang-outan",
  "bonobo",
  "babouin",
  "mandrill",
  "macaque",
  "gibbon",
  "tamarin",
  "ouistiti",
  "capucin",
  "lémurien",
  "loris",
  "tarsier",

  // Grands herbivores
  "éléphant",
  "rhinocéros",
  "hippopotame",
  "girafe",
  "chameau",
  "dromadaire",
  "buffle",
  "bison",
  "yak",
  "zèbre",
  "gnou",
  "antilope",
  "gazelle",
  "impala",
  "koudou",
  "oryx",

  // Équidés
  "cheval",
  "âne",
  "mulet",
  "poney",
  "mustang",

  // Bovidés domestiques et sauvages
  "vache",
  "taureau",
  "boeuf",
  "chèvre",
  "mouton",
  "bélier",
  "chèvre de montagne",

  // Cervidés
  "cerf",
  "biche",
  "renne",
  "caribou",
  "élan",
  "orignal",
  "chevreuil",
  "daim",
  "wapiti",

  // Porcins
  "cochon",
  "porc",
  "sanglier",
  "phacochère",
  "pécari",
  "babiroussa",

  // Rongeurs
  "souris",
  "rat",
  "hamster",
  "cobaye",
  "cochon d'inde",
  "lapin",
  "lièvre",
  "écureuil",
  "castor",
  "marmotte",
  "chinchilla",
  "gerbille",
  "lemming",
  "campagnol",
  "mulot",
  "ragondin",
  "capybara",
  "porc-épic",
  "hérisson",

  // Marsupiaux
  "kangourou",
  "wallaby",
  "koala",
  "wombat",
  "opossum",
  "diable de tasmanie",
  "quokka",

  // Autres mammifères
  "taupe",
  "musaraigne",
  "chauve-souris",
  "hérisson",
  "tatou",
  "fourmilier",
  "paresseux",
  "tamanoir",
  "pangolin",
  "aardvark",
  "tapir",
  "okapi",
  "belette",
  "hermine",
  "vison",
  "putois",
  "furet",
  "blaireau",
  "ratel",
  "mangouste",
  "suricate",
  "civette",
  "genette",
];

// Oiseaux (tous sont bannis car ils ne sont pas aquatiques)
const birds = [
  // Rapaces
  "aigle",
  "faucon",
  "épervier",
  "buse",
  "milan",
  "autour",
  "vautour",
  "condor",
  "hibou",
  "chouette",
  "effraie",
  "harfang",

  // Oiseaux communs
  "moineau",
  "pigeon",
  "tourterelle",
  "colombe",
  "corbeau",
  "corneille",
  "pie",
  "geai",
  "merle",
  "grive",
  "rouge-gorge",
  "mésange",
  "pinson",
  "chardonneret",
  "bouvreuil",
  "verdier",
  "serin",
  "linotte",
  "roitelet",
  "troglodyte",
  "accenteur",
  "fauvette",
  "rossignol",
  "hirondelle",
  "martinet",
  "bergeronnette",
  "étourneau",
  "loriot",

  // Grands oiseaux
  "autruche",
  "émeu",
  "nandou",
  "casoar",
  "kiwi",
  "dodo",

  // Gallinacés
  "poule",
  "coq",
  "poulet",
  "dinde",
  "dindon",
  "faisan",
  "perdrix",
  "caille",
  "pintade",
  "paon",
  "tétras",
  "gélinotte",

  // Perroquets et psittacidés
  "perroquet",
  "perruche",
  "cacatoès",
  "ara",
  "amazone",
  "conure",
  "inséparable",
  "calopsitte",
  "loriquet",

  // Oiseaux exotiques
  "toucan",
  "colibri",
  "martin-pêcheur",
  "pic",
  "pic-vert",
  "coucou",
  "calao",
  "paradisier",
  "cassican",
  "manakin",
  "cotinga",

  // Échassiers terrestres
  "autruche",
  "émeu",
  "casoar",

  // Autres oiseaux
  "cygne",
  "oie",
  "canard",
  "sarcelle",
  "pilet",
  "colvert",
  "tadorne",
  "pie-grièche",
  "jaseur",
  "gobe-mouche",
  "rouge-queue",
  "tarier",
  "traquet",
  "huppe",
  "guêpier",
  "rollier",
  "engoulevent",
];

// Reptiles terrestres
const terrestrialReptiles = [
  // Serpents
  "serpent",
  "python",
  "boa",
  "anaconda",
  "cobra",
  "vipère",
  "crotale",
  "mamba",
  "couleuvre",
  "coronelle",
  "aspic",
  "mocassin",
  "taipan",
  "bongare",

  // Lézards
  "lézard",
  "iguane",
  "caméléon",
  "gecko",
  "varan",
  "scinque",
  "agame",
  "anolis",
  "dragon de komodo",
  "moloch",
  "téju",
  "dragon barbu",

  // Tortues terrestres
  "tortue terrestre",
  "tortue géante",
  "tortue léopard",
  "tortue étoilée",
  "tortue d'hermann",
  "tortue grecque",
  "tortue boîte",

  // Crocodiliens (semi-aquatiques mais souvent associés)
  "crocodile",
  "alligator",
  "caïman",
  "gavial",
];

// Amphibiens (certains sont bannis car principalement terrestres)
const terrestrialAmphibians = [
  "grenouille",
  "crapaud",
  "rainette",
  "salamandre",
  "triton",
  "axolotl",
  "cécilie",
  "protée",
  "ambystome",
];

// Arthropodes terrestres
const terrestrialArthropods = [
  // Insectes
  "mouche",
  "moustique",
  "abeille",
  "guêpe",
  "frelon",
  "bourdon",
  "fourmi",
  "papillon",
  "chenille",
  "coccinelle",
  "scarabée",
  "hanneton",
  "lucane",
  "carabe",
  "doryphore",
  "charançon",
  "puceron",
  "cochenille",
  "cigale",
  "criquet",
  "sauterelle",
  "grillon",
  "mante religieuse",
  "phasme",
  "blatte",
  "cafard",
  "termite",
  "libellule",
  "demoiselle",
  "éphémère",
  "phrygane",
  "punaise",
  "perce-oreille",
  "thrips",
  "pou",
  "puce",
  "tique",

  // Arachnides
  "araignée",
  "tarentule",
  "veuve noire",
  "recluse",
  "scorpion",
  "pseudoscorpion",
  "opilion",
  "faucheux",
  "acarien",
  "aoûtat",

  // Myriapodes
  "mille-pattes",
  "scolopendre",
  "iule",
  "gloméris",
  "scutigère",

  // Crustacés terrestres
  "cloporte",
  "bernard-l'ermite terrestre",
];

// Mollusques terrestres
const terrestrialMollusks = [
  "escargot terrestre",
  "limace",
  "escargot de bourgogne",
  "escargot petit-gris",
];

// Animaux de ferme
const farmAnimals = [
  "vache",
  "cochon",
  "porc",
  "chèvre",
  "mouton",
  "cheval",
  "âne",
  "poule",
  "coq",
  "dinde",
  "canard domestique",
  "oie domestique",
  "lapin domestique",
];

// Animaux de compagnie terrestres
const terrestrialPets = [
  "chien",
  "chat",
  "hamster",
  "cochon d'inde",
  "lapin",
  "furet",
  "chinchilla",
  "gerbille",
  "rat domestique",
  "souris domestique",
  "perruche",
  "perroquet",
  "canari",
  "tortue terrestre",
];

// Autres animaux terrestres
const otherTerrestrial = [
  "ver de terre",
  "lombric",
  "sangsue terrestre",
  "nématode",
];

// Combiner toutes les listes
const allBannedSpecies = [
  ...terrestrialMammals,
  ...birds,
  ...terrestrialReptiles,
  ...terrestrialAmphibians,
  ...terrestrialArthropods,
  ...terrestrialMollusks,
  ...farmAnimals,
  ...terrestrialPets,
  ...otherTerrestrial,
];

// Créer un Set pour des recherches plus rapides
const bannedSpeciesSet = new Set(
  allBannedSpecies.map((name) => name.toLowerCase())
);

/**
 * Vérifie si un nom d'espèce contient des mots bannis
 * @param {string} speciesName - Le nom de l'espèce à vérifier
 * @returns {boolean} - true si l'espèce est bannie, false sinon
 */
const isBannedSpecies = (speciesName) => {
  if (!speciesName) return false;

  const nameLower = speciesName.toLowerCase().trim();

  // Vérification exacte
  if (bannedSpeciesSet.has(nameLower)) {
    return true;
  }

  // Vérification si le nom contient un mot banni
  const words = nameLower.split(/\s+/);
  for (const word of words) {
    if (bannedSpeciesSet.has(word)) {
      return true;
    }
  }

  // Vérification partielle pour les noms composés
  for (const bannedWord of bannedSpeciesSet) {
    if (nameLower.includes(bannedWord)) {
      return true;
    }
  }

  return false;
};

/**
 * Retourne le mot banni trouvé dans le nom de l'espèce
 * @param {string} speciesName - Le nom de l'espèce à vérifier
 * @returns {string|null} - Le mot banni trouvé ou null
 */
const getBannedWord = (speciesName) => {
  if (!speciesName) return null;

  const nameLower = speciesName.toLowerCase().trim();

  // Vérification exacte
  if (bannedSpeciesSet.has(nameLower)) {
    return nameLower;
  }

  // Vérification par mots
  const words = nameLower.split(/\s+/);
  for (const word of words) {
    if (bannedSpeciesSet.has(word)) {
      return word;
    }
  }

  // Vérification partielle
  for (const bannedWord of bannedSpeciesSet) {
    if (nameLower.includes(bannedWord)) {
      return bannedWord;
    }
  }

  return null;
};

module.exports = {
  isBannedSpecies,
  getBannedWord,
  allBannedSpecies,
  bannedSpeciesSet,
};
