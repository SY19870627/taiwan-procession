/**
 * 第二章「東津・迎王」：白天沿路遇到的人（五位信徒）、因果簿、最後一戰的狀況、信徒錄。
 * 原則同第一章：每個選項都事先寫清楚花費、結果、不處理的後果與期限。
 */
import type { RunState } from '../../state';
import { gainEvidence } from '../../state';
import type { Almanac, Card, Epitaph, LedgerLine } from '../believers';

// ---------- 信徒的狀態 ----------
export interface Believers2 {
  /** 魚市場的蔡嫂：丈夫三年前出海沒回來 */
  caisao: 'grieving' | 'talked' | 'invited';
  /** 造王船的洪師傅：龍骨一直裂 */
  hong: 'cracked' | 'broken' | 'fixed';
  /** 轎班青年阿城：過火扭傷了腳 */
  acheng: 'hurt' | 'kept' | 'quit' | 'proud';
  /** 阿城的阿嬤：巷子裡的熱病 */
  ama: 'sick' | 'eased' | 'cured' | 'regret';
  /** 雜貨店的阿娟：會說幾句船員家鄉的話 */
  ajuan: 'unmet' | 'met' | 'trusted';
}

export function newBelievers2(): Believers2 {
  return { caisao: 'grieving', hong: 'cracked', acheng: 'hurt', ama: 'sick', ajuan: 'unmet' };
}

const give = (...ids: string[]) => { for (const id of ids) gainEvidence(id); };

// ---------- 序章 ----------
export const PROLOGUE2: Almanac = {
  lunar: '九月十四',
  yi: '祭祀　造船',
  ji: '出海',
  source: '東津東盛宮誌・卷一',
  text: '東津濱海，居民以討海為業。每三年一科，迎代天巡狩千歲，駐駕東盛宮，宮改稱代天府。雲府千歲為之開路，千歲調閱案卷，察境內陰陽冤滯。科末造船，載瘟送王出海。\n是科王船龍骨，三度自裂。',
};

export const PROLOGUE_JIAO2 = {
  ask: '今科迎王是否照常？',
  times: 3,
  holy: { text: '千歲爺應允。' },
  laugh: { text: '千歲爺在笑我們多問。' },
  yin: { text: '千歲爺要大家更小心。' },
  allHoly: { text: '連得三個聖杯！七境頭的轎班一起喊了起來。' },
  done: '不管結果如何，迎王照常。黃總理：「千歲爺都聽到了。明天請王。」',
};

