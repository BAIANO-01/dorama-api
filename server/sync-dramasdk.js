import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAMASDK_BASE_URL = (process.env.DRAMASDK_BASE_URL || 'https://sdk.dramasdk.com').replace(/\/$/, '');
const DRAMASDK_TOKEN = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const DRAMASDK_PACKAGE_ID = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

export async function fetchDramaSdkCatalog() {
  console.log('[DramaSDK] Iniciando busca de catálogo em', DRAMASDK_BASE_URL);
  
  const headers = {
    'X-App-Package-ID': DRAMASDK_PACKAGE_ID,
    'X-App-Secure-Token': DRAMASDK_TOKEN,
    'Accept': 'application/json'
  };

  const response = await fetch(`${DRAMASDK_BASE_URL}/api/home?lang=pt&pageSize=200`, {
    headers,
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`DramaSDK respondeu com HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const categories = payload.data?.categories || [];
  const banners = payload.data?.banners || [];

  const catalog = [];
  const seenIds = new Set();

  for (const cat of categories) {
    const categoryName = cat.category_name || 'Dramas Populares';
    for (const story of cat.stories || []) {
      const sourceId = story.source_story_id || (story.story_id.includes(':') ? story.story_id.split(':')[1] : story.story_id);
      const uniqueId = `dramasdk-${story.provider || 'gen'}-${sourceId}`;

      if (seenIds.has(uniqueId)) continue;
      seenIds.add(uniqueId);

      const epsCount = Number(story.total_episodes) || (Array.isArray(story.episodes) ? story.episodes.length : 20);
      const rating = story.rating ? Number(story.rating).toFixed(1) : (9.2 + Math.random() * 0.7).toFixed(1);
      const views = (story.view_count || (Math.floor(Math.random() * 400 + 100) * 1000)).toLocaleString('pt-BR');

      catalog.push({
        id: uniqueId,
        rawId: sourceId,
        storyId: story.story_id,
        sourceStoryId: sourceId,
        provider: story.provider || 'reelshort',
        code: sourceId,
        title: story.title || 'Dorama Sem Título',
        genre: story.genre || categoryName.replace(/^Generated Catalog · /, ''),
        categoryName,
        tag: story.provider === 'd1' ? 'EXCLUSIVO' : (story.title.toLowerCase().includes('dublad') ? 'DUBLADO PT' : 'DUBLADO / LEG'),
        eps: epsCount,
        views,
        rating,
        color: story.provider === 'd1' ? '#3b82f6' : '#ec4899',
        img: story.cover,
        desc: story.description || 'Assista a esta emocionante história completa com todos os episódios disponíveis no IgaraDrama.',
        videoUrl: story.video_url || story.episodes?.[0]?.video_url || '',
        videoType: story.video_type || (story.episodes?.[0]?.video_type) || (story.video_url?.endsWith('.mp4') ? 'mp4' : 'm3u8'),
        licensed: true,
        lang: 'pt'
      });
    }
  }

  console.log(`[DramaSDK] Catálogo sincronizado com sucesso: ${catalog.length} doramas encontrados.`);
  
  const cachePath = path.join(__dirname, 'catalog-dramasdk.json');
  try {
    fs.writeFileSync(cachePath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`[DramaSDK] Catálogo salvo em ${cachePath}`);
  } catch (err) {
    console.error('[DramaSDK] Erro ao salvar arquivo catalog-dramasdk.json:', err.message);
  }

  return catalog;
}

if (process.argv[1] && process.argv[1].endsWith('sync-dramasdk.js')) {
  fetchDramaSdkCatalog()
    .then(cat => console.log('Finalizado com', cat.length, 'itens'))
    .catch(err => {
      console.error('Erro na sincronização:', err);
      process.exit(1);
    });
}
