import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, 'catalog-dramasdk.json');
const rawItems = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Filter OUT d1 (fake/generated cartoon dog and cat test series)
const realItems = rawItems.filter(item => {
  if (item.provider === 'd1') return false;
  const title = (item.title || '').toLowerCase();
  if (title.includes('service dog') || title.includes('bob the cat') || title.includes('puppy')) return false;
  return true;
});

console.log(`Filtrados ${rawItems.length - realItems.length} itens de teste (d1). Restaram ${realItems.length} doramas comerciais reais.`);

// High quality Portuguese title cleanup
function polishTitle(title) {
  let t = String(title || '').replace(/^\[Dublado\]\s*/i, '').replace(/^\[Dubbled\]\s*/i, '').trim();

  const specificMap = {
    "Você Chamou Minha Mãe de Amante": "Você Chamou Minha Mãe de Amante",
    "O Undercover Lady Chefe": "A Chefe Disfarçada",
    "Meu Mercy Ends Here": "Minha Piedade Acaba Aqui",
    "O Day I Gave Birth, I Divorciada": "No Dia em que Dei à Luz, Pedi o Divórcio",
    "O Quiet War": "Guerra Silenciosa",
    "After O Divórcio, O Herdeira Takes It All": "Após o Divórcio, a Herdeira Fica com Tudo",
    "Forever Mine, Against All Odds": "Para Sempre Minha: Contra Todo o Destino",
    "She's Back por Vengeance": "Ela Voltou por Vingança",
    "Fallen por Meu Best Friend's Dad": "Apaixonada pelo Pai do Meu Melhor Amigo",
    "O Double Life de O Bilionário Couple": "A Vida Dupla do Casal Bilionário",
    "O Reborn Tycoon's Counterattack": "O Contra-Ataque do Magnata Renascido",
    "My Cursed Merman Husband Rules the Deep": "Meu Marido Tritão: O Soberano do Mar",
    "Thrown Barefoot Into a Blizzard at Three, I Thawed the Winter King": "Descalça na Nevasca: O Despertar do Rei do Inverno",
    "Sold With Her Mommy to the Scarred Hunter": "Vendida com a Mãe ao Caçador",
    "The Alpha's Forbidden Bunny": "O Amor Proibido do Supremo Alfa",
    "Copycat": "A Cópia Perfeita",
    "Spoiled by Four Sea Monster Husbands": "Protegida pelos Quatro Guardiões Místicos",
    "My Strongest Master Likes Acting Weak": "O Mestre Supremo que se Finge de Fraco",
    "Demigod Under Oath": "O Semideus Sob Juramento",
    "His Bride Her Revenge": "A Noiva e Sua Vingança",
    "O Irmão do Meu Ex Me Quer": "O Irmão do Meu Ex Me Quer",
    "600-Lb Loser to Boxing Champ": "Da Humilhação ao Título de Campeão",
    "Fiancée's Betrayal, Dante's Inferno": "A Traição da Noiva: O Inferno de Dante",
    "How to Dump a Hockey Star": "Como Conquistar o Campeão",
    "Oops! Your ex is a secret billionaire": "Opa! Meu Ex é um Bilionário Secreto",
    "I Accidentally Seduced the Siren King": "Seduzi sem Querer o Rei dos Mares"
  };

  if (specificMap[t]) {
    return `[Dublado] ${specificMap[t]}`;
  }

  // Cleanup mixed translation relics
  t = t
    .replace(/\bO Day\b/gi, "O Dia")
    .replace(/\bO Undercover\b/gi, "A Infiltrada")
    .replace(/\bLady Chefe\b/gi, "Patroa Poderosa")
    .replace(/\bChefe\b/gi, "Chefe")
    .replace(/\bDivorciada\b/gi, "Divórcio")
    .replace(/\bDivorced\b/gi, "Divórcio")
    .replace(/\bpor Vengeance\b/gi, "por Vingança")
    .replace(/\bpor Meu\b/gi, "pelo Meu")
    .replace(/\bO Double Life\b/gi, "A Vida Dupla")
    .replace(/\bde O\b/gi, "do")
    .replace(/\bem O\b/gi, "no")
    .replace(/\bcom O\b/gi, "com o")
    .replace(/\bpara O\b/gi, "para o")
    .replace(/\bO Aventuras\b/gi, "As Aventuras")
    .replace(/\bO Segredos\b/gi, "Os Segredos")
    .replace(/\bO Chamas\b/gi, "As Chamas");

  t = t.replace(/\s+/g, ' ').trim();
  return `[Dublado] ${t}`;
}

function cleanGenre(g) {
  const map = {
    'Sweet Love': 'Romance & Paixão',
    'Betrayal': 'Vingança & Traição',
    'Divorced': 'Divórcio & Volta por Cima',
    'Family Intrigue': 'Segredos de Família',
    'Hidden Identity': 'Identidade Oculta & Bilionários',
    'BG': 'Romance Geral',
    'Revenge': 'Vingança & Revidar',
    'CEO': 'Bilionários & Chefes',
    'Adventure': 'Aventura & Poder',
    'Romance': 'Romance & Paixão',
    'Werewolf': 'Lobisomem & Alfas',
    'Drama': 'Dramas Emocionantes'
  };
  return map[g] || g || 'Romance & Paixão';
}

const cleanedItems = realItems.map(d => {
  const newTitle = polishTitle(d.title);
  const newGenre = cleanGenre(d.genre);
  return {
    ...d,
    title: newTitle,
    genre: newGenre,
    tag: 'DUBLADO PT-BR',
    desc: `Assista a "${newTitle.replace(/^\[Dublado\]\s*/i, '')}" com todos os episódios completos. Uma produção exclusiva de alto sucesso internacional, dublada em português com alta resolução e reviravoltas impressionantes no IgaraDrama.`
  };
});

fs.writeFileSync(catalogPath, JSON.stringify(cleanedItems, null, 2), 'utf8');
console.log(`Catálogo atualizado com ${cleanedItems.length} doramas comerciais reais e títulos 100% polidos em português!`);