// ---------- 信徒卡 ----------
export const CARDS2: Record<string, (r: RunState) => Card | null> = {
  caisaoMarket: (r) => r.b.caisao !== 'grieving' ? null : {
    who: '蔡嫂',
    text: '魚市場殺魚的婦人。三年前的颱風夜，她丈夫跟著船出海，再也沒回來。她每天收攤都多擺一副碗筷。',
    options: [
      {
        label: '停轎聽她說', hours: 1, gives: ['caisao_net'],
        result: '她把那天的事說出來了',
        apply: (s) => { s.b.caisao = 'talked'; give('caisao_net'); return '蔡嫂放下刀：「那天颱風要來了。船長說：『最後一網就回來。』我老公就跟著去了。」'; },
      },
      {
        label: '陪她收攤', hours: 2, gives: ['caisao_net', 'caisao_rice'],
        result: '她把那天的事說出來了；也說了以前港口的阿婆',
        apply: (s) => { s.b.caisao = 'talked'; give('caisao_net', 'caisao_rice'); return '「船長說『最後一網就回來』……」蔡嫂擦著砧板，「以前港口有個阿婆，每次船回來都煮一大鍋鹹粥。我老公最愛吃。」'; },
      },
    ],
    ignore: '第三天還能在堤防遇到她（要多花時間）',
  },
  hongYard: (r) => r.b.hong !== 'cracked' ? null : {
    who: '洪師傅',
    text: '造王船的老師傅。「龍骨裂了三次了。米包也是，每天晚上少一包。有東西不想讓這艘船造好。」',
    deadline: '明日',
    options: [
      {
        label: '祭解龍骨', hours: 2,
        result: '龍骨不再裂：最後一戰王船船身完整',
        apply: (s) => { s.b.hong = 'fixed'; return '中軍府的令牌在龍骨上一按，裂縫慢慢合了起來。洪師傅摸著木頭，說不出話。'; },
      },
      {
        label: '顯現神蹟', hours: 1, miracle: true,
        result: '龍骨當場合起來，洪師傅逢人就說',
        apply: (s) => { s.b.hong = 'fixed'; return '一道金光落在王船上。洪師傅跪了下來：「千歲爺有聽到。」'; },
      },
    ],
    ignore: '今晚龍骨會再裂：最後一戰王船船身少三成（第三天還有一次機會）',
  },
  achengFire: (r) => r.b.acheng !== 'hurt' ? null : {
    who: '阿城',
    text: '七境頭的轎班青年。過火的時候踩歪了，腳踝腫得像饅頭。「我不扛了啦，丟臉死了。」',
    deadline: '明日',
    options: [
      {
        label: '請中軍府替他收驚推拿', hours: 1,
        result: '他留在轎班裡（第三天遷船可以扛前槓）',
        apply: (s) => { s.b.acheng = 'kept'; return '中軍府的轎班大哥拍拍他的肩：「我第一次過火也跌倒。」阿城把轎衫重新綁好。'; },
      },
    ],
    ignore: '他會退出轎班',
  },
  achengHome: (r) => (r.b.ama !== 'sick') ? null : {
    who: '阿城的阿嬤',
    text: '七境頭巷子裡，阿城的阿嬤燒了兩天。「門口有一個戴斗笠的人一直站著。」左右鄰居也都在發燒。',
    deadline: '今晚',
    options: [
      {
        label: '收驚', hours: 1,
        result: '阿嬤暫時好一點。要根治，得審巷子裡的那個影子',
        apply: (s) => { s.b.ama = 'eased'; return '中軍府的令旗在床頭一揮。阿嬤喘了一口氣：「那個人，往巷子裡面去了。」'; },
      },
      {
        label: '顯現神蹟', hours: 2, miracle: true,
        result: '阿嬤當場退燒',
        apply: (s) => { s.b.ama = 'cured'; return '金光一閃，阿嬤坐了起來：「阿城，我肚子餓。」'; },
      },
    ],
    ignore: '今晚沒審巷子裡的影子的話：阿嬤要住院',
  },
  ajuanShop: (r) => r.b.ajuan !== 'unmet' ? null : {
    who: '阿娟',
    text: '船員宿舍旁開雜貨店的婦人，會說幾句船員家鄉的話。「宿舍的燈每天晚上都在閃，大家都不敢睡。舍監說要把那個年輕人的東西丟掉。」',
    options: [
      {
        label: '請她說說那個年輕人', hours: 1, gives: ['ajuan_word'],
        result: '她說了那個年輕人的事；之後也願意替他傳話',
        apply: (s) => { s.b.ajuan = 'met'; give('ajuan_word'); return '「燈一閃，就是他。他每天晚上都把那封信拿出來，好像在等人看一眼。」阿娟嘆了一口氣。'; },
      },
      {
        label: '顯現神蹟讓她看見', hours: 2, miracle: true, gives: ['ajuan_word'],
        result: '她親眼看到那個年輕人；願意替他把信寫完',
        apply: (s) => { s.b.ajuan = 'trusted'; give('ajuan_word'); return '阿娟看見了冰櫃上的年輕人。她用他家鄉的話輕輕問了一句，他抬起頭來，第一次笑了。'; },
      },
    ],
    ignore: '第三天還有一次機會在市街遇到她',
  },
  caisaoDay3: (r) => {
    if (r.b.caisao === 'talked') {
      return {
        who: '蔡嫂', text: '蔡嫂站在堤防上，看著王船經過。「今晚送王，我可以去嗎？」',
        options: [{ label: '邀她今晚到沙灘', hours: 1, result: '最後一戰：陣前審問最後一輪，她可以喊丈夫的名字', apply: (s) => { s.b.caisao = 'invited'; return '蔡嫂把圍裙摘下來，摺得整整齊齊：「我去。我要跟他說，可以回來了。」'; } }],
        ignore: '她會在家裡等',
      };
    }
    if (r.b.caisao === 'grieving') {
      return {
        who: '蔡嫂', text: '堤防邊，蔡嫂一個人坐在消波塊上。今天魚市場沒開。',
        options: [{
          label: '聽她說，邀她送王', hours: 3, gives: ['caisao_net', 'caisao_rice'],
          result: '她把那天的事說出來；今晚會到沙灘',
          apply: (s) => { s.b.caisao = 'invited'; give('caisao_net', 'caisao_rice'); return '「船長說『最後一網就回來』……以前港口的阿婆還會煮鹹粥等他們。」蔡嫂站起來：「今晚，我去送。」'; },
        }],
        ignore: '遺憾：她一個人在堤防上坐到天黑',
      };
    }
    return null;
  },
  achengDay3: (r) => r.b.acheng !== 'kept' ? null : {
    who: '阿城', text: '王船上岸，陸上行舟。前槓少一個人。阿城看著自己的腳：「我可以嗎？」',
    options: [{ label: '讓他扛前槓', hours: 1, result: '七境頭轎班今晚助陣', apply: (s) => { s.b.acheng = 'proud'; return '阿城扛起前槓，喊了一聲。整條街的轎班跟著喊了起來。'; } }],
    ignore: '他還是在轎班裡，只是今晚不上場',
  },
  hongDay3: (r) => r.b.hong !== 'broken' ? null : {
    who: '洪師傅', text: '王船推上街了，龍骨的裂縫用鐵片夾著。洪師傅跟在旁邊一直摸。「撐得到沙灘就好……」',
    deadline: '今天',
    options: [{ label: '顯現神蹟', hours: 2, miracle: true, result: '龍骨合起來：最後一戰王船船身完整', apply: (s) => { s.b.hong = 'fixed'; return '金光沿著龍骨走了一遍。洪師傅把鐵片一片一片拆下來，眼眶紅了。'; } }],
    ignore: '最後一戰王船船身少三成',
  },
  ajuan3: (r) => r.b.ajuan !== 'unmet' ? null : {
    who: '阿娟',
    text: '雜貨店門口，阿娟在收宿舍丟出來的紙箱。「那個年輕人的東西，舍監說今天就要丟了。」',
    options: [{ label: '請她說說那個年輕人', hours: 1, gives: ['ajuan_word'], result: '她說了那個年輕人的事；願意替他傳話', apply: (s) => { s.b.ajuan = 'met'; give('ajuan_word'); return '阿娟把一個紙箱抱回店裡：「燈一閃，就是他。他一直把信拿出來，好像在等人看一眼。」'; } }],
    ignore: '那個年輕人的東西會被丟掉',
  },
  huang3: (r) => r.allied ? null : {
    who: '黃總理',
    text: '大鵬澳的沙灘上，金紙已經堆得比人還高。黃總理說：「小琉嶼的船隊說，今晚要從海上護航。」',
    options: [{ label: '請他們護航', hours: 1, result: '小琉嶼護航船今晚助陣（交陪）', apply: (s) => { s.allied = true; return '海上亮起一排漁火。小琉嶼的船隊，今晚會守在王船的外海。'; } }],
    ignore: '今晚沒有船隊護航',
  },
};

