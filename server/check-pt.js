import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

async function checkPt() {
  // Check providers list first
  const provRes = await fetch('https://sdk.dramasdk.com/api/providers', {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  console.log('Providers status:', provRes.status);
  const provData = await provRes.json();
  console.log('Providers list:', JSON.stringify(provData, null, 2));

  // Check home with lang=pt
  const r = await fetch('https://sdk.dramasdk.com/api/home?lang=pt&pageSize=200', {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  const data = await r.json();
  const cats = data.data?.categories || [];
  const stories = [];
  for (const c of cats) {
    for (const s of c.stories || []) {
      stories.push({
        id: s.story_id,
        title: s.title,
        lang: s.language,
        provider: s.provider
      });
    }
  }
  console.log('Total stories:', stories.length);
  const pt = stories.filter(s => s.lang === 'pt' || /([ãõáéíóúç]|\b(o|a|os|as|um|uma|de|do|da|em|com|para|por|que|não|meu|minha|seu|sua)\b)/i.test(s.title));
  console.log('Portuguese titles count:', pt.length);
  console.log('Sample Portuguese titles:');
  console.log(pt.slice(0, 10));
}
checkPt();
