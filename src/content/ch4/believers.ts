/**
 * 第四章的信徒（_agent/ch4-baishatun-plan.md §7「信徒五位」）：阿滿姨、阿睿（跟轎台義工；第一章已有阿哲，代號改 arui）、
 * 賢仔、秀枝、阿翰。序章黃曆、擲筊、因果簿、信徒錄。
 *
 * 【第 1 階段】只有骨架：卡片文字全部是【待定】暫代，下一輪由 _agent/ch4-text-day1.md 換掉
 *（Card.text／ignore、Option.label／result／apply 的回傳字、report.stop／pass、PROLOGUE4、PROLOGUE_JIAO4、ledger4、epitaphs4）。
 * 選項的花費（時辰、稟報、點心站）是規則，換字時不要動。
 */
import type { RunState } from '../../state';
import { gainEvidence } from '../../state';
import type { Almanac, Card, Epitaph, LedgerLine } from '../believers';

export function newBelievers4(): Record<string, string> {
  return { aman: 'unmet', arui: 'unmet', xianzai: 'unmet', xiuzhi: 'unmet', ahan: 'unmet' };
}

export const PROLOGUE4: Almanac = {
  lunar: '【待定】', yi: '祭祀　出行', ji: '【待定】',
  source: '白砂墩拱辰宮',
  text: '【待定】序章黃曆：擲筊擇日、放頭旗。',
};

export const PROLOGUE_JIAO4 = {
  ask: '【待定】進香的日子',
  times: 3,
  holy: { text: '【待定】聖杯' },
  laugh: { text: '【待定】笑杯' },
  yin: { text: '【待定】陰杯' },
  allHoly: { text: '【待定】三聖筊' },
  done: '【待定】放頭旗。',
};

const done = (r: RunState, id: string, s: string) => { r.b[id] = s; };

export const CARDS4: Record<string, (r: RunState) => Card | null> = {
  /** 阿滿姨：第一天甲路（她的老路）。稟報示範：轎子停不停由內容決定 */
  aman1: (r) => r.b.aman === 'unmet' ? {
    who: '阿滿姨',
    text: '【待定】阿滿姨的膝蓋不行了，還是一步一步跟。',
    options: [
      { label: '扶她一段', hours: 1, result: '【待定】她跟得上隊伍', apply: (s) => { done(s, 'aman', 'helped'); return '【待定】'; } },
      {
        label: '稟報', hours: 0, result: '【待定】把她的事報到轎前',
        report: {
          key: 'aman1',
          // 內容決定：第一天她走的是自己的老路，轎子會在她面前頓一下（之後依劇本換）
          stops: () => true,
          stop: '【待定】轎子在阿滿姨面前頓了一下。',
          pass: '【待定】轎子沒有停。',
        },
        apply: (s) => { done(s, 'aman', 'reported'); return ''; },
      },
    ],
    ignore: '【待定】她會落到隊尾',
  } : null,
  /** 賢仔：臨時轉進的車行 */
  xianzai1: (r) => r.b.xianzai === 'unmet' ? {
    who: '賢仔',
    text: '【待定】「欸欸欸，裡面還有車沒修好啦——」',
    options: [
      { label: '問他這塊地', hours: 1, gives: ['xian_land'], result: '【待定】得到證詞', apply: (s) => { done(s, 'xianzai', 'told'); gainEvidence('xian_land'); return '【待定】'; } },
    ],
    ignore: '【待定】',
  } : null,
  /** 阿睿：跟轎台的義工（停駕點） */
  arui1: (r) => r.b.arui === 'unmet' ? {
    who: '阿睿',
    text: '【待定】阿睿舉著手機在直播，一直在看觀看人數。',
    options: [
      { label: '幫他找角度', hours: 1, result: '【待定】', apply: (s) => { done(s, 'arui', 'met'); return '【待定】'; } },
      { label: '託點心站顧手機', hours: 0, stall: '海線點心站', result: '【待定】點心站的阿姨幫他顧著', apply: (s) => { done(s, 'arui', 'met'); return '【待定】'; } },
    ],
    ignore: '【待定】',
  } : null,
  /** 秀枝：隊尾推輪椅（第一天會合後） */
  xiuzhi1: (r) => r.b.xiuzhi === 'unmet' ? {
    who: '秀枝',
    text: '【待定】秀枝推著阿母的輪椅跟在隊尾，不敢往前擠。',
    options: [
      { label: '陪她走一段', hours: 1, result: '【待定】', apply: (s) => { done(s, 'xiuzhi', 'met'); return '【待定】'; } },
    ],
    ignore: '【待定】',
  } : null,
  // ---------- 第二天傳消息的事件池（暫代；之後換成正式卡） ----------
  shoes2: () => ({ who: '【待定】鞋子壞掉的年輕人', text: '【待定】', options: [{ label: '幫忙', hours: 1, result: '【待定】', apply: () => '【待定】' }], ignore: '【待定】' }),
  heat2: () => ({ who: '【待定】中暑的年輕人', text: '【待定】', options: [{ label: '幫忙', hours: 1, result: '【待定】', apply: () => '【待定】' }], ignore: '【待定】' }),
  sick2a: () => ({ who: '【待定】帶病人來的家屬', text: '【待定】', options: [{ label: '幫忙', hours: 2, result: '【待定】', apply: () => '【待定】' }], ignore: '【待定】' }),
  sick2b: () => ({ who: '【待定】帶病人來的家屬', text: '【待定】', options: [{ label: '幫忙', hours: 2, result: '【待定】', apply: () => '【待定】' }], ignore: '【待定】' }),
  ahan2: (r) => r.b.ahan === 'unmet' ? { who: '阿翰', text: '【待定】', options: [{ label: '陪他走', hours: 1, result: '【待定】', apply: (s) => { done(s, 'ahan', 'met'); return '【待定】'; } }], ignore: '【待定】' } : null,
};

export function ledger4(r: RunState): LedgerLine[] {
  const who: [string, string][] = [['阿滿姨', 'aman'], ['阿睿', 'arui'], ['賢仔', 'xianzai'], ['秀枝', 'xiuzhi'], ['阿翰', 'ahan']];
  const lines = who.map(([name, id]): LedgerLine => ({ who: name, state: r.b[id] === 'unmet' ? '【待定】還沒遇到' : '【待定】', tone: r.b[id] === 'unmet' ? 'none' : 'good' }));
  const f = r.follow;
  if (f?.strayed) lines.push({ who: '沒跟上', state: `被牽路仔帶偏的有 ${f.strayed} 位【待定】`, tone: 'bad' });
  return lines;
}

export function bossEffects4(r: RunState): string[] {
  return [`【待定】人鏈 ${r.follow?.chain ?? 0} 段（最後一戰「渾水溪」還沒做）`];
}

export function epitaphs4(_r: RunState): Epitaph[] {
  return ['阿滿姨', '阿睿', '賢仔', '秀枝', '阿翰'].map((who) => ({ who, text: '【待定】', good: true }));
}

export function ghostEpitaphs4(_r: RunState): Epitaph[] {
  return ['草鞋丁', '點心擔阿婆', '沒走成的新娘', '假香燈腳'].map((who) => ({ who, text: '【待定】', good: true }));
}

export function mangduEpitaph(r: RunState): Epitaph {
  return { who: '茫渡', text: '【待定】', good: r.shijuEnd !== 'slay' };
}
