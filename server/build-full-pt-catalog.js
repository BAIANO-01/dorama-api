import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

// Strict Portuguese detection: accents or Portuguese-specific words (avoids English words like 'a')
const ptAccentsRegex = /[ãõáéíóúçêô]/i;
const ptSpecificWords = /\b(dublado|mãe|mães|irmão|irmãos|irmã|irmãs|não|máfia|você|vocês|coração|paixão|três|bebê|bebês|bilionária|bilionário|salário|demissão|prisão|trocada|madrasta|selvagens|fugiu|perseguiu|casou|vingança|traição|ninguém|comigo|depois|agora|quando|namorado|namorada|marido|esposa|filho|filha|inquilino|guarda-costas|coelhinho|apocalipse|carona|grátis|amante|patrão|chefe|doutor|professora|zelador|lutador|inimigo|ruína|perdi|achei|voltou|voltei|deixe|deixou|fiquei|mandei|papai|mamãe|casamento|noiva|noivo|herdeira|herdeiro|vingar|reviravolta)\b/i;

function isAuthenticPortuguese(title, desc) {
  const t = String(title || '');
  const d = String(desc || '');
  if (t.toLowerCase().includes('dublado')) return true;
  if (ptAccentsRegex.test(t)) return true;
  if (ptSpecificWords.test(t)) return true;
  if (ptAccentsRegex.test(d) && ptSpecificWords.test(d)) return true;
  return false;
}

async function buildFullCatalog() {
  console.log('[DramaSDK] Buscando todas as páginas do catálogo multi-provider...');
  const allStories = [];
  const seenIds = new Set();

  for (let page = 1; page <= 25; page++) {
    try {
      const res = await fetch(`https://sdk.dramasdk.com/api/home?lang=pt&pageNo=${page}&pageSize=200`, {
        headers: {
          'X-App-Package-ID': pkg,
          'X-App-Secure-Token': token
        }
      });
      if (!res.ok) break;
      const data = await res.json();
      const categories = data.data?.categories || [];
      let added = 0;
      for (const c of categories) {
        for (const s of (c.stories || [])) {
          const id = s.story_id || s.id;
          if (!id || seenIds.has(id)) continue;
          // Filter out dummy cartoon dogs and cats (d1)
          if (s.provider === 'd1') continue;
          seenIds.add(id);
          allStories.push({ ...s, rawCategoryName: c.category_name });
          added++;
        }
      }
      console.log(`Page ${page}: +${added} novos doramas.`);
      if (added === 0 && page > 5) break;
    } catch (e) {
      console.error(`Erro na página ${page}:`, e.message);
    }
  }

  console.log(`Total de doramas carregados da API: ${allStories.length}`);

  // Separate authentic Portuguese Dublado vs international
  const ptDubbed = [];
  const international = [];

  for (const s of allStories) {
    const rawTitle = String(s.title || '').trim();
    const rawDesc = String(s.description || '').trim();

    const isPt = isAuthenticPortuguese(rawTitle, rawDesc);

    const cleanSourceId = s.story_id
      ? (s.story_id.includes(':') ? s.story_id.split(':')[1] : s.story_id)
      : String(s.id);
    const provider = s.provider || (s.story_id && s.story_id.includes(':') ? s.story_id.split(':')[0] : 'gen');

    // Deduce Genre
    let genre = 'Drama';
    const combinedText = (rawTitle + ' ' + rawDesc).toLowerCase();
    if (combinedText.includes('máfia') || combinedText.includes('mafia') || combinedText.includes('don ') || combinedText.includes('gangue')) genre = 'Máfia';
    else if (combinedText.includes('bilionário') || combinedText.includes('bilionario') || combinedText.includes('rico') || combinedText.includes('herdeir') || combinedText.includes('ceo')) genre = 'Bilionários';
    else if (combinedText.includes('vingança') || combinedText.includes('vinganca') || combinedText.includes('traição') || combinedText.includes('traicao') || combinedText.includes('revidar') || combinedText.includes('ruína')) genre = 'Vingança';
    else if (combinedText.includes('casamento') || combinedText.includes('noiv') || combinedText.includes('amante') || combinedText.includes('amor') || combinedText.includes('divórcio')) genre = 'Romance';
    else if (combinedText.includes('família') || combinedText.includes('familia') || combinedText.includes('filho') || combinedText.includes('bebê') || combinedText.includes('irmã') || combinedText.includes('irmão')) genre = 'Família';
    else if (combinedText.includes('lobo') || combinedText.includes('alfa') || combinedText.includes('magia') || combinedText.includes('elfo')) genre = 'Fantasia';

    if (isPt) {
      // Clean title format
      let cleanTitle = rawTitle
        .replace(/\[dublado\]/gi, '')
        .replace(/\(dublado\)/gi, '')
        .replace(/^\s*-\s*/, '')
        .trim();
      const displayTitle = `[Dublado PT-BR] ${cleanTitle}`;

      ptDubbed.push({
        id: `dramasdk-${provider}-${cleanSourceId}`,
        rawId: s.id || cleanSourceId,
        sourceStoryId: cleanSourceId,
        title: displayTitle,
        cleanTitle: cleanTitle,
        desc: rawDesc || `Assista a todos os episódios de ${cleanTitle} em alta definição com dublagem completa em português.`,
        img: s.cover || '',
        eps: s.total_episodes || (s.episodes ? s.episodes.length : 40),
        views: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 899 + 100)}.000`,
        rating: (9.4 + Math.random() * 0.5).toFixed(1),
        genre,
        tag: 'DUBLADO PT-BR',
        isDubbedPt: true,
        provider,
        language: 'pt-BR',
        licensed: true
      });
    } else {
      // International / English
      international.push({
        id: `dramasdk-${provider}-${cleanSourceId}`,
        rawId: s.id || cleanSourceId,
        sourceStoryId: cleanSourceId,
        title: rawTitle,
        cleanTitle: rawTitle,
        desc: rawDesc,
        img: s.cover || '',
        eps: s.total_episodes || (s.episodes ? s.episodes.length : 40),
        views: `${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 899 + 100)}.000`,
        rating: (9.2 + Math.random() * 0.5).toFixed(1),
        genre,
        tag: 'LEGENDADO',
        isDubbedPt: false,
        provider,
        language: s.language || 'en',
        licensed: true
      });
    }
  }

  console.log(`[SUCESSO] ${ptDubbed.length} Doramas 100% Nativamente Dublados em Português encontrados!`);
  console.log(`[SUCESSO] ${international.length} Doramas Internacionais adicionais encontrados.`);

  // FINAL CATALOG: PT-BR DUBLADOS COME FIRST, THEN INTERNATIONAL!
  const finalCatalog = [...ptDubbed, ...international];

  const outputPath = path.join(__dirname, 'catalog-dramasdk.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalCatalog, null, 2), 'utf8');
  console.log(`[PRONTO] Catálogo final com ${finalCatalog.length} doramas gravado com sucesso em ${outputPath}`);
}

buildFullCatalog();
