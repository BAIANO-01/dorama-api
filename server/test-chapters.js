import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DRAMASDK_TOKEN || 'mdr_live_lfNVEhpfmU8JfnjvP6FlyNNOUQY_aAPR';
const pkg = process.env.DRAMASDK_PACKAGE_ID || 'com.igaradrama.app';

async function testAll() {
  const storyId = '1794994743';
  // Test direct provider endpoint
  const r1 = await fetch(`https://sdk.dramasdk.com/api/provider/flickreels/chapters/${storyId}`, {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  console.log('direct chapters status:', r1.status);

  // Test reelshort chapters
  const rsId = '6ae98186ab6d52647b092d5e';
  const r2 = await fetch(`https://sdk.dramasdk.com/api/chapters/${rsId}?provider=reelshort`, {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  console.log('reelshort chapters status:', r2.status);
  if (r2.ok) {
    const d2 = await r2.json();
    console.log('reelshort story episodes count:', d2.data?.categories?.[0]?.stories?.[0]?.episodes?.length);
  }

  // Test stream for ep 1 and ep 2 of flickreels
  const s1 = await fetch(`https://sdk.dramasdk.com/api/stream?bookId=${storyId}&episode=1&provider=flickreels`, {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  console.log('flickreels ep 1 stream status:', s1.status);
  const s2 = await fetch(`https://sdk.dramasdk.com/api/stream?bookId=${storyId}&episode=2&provider=flickreels`, {
    headers: { 'X-App-Package-ID': pkg, 'X-App-Secure-Token': token }
  });
  console.log('flickreels ep 2 stream status:', s2.status);
  if (s2.ok) {
    const d = await s2.json();
    const ep2 = d.data?.categories?.[0]?.stories?.[0]?.episodes?.[0];
    console.log('flickreels ep 2 url:', ep2?.video_url);
  }
}
testAll();
