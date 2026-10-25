/**
 * 過場劇情。妖怪視角為主（小妖詼諧、石駒悲涼），神明只以「旨意」出現，不畫神明的臉。
 * 遊戲中一律使用虛構名稱（見設計文件 14.5 命名原則）。
 */

export type SpeakerId = 'narrator' | 'wang' | 'mei' | 'kui' | 'shiju' | 'shijuCalm' | 'god' | 'kaijiang' | 'judge' | 'baoma';

export const SPEAKERS: Record<Exclude<SpeakerId, 'narrator'>, { name: string; tex: string; side: 'left' | 'right'; scale: number }> = {
  wang: { name: '阿魍', tex: 'wang', side: 'left', scale: 2.4 },
  mei: { name: '阿魅', tex: 'mei', side: 'right', scale: 2.2 },
  kui: { name: '石屑傀', tex: 'kui', side: 'right', scale: 2.0 },
  shiju: { name: '石駒', tex: 'shiju', side: 'right', scale: 1.3 },
  shijuCalm: { name: '石駒', tex: 'shiju_calm', side: 'right', scale: 1.3 },
  god: { name: '青嶺王（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  kaijiang: { name: '開疆聖王（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  judge: { name: '文判官', tex: 'judge', side: 'left', scale: 1.7 },
  baoma: { name: '報馬仔', tex: 'baoma', side: 'left', scale: 1.8 },
};

export interface Line {
  who: SpeakerId;
  text: string;
  /** 演出效果 */
  fx?: 'shake' | 'firecracker' | 'flash';
}

export interface Cutscene {
  /** 畫面色調：妖怪視角是紫色，廟裡是金色 */
  mood: 'demon' | 'temple' | 'dawn';
  place: string;
  lines: Line[];
}

export const CUTSCENES: Record<string, Cutscene> = {
  opening: {
    mood: 'demon',
    place: '芝嶺巖・深夜',
    lines: [
      { who: 'narrator', text: '芝嶺巖，深夜。\n山上一塊像馬的大石頭，裂開了一道縫。' },
      { who: 'shiju', text: '……主公？', fx: 'shake' },
      { who: 'shiju', text: '好暗。好餓。\n肚子……好痛。' },
      { who: 'narrator', text: '同一時刻，萬舺的巷子裡，\n兩隻小妖從水溝蓋底下鑽了出來。' },
      { who: 'wang', text: '欸，阿魅，你有沒有覺得今年特別早醒？' },
      { who: 'mei', text: '北邊那個大傢伙一直在叫，吵死了，誰睡得著。' },
      { who: 'narrator', text: '萬舺青嶺宮。\n香爐裡的香，無風自斷。' },
      { who: 'god', text: '封印將崩。\n今年暗訪，提前起駕。', fx: 'flash' },
    ],
  },
  dusk1: {
    mood: 'demon',
    place: '萬舺・黃昏的騎樓下',
    lines: [
      { who: 'wang', text: '鑼聲越來越近了……' },
      { who: 'mei', text: '怕什麼，凡人又看不到我們。' },
      { who: 'narrator', text: '劈哩啪啦——！', fx: 'firecracker' },
      { who: 'wang', text: '哇啊啊！那、那是七爺八爺？' },
      { who: 'mei', text: '手上拿的是……手銬？！' },
      { who: 'wang', text: '快跑——！' },
    ],
  },
  dusk2: {
    mood: 'demon',
    place: '芝林・田埂邊',
    lines: [
      { who: 'narrator', text: '妖怪們在開會。' },
      { who: 'kui', text: '石駒老大今晚要我們去攻廟。' },
      { who: 'wang', text: '牠才不是老大，牠根本不理人。' },
      { who: 'mei', text: '牠一直在喊「主公、主公」……\n主公是誰啊？' },
      { who: 'kui', text: '不去的話，會被牠踩扁。' },
      { who: 'wang', text: '……今晚不去行不行？' },
    ],
  },
  dusk3: {
    mood: 'demon',
    place: '芝嶺巖・入夜',
    lines: [
      { who: 'shiju', text: '我記得鑼聲。' },
      { who: 'shiju', text: '我記得有人騎在我背上，\n旗子在風裡啪啪地響。' },
      { who: 'shiju', text: '可是我的肚子好痛。\n那裡有個洞，冷風一直灌進來。' },
      { who: 'shiju', text: '你們這些拿旗子的人……\n也是來鑿我的嗎？', fx: 'shake' },
    ],
  },
  recall: {
    mood: 'temple',
    place: '惠澤宮・廟埕',
    lines: [
      { who: 'narrator', text: '煞氣散去。\n石駒跪倒在廟埕上。' },
      { who: 'kaijiang', text: '回來吧。', fx: 'flash' },
      { who: 'shijuCalm', text: '……主公？' },
      { who: 'shijuCalm', text: '我想起來了。\n我是跟著您出征的馬。' },
      { who: 'god', text: '石駒，往後隨我們的隊伍，\n一起護島吧。' },
      { who: 'shijuCalm', text: '遵旨。' },
    ],
  },
  retreat: {
    mood: 'demon',
    place: '芝嶺巖・天亮',
    lines: [
      { who: 'narrator', text: '雞啼了。' },
      { who: 'shiju', text: '……天亮了。\n我要回山裡去。' },
      { who: 'narrator', text: '石駒退回山上，沒能喚回牠。\n整頓隊伍，今晚再試一次。' },
    ],
  },
};

/** 判官審判：依捉到的小妖數量給情報 */
export interface Verdict {
  lines: Line[];
  intel: { quakeTip?: boolean; mainSide?: -1 | 1; bellyWound?: boolean; longBreath?: boolean };
}

export function judge(afterNight: number, captured: number): Verdict {
  const lines: Line[] = [];
  const intel: Verdict['intel'] = {};
  if (afterNight === 1) {
    if (captured === 0) {
      lines.push({ who: 'judge', text: '昨夜一隻也沒捉到？\n……罷了。' });
      lines.push({ who: 'baoma', text: '我在路上聽人說，北邊芝林最近怪事很多，\n菜園一夜被啃光，夜裡還有馬蹄聲。' });
      return { lines, intel };
    }
    lines.push({ who: 'judge', text: `昨夜捉拿小妖 ${captured} 名。\n帶上來，從實招來！` });
    lines.push({ who: 'wang', text: '大、大人饒命！\n我們都是被北邊芝林那匹石頭馬的煞氣吵醒的！' });
    if (captured >= 2) {
      lines.push({ who: 'mei', text: '牠身邊還跟著石屑傀，石頭做的，硬得很……\n可是牠們最怕鑼鼓震！' });
      intel.quakeTip = true;
    }
    if (captured >= 4) {
      lines.push({ who: 'wang', text: '今晚大家會從北邊，也就是右邊，大批過去！\n我、我全說了！' });
      intel.mainSide = 1;
    }
    lines.push({ who: 'judge', text: '記下了。帶下去超渡。' });
    return { lines, intel };
  }
  // 第二夜之後
  if (captured === 0) {
    lines.push({ who: 'judge', text: '又是一隻也沒捉到。\n今晚只能硬碰硬了。' });
    return { lines, intel };
  }
  lines.push({ who: 'judge', text: `捉拿小妖 ${captured} 名。\n說，石駒有什麼弱點？` });
  lines.push({ who: 'kui', text: '石駒的肚子上有個舊洞，\n煞氣就是從那裡灌進去的。打那裡最痛。' });
  intel.bellyWound = true;
  if (captured >= 3) {
    lines.push({ who: 'mei', text: '還有還有！牠衝完一次就會停下來喘，\n喘很久很久！' });
    intel.longBreath = true;
  }
  lines.push({ who: 'judge', text: '記下了。帶下去超渡。' });
  return { lines, intel };
}
