import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

async function testSearchPt() {
  const terms = ['dublado', 'amor', 'casamento', 'vingança', 'bilionário', 'esposa', 'chefe', 'mãe', 'rei', 'secreto'];
  for (const term of terms) {
    try {
      const res = await fetch(`https://sdk.dramasdk.com/api/search?keyword=${encodeURIComponent(term)}&lang=pt`, {
        headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
      });
      if (res.ok) {
        const d = await res.json();
        const stories = [];
        for (const c of d.data?.categories || []) {
          for (const s of c.stories || []) stories.push(s);
        }
        console.log(`Search "${term}": found ${stories.length}`);
        if (stories.length > 0) {
          console.log(`  -> sample: ${stories[0].title} (${stories[0].provider})`);
        }
      } else {
        console.log(`Search "${term}": HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`Search "${term}" error:`, e.message);
    }
  }
}
testSearchPt();
