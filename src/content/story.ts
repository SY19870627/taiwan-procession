/**
 * 過場劇情。妖怪視角為主（小妖詼諧、石駒悲涼），神明只以「旨意」出現，不畫神明的臉。
 * 遊戲中一律使用虛構名稱（見設計文件 14.5 命名原則）。
 */

export type SpeakerId = 'narrator' | 'wang' | 'mei' | 'kui' | 'shiju' | 'shijuCalm' | 'god' | 'kaijiang' | 'judge' | 'baoma' | 'yun' | 'heichao' | 'heichaoCalm' | 'zhongjun';

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
  // 第二章（東津）
  yun: { name: '雲王爺（旨意）', tex: 'decree', side: 'left', scale: 1.4 },
  heichao: { name: '黑潮', tex: 'heichao', side: 'right', scale: 1.0 },
  heichaoCalm: { name: '黑潮', tex: 'heichao_calm', side: 'right', scale: 1.0 },
  zhongjun: { name: '中軍府', tex: 'zhongjun', side: 'left', scale: 1.7 },
};

/** 過場說話的人 → 立繪圖（代號、預設表情）；神明一律用「旨意」那張圖 */
export const ART: Partial<Record<Exclude<SpeakerId, 'narrator'>, [string, import('../art/portraits').Expr]>> = {
  wang: ['wang', 'normal'], mei: ['mei', 'normal'], kui: ['kui', 'normal'],
  shiju: ['shiju', 'angry'], shijuCalm: ['shiju', 'calm'],
  god: ['decree', 'normal'], kaijiang: ['decree', 'normal'], yun: ['decree', 'normal'],
  judge: ['judge', 'normal'], zhongjun: ['zhongjun', 'normal'],
  heichao: ['heichao', 'angry'], heichaoCalm: ['heichao', 'calm'],
};

export interface Line {
  who: SpeakerId;
  text: string;
  /** 表情（有立繪圖的才有用；沒寫就用 ART 的預設） */
  expr?: import('../art/portraits').Expr;
  /** 演出效果 */
  fx?: 'shake' | 'firecracker' | 'flash';
}

export interface Cutscene {
  /** 畫面色調：妖怪視角是紫色，廟裡是金色 */
  mood: 'demon' | 'temple' | 'dawn';
  place: string;
  /** 遠景：海邊（第二章） */
  bg?: 'sea';
  /** 神明視角時的廟 */
  temple?: string;
  lines: Line[];
}

export const CUTSCENES: Record<string, Cutscene> = {
  dusk3: {
    mood: 'demon',
    place: '芝嶺巖・入夜',
    lines: [
      { who: 'shiju', text: '我記得鑼聲，記得旗子在風裡響。' },
      { who: 'shiju', text: '肚子那個洞，冷風一直灌進來。' },
      { who: 'shiju', text: '你們這些拿旗子的人……\n也是來鑿我的嗎？', fx: 'shake' },
    ],
  },
  recall: {
    mood: 'temple',
    place: '惠澤宮・廟埕',
    lines: [
      { who: 'kaijiang', text: '回來吧。', fx: 'flash' },
      { who: 'shijuCalm', text: '……主公。' },
    ],
  },
  // ---------- 第二章：東津・迎王 ----------
  tide3: {
    mood: 'demon',
    place: '大鵬澳・送王夜',
    bg: 'sea',
    lines: [
      { who: 'narrator', text: '王船從東盛宮出發，要推到大鵬澳的沙灘。\n金紙、米包、替身，一路堆上了船。' },
      { who: 'heichao', text: '船……又要出海了。' },
      { who: 'heichao', text: '上一次出海，沒有一個人回來。', fx: 'shake' },
      { who: 'heichao', text: '這一次，換你們留下來。', fx: 'shake' },
    ],
  },
  sendoff: {
    mood: 'dawn',
    place: '大鵬澳・天將亮',
    bg: 'sea',
    lines: [
      { who: 'yun', text: '上船吧。千歲爺帶你們回去。', fx: 'flash' },
      { who: 'heichaoCalm', text: '……可以回家了嗎？' },
      { who: 'narrator', text: '王船點了火。火光裡，海面上好像有五個人影，朝岸上揮了揮手。', fx: 'firecracker' },
    ],
  },
  retreat: {
    mood: 'demon',
    place: '芝嶺巖・天亮',
    lines: [
      { who: 'narrator', text: '雞啼了。石駒退回山上，沒能喚回牠。\n整頓隊伍，今晚再試一次。' },
    ],
  },
};

/** 判官審判：依捉到的小妖數量給情報；情報會解鎖信徒卡上的新選項 */
export interface Verdict {
  lines: Line[];
  intel: { quakeTip?: boolean; bellyWound?: boolean; longBreath?: boolean; salt?: boolean };
  /** 結算畫面上寫明解鎖了什麼 */
  unlocks: string[];
}

export function judge(afterNight: number, captured: number): Verdict {
  const lines: Line[] = [];
  const intel: Verdict['intel'] = {};
  const unlocks: string[] = [];
  if (captured === 0) {
    lines.push({ who: 'judge', text: '昨夜一隻也沒捉到。沒有口供，只能靠你們自己了。' });
    return { lines, intel, unlocks };
  }
  if (afterNight === 1) {
    lines.push({ who: 'judge', text: `昨夜捉拿小妖 ${captured} 名。說，你們怕什麼？` });
    if (captured >= 2) {
      lines.push({ who: 'wang', text: '鹽、鹽米！一撒下去就燙得受不了……' });
      intel.salt = true;
      unlocks.push('「撒鹽米驅魍」（阿秀嬸、小芸的卡上，便宜很多）');
    }
    if (captured >= 3) {
      lines.push({ who: 'mei', text: '石屑傀最怕鑼鼓震，一震就散。' });
      intel.quakeTip = true;
      unlocks.push('醒獅震擊對石屑傀傷害 ×1.5');
    }
    return { lines, intel, unlocks };
  }
  lines.push({ who: 'judge', text: `捉拿小妖 ${captured} 名。說，石駒有什麼弱點？` });
  lines.push({ who: 'kui', text: '牠衝完一次就會停下來喘，喘很久。' });
  intel.longBreath = true;
  unlocks.push('石駒衝鋒後的喘息時間變長');
  if (captured >= 3) {
    lines.push({ who: 'mei', text: '牠肚子上有個舊洞，打那裡最痛。' });
    intel.bellyWound = true;
    unlocks.push('石駒肚子的舊傷（喘息時傷害大增）');
  }
  return { lines, intel, unlocks };
}
