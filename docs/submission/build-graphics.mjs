import fs from 'node:fs';
import { createRequire } from 'node:module';
const webRequire = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const nextRequire = createRequire(webRequire.resolve('next/package.json'));
const sharp = nextRequire('sharp');
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const ink='#182320', mute='#5f7169', green='#236850', line='#d6e0d9';
const text=(x,y,s,size=26,color=ink,weight=400)=>`<text x="${x}" y="${y}" font-family="Helvetica Neue,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${s.replaceAll('&','&amp;')}</text>`;
const rect=(x,y,w,h,fill,rx=0,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const rule=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${line}" stroke-width="2"/>`;
const arrow=(x1,y,x2)=>`<path d="M${x1} ${y} H${x2} m-10 -7 10 7 -10 7" fill="none" stroke="${green}" stroke-width="3"/>`;
const base=(h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="${h}" viewBox="0 0 1440 ${h}">${rect(0,0,1440,h,'#f7f9f5')}${body}</svg>`;
const header=(n,label)=>text(68,69,'fanpot',34,ink,700)+text(1140,67,`${n} / ${label}`,17,mute,500);
const overview=base(960,
 header('01','THE PRODUCT')+
 text(68,164,'Fan love. Clear money rules.',62,ink,600)+
 text(70,216,'K-pop campaign funding with USDC escrow on Arc.',29,mute)+
 rule(68,258,1372,258)+
 text(70,311,'BIRTHDAY ADS  /  FAN GOODS  /  COMMUNITY EVENTS',19,green,600)+
 text(70,393,'Fans',35,ink,600)+text(70,435,'Contribute USDC',24,mute)+
 arrow(267,410,347)+
 rect(376,346,385,225,'#e7efe7',16)+
 text(406,393,'Campaign escrow',35,ink,600)+
 text(407,438,'Recipients + payout caps',25,green,500)+
 text(407,477,'Fixed before funding begins',23,mute)+
 text(407,536,'No organizer withdrawal switch',21,mute)+
 arrow(789,410,864)+
 text(896,393,'Recipient',35,ink,600)+
 text(896,436,'Paid within the fixed cap',24,mute)+
 text(896,486,'After reviewer approval',25,green,600)+
 text(896,523,'of amount + evidence hash',23,mute)+
 `<path d="M568 571 V624 H168 V487 m-7 10 7 -10 7 10" fill="none" stroke="${green}" stroke-width="2"/>`+
 text(286,662,'Eligible refunds return to supporters',25,green,500)+
 text(286,698,'Claimable when funding fails or funds remain after settlement.',21,mute)+
 rect(68,757,1304,121,ink,14)+
 text(99,801,'WHY ARC',18,'#a7c5b4',600)+
 text(99,845,'USDC for contributions, payouts, refunds — and gas.',33,'#ffffff',500)+
 text(70,922,'Contract rules govern money movement; offchain delivery still requires a trusted review.',19,mute)
);
const market=base(1050,
 header('02','THE OPPORTUNITY')+
 text(68,164,'Fandom already crosses borders.',58,ink,600)+
 text(70,215,'Start with a recurring ritual: the fan-funded birthday ad.',28,mute)+
 rule(68,258,1372,258)+
 text(70,367,'225M',78,ink,600)+text(70,411,'Reported Hallyu fans',25,ink,500)+
 text(70,452,'2023 · broader Korean culture',21,mute)+text(70,487,'Korea Foundation / Korea.net [1]',19,mute)+
 rule(494,310,494,507)+
 text(544,367,'~$120M',73,ink,600)+text(544,411,'Korean CD exports',25,ink,500)+
 text(544,452,'Q1 2026 · physical albums',21,mute)+text(544,487,'Korea Customs Service [2]',19,mute)+
 rule(961,310,961,507)+
 text(1010,367,'131',78,ink,600)+text(1010,411,'Export destinations',25,ink,500)+
 text(1010,452,'Q1 2026 · Korean CDs',21,mute)+text(1010,487,'Korea Customs Service [2]',19,mute)+
 text(70,555,'Audience and spending signals; these figures are not a fan-ad market-size estimate.',21,mute)+
 rule(68,596,1372,596)+
 text(70,648,'WHERE FANPOT FITS',19,green,600)+
 text(70,707,'FanPlus',28,ink,600)+text(388,707,'Fan voting → advertising rewards [3]',27,mute)+
 rule(68,737,1372,737)+
 text(70,786,'MAKESTAR',28,ink,600)+text(388,786,'Reward crowdfunding → platform funding & refunds [4]',25,mute)+
 rect(68,818,1304,113,'#e7efe7',12)+
 text(95,863,'FanPot',30,green,600)+text(389,863,'Fan-organized funding → contract-enforced spending rules',25,green,500)+
 text(389,902,'Fixed recipient · capped payout · reviewer approval · onchain receipts',20,mute)+
 text(70,984,'Sources [1–4] are linked in the accompanying description. Comparison covers the stated workflows.',18,mute)+
 text(70,1015,'FanPot is an early Mainnet proof. Existing services also provide their own safeguards and refund policies.',18,mute)
);
for (const [name,svg] of [['fanpot-overview',overview],['fanpot-market',market]]) {
 fs.writeFileSync(`${dir}${name}.svg`,svg);
 await sharp(Buffer.from(svg)).png().toFile(`${dir}${name}.png`);
}
console.log('Built two submission graphics.');
