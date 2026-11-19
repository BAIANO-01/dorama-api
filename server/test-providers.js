import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

async function testAllProviders() {
  const res = await fetch('https://sdk.dramasdk.com/api/home?lang=pt&pageSize=200', {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  const data = await res.json();
  const cats = data.data?.categories || [];
  const byProvider = {};
  for (const c of cats) {
    for (const s of c.stories || []) {
      if (!byProvider[s.provider]) byProvider[s.provider] = s;
    }
  }

  console.log('Testing streams for available providers...');
  for (const [provider, s] of Object.entries(byProvider)) {
    try {
      const sourceId = s.source_story_id || (s.story_id.includes(':') ? s.story_id.split(':')[1] : s.story_id);
      const sRes = await fetch(`https://sdk.dramasdk.com/api/stream?bookId=${encodeURIComponent(sourceId)}&episode=1&provider=${provider}`, {
        headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        const ep = sData.data?.categories?.[0]?.stories?.[0]?.episodes?.[0];
        console.log(`[${provider}] OK! "${s.title}" -> ep1: ${ep?.video_url ? ep.video_url.slice(0, 60) + '...' : 'none'} (type: ${ep?.video_type})`);
      } else {
        console.log(`[${provider}] Error: ${sRes.status}`);
      }
    } catch (e) {
      console.log(`[${provider}] Exception:`, e.message);
    }
  }
}
testAllProviders();
