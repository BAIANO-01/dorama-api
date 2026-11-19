import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

async function verify() {
  const res = await fetch('https://sdk.dramasdk.com/api/home?lang=pt&pageSize=20', {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  const data = await res.json();
  const cats = data.data?.categories || [];
  let checked = 0;

  for (const c of cats) {
    for (const s of c.stories || []) {
      if (checked >= 6) break;
      const sourceId = s.source_story_id || (s.story_id.includes(':') ? s.story_id.split(':')[1] : s.story_id);
      try {
        const sRes = await fetch(`https://sdk.dramasdk.com/api/stream?bookId=${encodeURIComponent(sourceId)}&episode=1&provider=${s.provider}`, {
          headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          const ep = sData.data?.categories?.[0]?.stories?.[0]?.episodes?.[0];
          console.log(`[${s.provider}] ID: ${sourceId} | Titulo: ${s.title}`);
          console.log(`  -> Video URL: ${ep?.video_url ? ep.video_url.slice(0, 90) + '...' : 'NONE'} (type: ${ep?.video_type})`);
        } else {
          console.log(`[${s.provider}] HTTP Error: ${sRes.status}`);
        }
      } catch (err) {
        console.log(`[${s.provider}] Err: ${err.message}`);
      }
      checked++;
    }
  }
}
verify();
