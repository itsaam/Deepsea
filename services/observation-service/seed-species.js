const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const species = [
  { name: "Baleine Bleue", authorId: 1 },
  { name: "Grand Requin Blanc", authorId: 1 },
  { name: "Dauphin Commun", authorId: 1 },
  { name: "Tortue Caouanne", authorId: 1 },
  { name: "Méduse Aurelia", authorId: 1 },
  { name: "Calamar Géant", authorId: 1 },
  { name: "Raie Manta", authorId: 1 },
  { name: "Orque", authorId: 1 },
  { name: "Narval", authorId: 1 },
  { name: "Hippocampe", authorId: 1 },
  { name: "Pieuvre Commune", authorId: 1 },
  { name: "Étoile de Mer", authorId: 1 },
  { name: "Crabe Royal", authorId: 1 },
  { name: "Homard Bleu", authorId: 1 },
  { name: "Poisson Clown", authorId: 1 },
  { name: "Murène Verte", authorId: 1 },
  { name: "Requin Marteau", authorId: 1 },
  { name: "Otarie de Californie", authorId: 1 },
  { name: "Morse de l'Atlantique", authorId: 1 },
  { name: "Manchot Empereur", authorId: 1 }
];

async function main() {
  console.log('🌊 Ajout des espèces marines...');
  
  for (const sp of species) {
    const created = await prisma.species.create({
      data: sp
    });
    console.log(`✅ ${created.name} créée (ID: ${created.id})`);
  }
  
  console.log(`\n🎉 ${species.length} espèces ajoutées avec succès !`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