// ---------- 因果簿 ----------
export function ledger2(r: RunState): LedgerLine[] {
  const b = r.b as unknown as Believers2;
  const caisao: Record<Believers2['caisao'], LedgerLine> = {
    grieving: { who: '蔡嫂', state: '每天多擺一副碗筷（第一天魚市場、第三天堤防）', tone: 'warn' },
    talked: { who: '蔡嫂', state: '說出了那天的事（第三天可以邀她送王）', tone: 'good' },
    invited: { who: '蔡嫂', state: '今晚會到沙灘送王', tone: 'good' },
  };
  const hong: Record<Believers2['hong'], LedgerLine> = {
    cracked: { who: '洪師傅', state: '王船龍骨一直裂（今晚前要處理）', tone: 'warn' },
    broken: { who: '洪師傅', state: '龍骨又裂了（第三天還能顯現神蹟）', tone: 'bad' },
    fixed: { who: '洪師傅', state: '龍骨補好了', tone: 'good' },
  };
  const acheng: Record<Believers2['acheng'], LedgerLine> = {
    hurt: { who: '阿城', state: '過火扭傷了腳，想退出轎班（今晚前）', tone: 'warn' },
    kept: { who: '阿城', state: '留在轎班裡（第三天可以扛前槓）', tone: 'good' },
    quit: { who: '阿城', state: '退出轎班了', tone: 'bad' },
    proud: { who: '阿城', state: '扛王船的前槓，今晚助陣', tone: 'good' },
  };
  const ama: Record<Believers2['ama'], LedgerLine> = {
    sick: { who: '阿嬤', state: '阿城的阿嬤在發燒（第二天要去看；根源在巷子裡的影子）', tone: 'warn' },
    eased: { who: '阿嬤', state: '暫時好一點（要審巷子裡的影子）', tone: 'warn' },
    cured: { who: '阿嬤', state: '退燒了', tone: 'good' },
    regret: { who: '阿嬤', state: '燒到住院', tone: 'bad' },
  };
  const ajuan: Record<Believers2['ajuan'], LedgerLine> = {
    unmet: { who: '阿娟', state: '還沒見過（第二天雜貨店、第三天市街）', tone: 'warn' },
    met: { who: '阿娟', state: '願意替宿舍那個年輕人傳話', tone: 'good' },
    trusted: { who: '阿娟', state: '親眼看見了那個年輕人', tone: 'good' },
  };
  return [caisao[b.caisao], hong[b.hong], acheng[b.acheng], ama[b.ama], ajuan[b.ajuan]];
}

