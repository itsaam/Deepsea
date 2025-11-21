/**
 * Jeu de Roulette Casino - Réservé aux Admins
 */

const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36

// Couleurs de la roulette européenne
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];
const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
];

// Types de paris
const BET_TYPES = {
  STRAIGHT: "straight", // Un seul numéro (payout 35:1)
  RED: "red", // Rouge (payout 1:1)
  BLACK: "black", // Noir (payout 1:1)
  EVEN: "even", // Pair (payout 1:1)
  ODD: "odd", // Impair (payout 1:1)
  LOW: "low", // 1-18 (payout 1:1)
  HIGH: "high", // 19-36 (payout 1:1)
  DOZEN1: "dozen1", // 1-12 (payout 2:1)
  DOZEN2: "dozen2", // 13-24 (payout 2:1)
  DOZEN3: "dozen3", // 25-36 (payout 2:1)
};

/**
 * Lance la roulette et retourne le numéro gagnant
 */
const spinRoulette = () => {
  const winningNumber = Math.floor(Math.random() * 37); // 0-36
  const isRed = RED_NUMBERS.includes(winningNumber);
  const isBlack = BLACK_NUMBERS.includes(winningNumber);
  const color = winningNumber === 0 ? "green" : isRed ? "red" : "black";

  return {
    number: winningNumber,
    color,
    isEven: winningNumber !== 0 && winningNumber % 2 === 0,
    isOdd: winningNumber !== 0 && winningNumber % 2 !== 0,
    isLow: winningNumber >= 1 && winningNumber <= 18,
    isHigh: winningNumber >= 19 && winningNumber <= 36,
  };
};

/**
 * Vérifie si un pari est gagnant
 */
const checkWin = (bet, result) => {
  switch (bet.type) {
    case BET_TYPES.STRAIGHT:
      return result.number === bet.value;
    case BET_TYPES.RED:
      return result.color === "red";
    case BET_TYPES.BLACK:
      return result.color === "black";
    case BET_TYPES.EVEN:
      return result.isEven;
    case BET_TYPES.ODD:
      return result.isOdd;
    case BET_TYPES.LOW:
      return result.isLow;
    case BET_TYPES.HIGH:
      return result.isHigh;
    case BET_TYPES.DOZEN1:
      return result.number >= 1 && result.number <= 12;
    case BET_TYPES.DOZEN2:
      return result.number >= 13 && result.number <= 24;
    case BET_TYPES.DOZEN3:
      return result.number >= 25 && result.number <= 36;
    default:
      return false;
  }
};

/**
 * Calcule le gain selon le type de pari
 */
const calculatePayout = (bet, isWin) => {
  if (!isWin) return 0;

  const payoutRatios = {
    [BET_TYPES.STRAIGHT]: 35,
    [BET_TYPES.RED]: 1,
    [BET_TYPES.BLACK]: 1,
    [BET_TYPES.EVEN]: 1,
    [BET_TYPES.ODD]: 1,
    [BET_TYPES.LOW]: 1,
    [BET_TYPES.HIGH]: 1,
    [BET_TYPES.DOZEN1]: 2,
    [BET_TYPES.DOZEN2]: 2,
    [BET_TYPES.DOZEN3]: 2,
  };

  return bet.amount * (payoutRatios[bet.type] || 0);
};

/**
 * Joue un tour de roulette avec plusieurs paris
 */
const playRoulette = (bets) => {
  const result = spinRoulette();
  const outcomes = [];
  let totalWinnings = 0;
  let totalBet = 0;

  for (const bet of bets) {
    totalBet += bet.amount;
    const isWin = checkWin(bet, result);
    const payout = calculatePayout(bet, isWin);
    totalWinnings += payout;

    outcomes.push({
      bet: bet,
      isWin,
      payout,
    });
  }

  return {
    result,
    outcomes,
    totalBet,
    totalWinnings,
    netProfit: totalWinnings - totalBet,
    message: getResultMessage(result),
  };
};

/**
 * Génère un message fun selon le résultat
 */
const getResultMessage = (result) => {
  if (result.number === 0) {
    return "🟢 Zéro ! La maison gagne toujours ! 🎰";
  }

  const messages = [
    `${result.color === "red" ? "🔴" : "⚫"} ${result.number} - ${
      result.color === "red" ? "Rouge" : "Noir"
    } !`,
    `Le ${result.number} sort ! ${result.isEven ? "Pair" : "Impair"} !`,
    `${result.number} - Un classique des abysses ! 🌊`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Obtient les statistiques de la table
 */
const getRouletteStats = (history) => {
  if (!history || history.length === 0) {
    return {
      mostCommonNumber: null,
      mostCommonColor: null,
      totalSpins: 0,
      redCount: 0,
      blackCount: 0,
      greenCount: 0,
    };
  }

  const numberCounts = {};
  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;

  history.forEach((spin) => {
    numberCounts[spin.number] = (numberCounts[spin.number] || 0) + 1;
    if (spin.color === "red") redCount++;
    else if (spin.color === "black") blackCount++;
    else greenCount++;
  });

  const mostCommonNumber = Object.keys(numberCounts).reduce((a, b) =>
    numberCounts[a] > numberCounts[b] ? a : b
  );

  return {
    mostCommonNumber: parseInt(mostCommonNumber),
    mostCommonColor:
      redCount > blackCount ? "red" : blackCount > redCount ? "black" : "green",
    totalSpins: history.length,
    redCount,
    blackCount,
    greenCount,
  };
};

/**
 * Messages drôles pour les gains/pertes
 */
const getFunMessage = (netProfit) => {
  if (netProfit > 100) {
    return "🤑 Jackpot ! Tu es le roi des abysses ! 🦈";
  } else if (netProfit > 50) {
    return "💰 Joli coup ! Les poissons sont jaloux ! 🐟";
  } else if (netProfit > 0) {
    return "✨ Petit gain ! Même une crevette commence quelque part ! 🦐";
  } else if (netProfit === 0) {
    return "😐 Ni perdu ni gagné... Comme un poisson immobile dans l'eau !";
  } else if (netProfit > -50) {
    return "😅 Petite perte... Les algues sont plus rentables ! 🌿";
  } else if (netProfit > -100) {
    return "😭 Grosse perte ! Le Kraken a pris ton argent ! 🦑";
  } else {
    return "💀 Catastrophe ! Tu as coulé plus vite que le Titanic ! 🚢";
  }
};

module.exports = {
  spinRoulette,
  checkWin,
  calculatePayout,
  playRoulette,
  getRouletteStats,
  getFunMessage,
  BET_TYPES,
  RED_NUMBERS,
  BLACK_NUMBERS,
};
