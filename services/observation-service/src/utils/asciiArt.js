/**
 * Générateur d'ASCII Art pour créatures marines
 */

const marineCreatures = [
  {
    name: "Poisson Classique",
    art: `
    ><((((º>
    `,
  },
  {
    name: "Grand Requin",
    art: `
            __
           ( ((
            ) ))
      .____//___\\____
   .___/ _________ \\___
      / /         \\ \\
     / /           \\ \\
    |  |           |  |
     \\ \\___________/ /
      \\___________/
    `,
  },
  {
    name: "Poulpe",
    art: `
       ___
    .-'   '-.
   /  o   o  \\
   |    ^    |
   \\  '---'  /
    '-.___.'-
     /|  |\\
    / |  | \\
   /  |  |  \\
  /   |  |   \\
    `,
  },
  {
    name: "Méduse",
    art: `
      .---.
     /     \\
    | () () |
     \\  ^  /
      '---'
     ~~ | ~~
     ~~ | ~~
     ~~ | ~~
    `,
  },
  {
    name: "Crabe",
    art: `
   ___   ___
  (o o)_(o o)
   \\  0  0  /
    |  __  |
    |_|  |_|
    (_)  (_)
    `,
  },
  {
    name: "Baleine",
    art: `
           .
          ":"
        ___:____     |"\\/"|
      ,'        \`.    \\  /
      |  O        \\___/  |
    ~^~^~^~^~^~^~^~^~^~^~^~^~
    `,
  },
  {
    name: "Calamar Géant",
    art: `
        ___
       /   \\
      | O O |
      |  >  |
       \\___/
        |||
       / | \\
      /  |  \\
     /_  |  _\\
    `,
  },
  {
    name: "Étoile de Mer",
    art: `
        *
       ***
      ** **
     *  *  *
    *   *   *
     *  *  *
      *   *
       * *
        *
    `,
  },
  {
    name: "Hippocampe",
    art: `
       .=\"=.
     _/.-.-.\\_.
    ( ( o o ) )
     |/  \"  \\|
      \\  _  /
      /'\\_/'\\
     /  / \\  \\
    `,
  },
  {
    name: "Raie Manta",
    art: `
         __..--''\\
      .-'         \\
     /      .--._  \\
    |      /     \\ |
    |      \\     / |
     \\      '--'  /
      '-._____..-'
    `,
  },
  {
    name: "Poisson Lune",
    art: `
        ___
      .' o '.
     /   O   \\
    |    o    |
    |  ( _ )  |
     \\       /
      '.___.'
    `,
  },
  {
    name: "Anglerfish (Baudroie)",
    art: `
         o
         |
        .'.
       /   \\
      | O O|
      |  >  |
      | --- |
       \\___/
    `,
  },
  {
    name: "Narval",
    art: `
         /
        /
    ___/__________
   /              \\
  ( o )        ( o )
   \\______________/
    `,
  },
  {
    name: "Tortue Marine",
    art: `
       ___
      /   \\
     | o o |
    ,'\\   /'.
   /   \\_/   \\
  |  _______  |
  | |_______| |
   \\  _____  /
    '-_____-'
    `,
  },
  {
    name: "Poisson-Clown",
    art: `
      __
    <(o )___
     ( ._> /
      '---'
    `,
  },
  {
    name: "Dauphin",
    art: `
          __
         /  \\
    ____/    \\____
   /              \\
  |  o        o   |
   \\      ^       /
    \\_____\\_____/
           /
          /
    `,
  },
  {
    name: "Anguille Électrique",
    art: `
    ~~~~~~~~~~~~
   (  O     O  )
    \\_________/
    ~~~~~~~~~~~~
    `,
  },
  {
    name: "Poisson Globe",
    art: `
      .---.
     / * * \\
    | * o * |
    | *   * |
     \\ * * /
      '---'
     /|   |\\
    `,
  },
  {
    name: "Murène",
    art: `
    _______________
   (               )
   | >  O     O  > |
   (_______________) 
    `,
  },
  {
    name: "Anchois Bizarre",
    art: `
      >°)))彡
    `,
  },
];

/**
 * Retourne un ASCII art aléatoire
 */
const getRandomAsciiArt = () => {
  const random = Math.floor(Math.random() * marineCreatures.length);
  return marineCreatures[random];
};

/**
 * Retourne un ASCII art selon le nom de l'espèce
 * Si le nom contient certains mots-clés, retourne l'art correspondant
 */
const getAsciiArtByName = (speciesName) => {
  const nameLower = speciesName.toLowerCase();

  const keywords = {
    requin: "Grand Requin",
    poulpe: "Poulpe",
    pieuvre: "Poulpe",
    méduse: "Méduse",
    jellyfish: "Méduse",
    crabe: "Crabe",
    baleine: "Baleine",
    whale: "Baleine",
    calamar: "Calamar Géant",
    squid: "Calamar Géant",
    étoile: "Étoile de Mer",
    starfish: "Étoile de Mer",
    hippocampe: "Hippocampe",
    seahorse: "Hippocampe",
    raie: "Raie Manta",
    manta: "Raie Manta",
    lune: "Poisson Lune",
    baudroie: "Anglerfish (Baudroie)",
    anglerfish: "Anglerfish (Baudroie)",
    narval: "Narval",
    narwhal: "Narval",
    tortue: "Tortue Marine",
    turtle: "Tortue Marine",
    clown: "Poisson-Clown",
    nemo: "Poisson-Clown",
    dauphin: "Dauphin",
    dolphin: "Dauphin",
    anguille: "Anguille Électrique",
    eel: "Anguille Électrique",
    globe: "Poisson Globe",
    pufferfish: "Poisson Globe",
    murène: "Murène",
    moray: "Murène",
    anchois: "Anchois Bizarre",
  };

  for (const [keyword, creatureName] of Object.entries(keywords)) {
    if (nameLower.includes(keyword)) {
      const creature = marineCreatures.find((c) => c.name === creatureName);
      if (creature) return creature;
    }
  }

  // Par défaut, retourne un art aléatoire
  return getRandomAsciiArt();
};

module.exports = {
  getRandomAsciiArt,
  getAsciiArtByName,
  marineCreatures,
};