/** 上了王船的鬼 */
export function shipped(r: RunState): string[] {
  return ['haibo', 'adi', 'mipo', 'yigui'].filter((g) => r.cases[g]?.verdict === 'ship');
}

/** 最後一戰的狀況（白天累積的結果） */
export function bossEffects2(r: RunState): string[] {
  const out: string[] = [];
  if (r.bossAdds) out.push(`小妖多 ${r.bossAdds} 波（神蹟外洩、沒押上船的小妖）`);
  out.push(r.b.hong === 'fixed' ? '王船龍骨補好了：船身完整' : '王船龍骨帶傷：船身少三成');
  const n = shipped(r).length;
  if (n) out.push(`上了王船的鬼 ${n} 個：王船重了，走得慢一些`);
  if (r.flags.yigui_loose) out.push('疫鬼沒補正案卷就上了船：送王那晚會跳船（小妖多 2 波）');
  if (r.flags.recruit_haibo) out.push('海伯留府當差：陣前審問最後一輪，他會喊船員的名字');
  if (r.b.caisao === 'invited') out.push('蔡嫂在沙灘上：陣前審問最後一輪，她會喊丈夫的名字');
  if (r.b.acheng === 'proud') out.push('七境頭轎班（阿城）助陣');
  if (r.allied) out.push('小琉嶼護航船助陣（交陪）');
  return out;
}

// ---------- 信徒錄（結局） ----------
export function epitaphs2(r: RunState): Epitaph[] {
  const b = r.b as unknown as Believers2;
  const sent = r.shijuEnd === 'recall';
  return [
    b.caisao === 'invited'
      ? { who: '蔡嫂', good: true, text: sent ? '她在沙灘上喊了丈夫的名字。海面上，好像有人回頭揮了揮手。' : '她在沙灘上站到天亮。王船燒完的時候，她把那副碗筷收起來了。' }
      : b.caisao === 'talked'
        ? { who: '蔡嫂', good: true, text: '她把那天的事說出來了。後來收攤，她只擺一副碗筷。' }
        : { who: '蔡嫂', good: false, text: '魚市場收攤的時候，她還是多擺一副碗筷。' },
    b.hong === 'fixed'
      ? { who: '洪師傅', good: true, text: '王船出海那晚，他說：「這是我造過最穩的一艘。」' }
      : { who: '洪師傅', good: false, text: '龍骨的裂痕到最後都沒補好。他說，下一科還要再造一次。' },
    b.acheng === 'proud'
      ? { who: '阿城', good: true, text: '他扛著王船的前槓走到沙灘。阿嬤說，他爸爸當年也扛過。' }
      : b.acheng === 'kept'
        ? { who: '阿城', good: true, text: '他留在轎班裡。下一科，他說要扛前槓。' }
        : { who: '阿城', good: false, text: '他把轎衫還回去了。送王那晚，他一個人站在堤防上看。' },
    b.ama === 'cured'
      ? { who: '阿嬤', good: true, text: '燒退了。她一早就坐在門口剝蝦，跟每個路過的人說千歲爺的事。' }
      : { who: '阿嬤', good: false, text: '她住院一週。出院以後，那條巷子她不讓阿城晚上走。' },
    r.cases.adi?.verdict === 'release'
      ? { who: '阿娟', good: true, text: '她替阿迪寫的信寄到了。兩個月後，她收到一封回信，裡面夾著一張全家福。' }
      : b.ajuan !== 'unmet'
        ? { who: '阿娟', good: true, text: '她常常跟宿舍的船員聊天。她說，在這裡，總要有人聽他們說話。' }
        : { who: '阿娟', good: false, text: '宿舍的燈閃了很久。後來舍監把那個年輕人的東西丟掉了。' },
  ];
}

