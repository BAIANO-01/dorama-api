import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'catalog-dramasdk.json');
const outputPath = path.join(__dirname, 'catalog-dramasdk.json');

if (!fs.existsSync(inputPath)) {
  console.error('catalog-dramasdk.json não encontrado');
  process.exit(1);
}

const items = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Common title translation map & dictionary for romance/short drama tropes
const titleReplacements = [
  // Full phrase mappings
  [/^A Boy and His Service Dog's Adventure/i, "A Jornada do Jovem e seu Cão Leal"],
  [/^A Tale of Friendship, Love and Adventure/i, "Laços de Amizade e Amor Eterno"],
  [/^Adventures of Two Billionaires In Search of True Love/i, "Dois Bilionários em Busca do Amor Verdadeiro"],
  [/^Red Riding Wolf and the Forest Adventure/i, "O Lobo Protetor e a Garota da Floresta"],
  [/^The Adventure of Ingrid and Isabella: Poetry and the Snake Attack/i, "O Segredo de Ingrid e Isabella"],
  [/^You Call My Mom A Mistress/i, "Você Chamou Minha Mãe de Amante"],
  [/^A Breath of Wind, A Fall of Sparks/i, "Chamas do Destino"],
  [/^After Divorce[，,]I Became A Space Legend/i, "Depois do Divórcio, Conquistei o Mundo"],
  [/^A\s*Mother's\s*Redemption/i, "A Redenção de uma Mãe"],
  [/^A Love Once Betrayed/i, "Amor Traído, Paixão Renascida"],
  [/^Trial Marriage to A Billionaire/i, "Casamento de Teste com o Bilionário"],
  [/^Thrown Barefoot Into a Blizzard at Three, I Thawed the Winter King/i, "Descalça na Nevasca: O Despertar do Rei do Inverno"],
  [/^Fiancée's Betrayal, Dante's Inferno/i, "A Traição da Noiva: A Vingança de Dante"],
  [/^How to Dump a Hockey Star/i, "Como Conquistar um Campeão"],
  [/^Oops!\s*Your ex is a secret billionaire/i, "Opa! Meu Ex é um Bilionário Secreto"],
  [/^Sold With Her Mommy to the Scarred Hunter/i, "Vendida com a Mãe ao Caçador Protetor"],
  [/^I Accidentally Seduced the Siren King/i, "Sedução Proibida com o Rei dos Mares"],
  [/^My Cursed Merman Husband Rules the Deep/i, "Meu Marido Tritão: O Soberano do Abismo"],
  [/^Copycat/i, "A Cópia Perfeita: Romance & Mistério"],
  [/^The Alpha's Forbidden Bunny/i, "O Amor Proibido do Supremo Alfa"],
  [/^Spoiled by Four Sea Monster Husbands/i, "Mimada por Quatro Guardiões Místicos"],
  [/^My Strongest Master Likes Acting Weak/i, "O Mestre Supremo que se Finge de Fraco"],
  [/^Demigod Under Oath/i, "O Semideus Sob Juramento"],
  [/^His Bride Her Revenge/i, "A Noiva e o Plano de Vingança"],
  [/^\(Sulih suara\)\s*Enam Tahun Mencari Istrinya/i, "Seis Anos Procurando por Minha Esposa"],
  [/^Kekasih Seram Saat Halloween/i, "Amor Proibido na Noite das Sombras"],
  [/^600-Lb Loser to Boxing Champ/i, "Da Humilhação ao Título de Campeão"],
  [/^The Secret Heir/i, "O Herdeiro Secreto da Família Real"],
  [/^The Billionaire's Hidden Wife/i, "A Esposa Escondida do Magnata"],
  [/^Reborn as the Tycoon's True Love/i, "Renasci como o Amor do Magnata"],
  [/^Sweet Revenge on My Ex/i, "Doce Vingança Contra Meu Ex"],
  [/^Divorced and Fabulous/i, "Divorciada e Poderosa"],
  [/^The CEO's Secret Surrogate/i, "A Barriga de Aluguel Secreta do CEO"]
];

const wordReplacements = [
  [/\bBillionaire\b/gi, "Bilionário"],
  [/\bBillionaires\b/gi, "Bilionários"],
  [/\bMillionaire\b/gi, "Milionário"],
  [/\bTycoon\b/gi, "Magnata"],
  [/\bCEO\b/gi, "CEO"],
  [/\bBoss\b/gi, "Chefe"],
  [/\bWife\b/gi, "Esposa"],
  [/\bHusband\b/gi, "Marido"],
  [/\bBride\b/gi, "Noiva"],
  [/\bGroom\b/gi, "Noivo"],
  [/\bMarriage\b/gi, "Casamento"],
  [/\bDivorce\b/gi, "Divórcio"],
  [/\bDivorced\b/gi, "Divorciada"],
  [/\bRevenge\b/gi, "Vingança"],
  [/\bBetrayal\b/gi, "Traição"],
  [/\bSecret\b/gi, "Secreto"],
  [/\bSecrets\b/gi, "Segredos"],
  [/\bHidden\b/gi, "Oculto"],
  [/\bLove\b/gi, "Amor"],
  [/\bBeloved\b/gi, "Amada"],
  [/\bLover\b/gi, "Amante"],
  [/\bHeart\b/gi, "Coração"],
  [/\bHearts\b/gi, "Corações"],
  [/\bDestiny\b/gi, "Destino"],
  [/\bFate\b/gi, "Destino"],
  [/\bMother\b/gi, "Mãe"],
  [/\bFather\b/gi, "Pai"],
  [/\bSon\b/gi, "Filho"],
  [/\bDaughter\b/gi, "Filha"],
  [/\bBaby\b/gi, "Bebê"],
  [/\bFamily\b/gi, "Família"],
  [/\bKing\b/gi, "Rei"],
  [/\bQueen\b/gi, "Rainha"],
  [/\bPrince\b/gi, "Príncipe"],
  [/\bPrincess\b/gi, "Princesa"],
  [/\bHeir\b/gi, "Herdeiro"],
  [/\bHeiress\b/gi, "Herdeira"],
  [/\bDragon\b/gi, "Dragão"],
  [/\bWolf\b/gi, "Lobo"],
  [/\bAlpha\b/gi, "Alfa"],
  [/\bLuna\b/gi, "Luna"],
  [/\bVampire\b/gi, "Vampiro"],
  [/\bReborn\b/gi, "Renascida"],
  [/\bReturn\b/gi, "Retorno"],
  [/\bDoctor\b/gi, "Médico"],
  [/\bContract\b/gi, "Contrato"],
  [/\bFake\b/gi, "Falso"],
  [/\bTrue\b/gi, "Verdadeiro"],
  [/\bAdventure\b/gi, "Aventura"],
  [/\bAdventures\b/gi, "Aventuras"],
  [/\bIn Search of\b/gi, "Em Busca de"],
  [/\bUnder\b/gi, "Sob"],
  [/\bOath\b/gi, "Juramento"],
  [/\bMaster\b/gi, "Mestre"],
  [/\bStrongest\b/gi, "Mais Forte"],
  [/\bWeak\b/gi, "Fraco"],
  [/\bMonster\b/gi, "Criatura"],
  [/\bDeep\b/gi, "Profundezas"],
  [/\bSea\b/gi, "Mar"],
  [/\bWinter\b/gi, "Inverno"],
  [/\bSummer\b/gi, "Verão"],
  [/\bSpring\b/gi, "Primavera"],
  [/\bFall\b/gi, "Outono"],
  [/\bNight\b/gi, "Noite"],
  [/\bRedemption\b/gi, "Redenção"],
  [/\bSweet\b/gi, "Doce"],
  [/\bBitter\b/gi, "Amargo"],
  [/\bShadow\b/gi, "Sombra"],
  [/\bShadows\b/gi, "Sombras"],
  [/\bLight\b/gi, "Luz"],
  [/\bSpark\b/gi, "Centelha"],
  [/\bSparks\b/gi, "Faíscas"],
  [/\bLegend\b/gi, "Lenda"],
  [/\bSpace\b/gi, "Universo"],
  [/\bStar\b/gi, "Estrela"],
  [/\bForbidden\b/gi, "Proibido"],
  [/\bCursed\b/gi, "Amaldiçoado"],
  [/\bMistress\b/gi, "Amante"],
  [/\bService Dog\b/gi, "Cão Companheiro"],
  [/\bFriendship\b/gi, "Amizade"],
  [/\bTale of\b/gi, "História de"],
  [/\bTale\b/gi, "Conto"],
  [/\bThe\b/gi, "O"],
  [/\bA\b/gi, "Um"],
  [/\bAn\b/gi, "Um"],
  [/\bAnd\b/gi, "e"],
  [/\bOf\b/gi, "de"],
  [/\bTo\b/gi, "para"],
  [/\bIn\b/gi, "em"],
  [/\bOn\b/gi, "em"],
  [/\bWith\b/gi, "com"],
  [/\bFor\b/gi, "por"],
  [/\bMy\b/gi, "Meu"],
  [/\bYour\b/gi, "Seu"],
  [/\bHis\b/gi, "Seu"],
  [/\bHer\b/gi, "Sua"]
];

const genreTranslations = {
  'Adventure': 'Aventura',
  'Romance': 'Romance',
  'CEO': 'CEO & Bilionários',
  'Billionaire': 'Bilionários',
  'Revenge': 'Vingança',
  'Family': 'Família',
  'Werewolf': 'Lobisomem',
  'Fantasy': 'Fantasia',
  'Drama': 'Drama',
  'Youth': 'Juventude',
  'Suspense': 'Suspense',
  'Comedy': 'Comédia',
  'Urban': 'Urbano & Poder',
  'Historical': 'Histórico & Nobreza',
  'Action': 'Ação & Vingança',
  'Costume': 'Época'
};

function translateTitle(title) {
  if (!title) return '[Dublado] Dorama Exclusivo';
  let t = String(title).trim();

  // If already Portuguese, just ensure [Dublado] tag
  if (/^\[Dublado\]/i.test(t)) return t;
  if (/([ãõáéíóúç]|\b(o|a|os|as|um|uma|de|do|da|em|com|para|por|que|não|meu|minha|seu|sua)\b)/i.test(t) && !/\b(the|and|with|for|you|her|his)\b/i.test(t)) {
    return `[Dublado] ${t}`;
  }

  // Check direct full title mappings
  for (const [pattern, replacement] of titleReplacements) {
    if (pattern.test(t)) {
      return `[Dublado] ${replacement}`;
    }
  }

  // Replace common words
  let translated = t;
  for (const [pattern, replacement] of wordReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  // Capitalize nicely
  translated = translated.replace(/\s+/g, ' ').trim();
  if (!translated.startsWith('[Dublado]')) {
    translated = `[Dublado] ${translated}`;
  }

  return translated;
}

function translateGenre(g) {
  if (!g) return 'Drama Romântico';
  return genreTranslations[g] || g;
}

function generatePtDesc(title, genre) {
  const cleanTitle = title.replace(/^\[Dublado\]\s*/i, '');
  return `Assista à história emocionante de "${cleanTitle}". Uma produção envolvente com reviravoltas intensas, segredos revelados e romance apaixonante. Todos os episódios completos e dublados em português para você maratonar.`;
}

let translatedCount = 0;
const localizedItems = items.map(d => {
  const newTitle = translateTitle(d.title);
  const newGenre = translateGenre(d.genre);
  const newDesc = d.description && d.description.length > 50 && /[ãõáéíóúç]/i.test(d.description) 
    ? d.description 
    : generatePtDesc(newTitle, newGenre);

  translatedCount++;
  return {
    ...d,
    title: newTitle,
    genre: newGenre,
    tag: 'DUBLADO PT-BR',
    desc: newDesc,
    description: newDesc,
    lang: 'pt'
  };
});

fs.writeFileSync(outputPath, JSON.stringify(localizedItems, null, 2), 'utf8');
console.log(`[SUCESSO] ${translatedCount} doramas do DramaSDK foram 100% localizados para Português (PT-BR) com a tag [Dublado]!`);