/** 四個鬼的結局（依判決）。上王船的標「隨船」 */
export function ghostEpitaphs2(r: RunState): Epitaph[] {
  const v = (id: string) => r.cases[id]?.verdict;
  const sent = r.shijuEnd === 'recall';
  const ship = (who: string, text: string): Epitaph => ({ who, good: false, text, tag: '隨船' });
  const haibo: Record<string, Epitaph> = {
    recruit: { who: '海伯', good: true, text: sent ? '他在沙灘上一個一個喊船員的名字。五個人，一個都沒有少。' : '他留在代天府當差。每逢颱風夜，他還是會走到港口看看。' },
    release: { who: '海伯', good: true, text: '他放下了那截斷舵。舵現在供在東盛宮，上面刻著「金順發」。' },
    ship: ship('海伯', '他抱著斷舵上了王船。他終究還是回到了海上。'),
    slay: { who: '海伯', good: false, text: '他散了。那截斷舵，被浪捲走了。' },
  };
  const adi: Record<string, Epitaph> = {
    release: { who: '阿迪', good: true, text: '信寄到了。他的家人終於知道，他從來沒有不要她們。' },
    recruit: { who: '阿迪', good: true, text: '他留在代天府當差。宿舍的燈不再閃了，只是偶爾有人說，看到一個年輕人在幫忙搬冰。' },
    ship: ship('阿迪', '他往家的方向出海了。那封信，還是沒有寄出去。'),
    slay: { who: '阿迪', good: false, text: '宿舍的燈不閃了。那封信，沒有人知道要寄給誰。' },
  };
  const mipo: Record<string, Epitaph> = {
    release: { who: '米婆', good: true, text: '添載簿上又有了她的名字。下一科，黃總理替她添了一斗米。' },
    recruit: { who: '米婆', good: true, text: '她留在代天府煮飯。迎王那幾天，廟裡的鹹粥特別好吃。' },
    ship: ship('米婆', '她扛著米包上了王船。她說，要去給那些人煮一鍋熱的。'),
    slay: { who: '米婆', good: false, text: '她散了。繫船柱下，再也沒有那碗米。' },
  };
  const yigui: Record<string, Epitaph> = {
    ship: r.flags.yigui_loose
      ? { who: '疫鬼', good: false, text: '送王那晚，牠跳下王船，溜上了海昌號。下一個港口，又有人發燒了。' }
      : { who: '疫鬼', good: true, text: '牠跟著王船出海，一起燒掉了。這正是送王的本意。' },
    slay: { who: '疫鬼', good: true, text: '牠散了。七境頭的熱病退了。' },
    recruit: { who: '疫鬼', good: true, text: '牠成了代天府的瘟差。每一科迎王，牠都走在最前面替千歲爺開路。' },
  };
  const none = (who: string, text: string): Epitaph => ({ who, good: false, text });
  return [
    haibo[v('haibo') ?? ''] ?? none('抓著斷舵的老人', '他還抓著那截斷舵，站在港口的繫船柱旁。'),
    adi[v('adi') ?? ''] ?? none('坐在冰櫃上的年輕人', '他還坐在冰櫃上，捏著那封信。'),
    mipo[v('mipo') ?? ''] ?? none('偷米包的老婦人', '王船廠的米包，每晚還是少一包。'),
    yigui[v('yigui') ?? ''] ?? none('戴斗笠的影子', '巷子裡還有人在發燒。'),
  ];
}

export function tideEpitaph(r: RunState): Epitaph {
  if (r.shijuEnd === 'recall') return { who: '黑潮', good: true, text: '黑潮跟著王船出海了。那一科之後，東津的颱風夜，港口的繫船柱旁再也沒有人在等。' };
  if (r.shijuEnd === 'slay') return { who: '黑潮', good: false, text: '黑潮散成一片浪花。五個人的名字，再也沒有人喊得出來。' };
  return { who: '黑潮', good: false, text: '牠退回了海裡。颱風夜的港口，偶爾還聽得到有人在喊。' };
}
