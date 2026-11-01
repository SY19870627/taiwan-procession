/**
 * 第三章的過場劇情（第 6 階段寫完整）。神明可以畫臉（決策紀錄 2026-10-27）：太子與五將用立繪，不用「旨意」。
 * 妖怪視角表現「被嚇到」（大綱 §2 爽點三：旁人震驚——凡人看不見，但看得見怪事）。
 *
 * 播放時機：
 *  - kaiying3：序章擲筊之後、第一天黃曆之前（開營：五將登場互嗆、營旗下押著三個鬼）
 *  - zhizha3：紙紮童第一次跪地求饒（夜審或路邊點將，蓋在畫面上播）
 *  - river3：第二夜天亮前（溪水倒流，第三天整天倒流）
 *  - jiao3：第三夜之後（蛟現身，接著是「蛟現身」短過場與最後一戰）
 *  - jiaoRecall／jiaoSlay3／jiaoReturn3：最後一戰的三種結局
 *  - shouying3：收營（三種結局都會播），之後是信徒錄
 *
 * 台詞是依大綱人設自行補寫的【待定】（計畫 §7 Q27）：太子嘴硬愛現、章將軍碎念、霄將軍起鬨、柳將軍一字、廉將軍說完沒人接。
 */
import type { Cutscene } from '../story';

export const CUTSCENES3: Record<string, Cutscene> = {
  kaiying3: {
    mood: 'temple',
    place: '新瀛太子殿・開營',
    temple: 'temple_taizi',
    lines: [
      { who: 'narrator', text: '九月初九前三天。新瀛太子殿前的五營旗竿，一夜之間全插滿了。' },
      { who: 'zhangjiang', text: '東營到。太子，弟兄們都準備好了。' },
      { who: 'xiaojiang', text: '南營到！太子，今年打幾隻？我賭十隻！', expr: 'smile' },
      { who: 'liujiang', text: '西營。' },
      { who: 'lianjiang', text: '北營。……溪水今年的聲音，不太對。' },
      { who: 'narrator', text: '沒有人接話。' },
      { who: 'taizi', text: '囉嗦。人到了就好。', expr: 'cocky' },
      { who: 'xiaojiang', text: '對了，昨晚順手抓了三個，押在營旗下了！' },
      { who: 'narrator', text: '營旗下押著三個鬼：一個抱著鴨毛的老婦人、一個渾身濕透的年輕人、一個一身焦味的瘦小子。' },
      { who: 'zhangjiang', text: '五格滿了三格。太子，這三天會很擠。', expr: 'sigh' },
      { who: 'taizi', text: '擠就擠。走了。', fx: 'flash' },
    ],
  },
  zhizha3: {
    mood: 'demon',
    place: '太子殿・堂前',
    bg: 'plain',
    lines: [
      { who: 'narrator', text: '紙紮童一直以為，太子爺只是一尊不會動的神像。' },
      { who: 'zhizha', text: '我才是太子！小孩子的糖，都是送給我的！', expr: 'angry' },
      { who: 'taizi', text: '喔？', expr: 'cocky' },
      { who: 'narrator', text: '乾坤圈「鏘」的一聲落在牠面前。地磚裂了一條縫。', fx: 'shake' },
      { who: 'zhizha', text: '……太、太子爺。小的是紙做的，經不起、經不起……', expr: 'scared' },
      { who: 'xiaojiang', text: '跪了！牠跪了啦！', expr: 'smile' },
      { who: 'narrator', text: '隔天，來舊壇的小孩說：壇上那尊紙紮的「三太子」，自己跪下來了。' },
    ],
  },
  river3: {
    mood: 'demon',
    place: '疾水溪・天還沒亮',
    bg: 'river',
    lines: [
      { who: 'narrator', text: '天還沒亮，疾水溪的水開始往山那邊流。' },
      { who: 'xiabing', text: '老、老大醒了！溪水倒著流了！', expr: 'surprised' },
      { who: 'xiabing', text: '聽說岸上那個綁雙髻的，兩天就把我們打爆了一整窩……' },
      { who: 'jiao', text: '怕什麼。他小時候，也是在水邊哭著回家的。', expr: 'cocky' },
      { who: 'narrator', text: '岸上，擺茶攤的何伯看著溪面，茶杯停在半空中。' },
      { who: 'hebo', text: '溪水……怎麼往山那邊流？', expr: 'surprised' },
    ],
  },
  jiao3: {
    mood: 'demon',
    place: '疾水溪・收營夜',
    bg: 'river',
    lines: [
      { who: 'narrator', text: '收營夜。五營兵將把太子轎抬到疾水溪舊渡口。溪水倒流了一整天，這時整個鼓了起來。' },
      { who: 'lianjiang', text: '水裡那個，在聽。' },
      { who: 'jiao', text: '哪來的小鬼，在我的溪邊插旗子？', expr: 'cocky' },
      { who: 'xiaojiang', text: '你說誰小鬼！', expr: 'angry' },
      { who: 'jiao', text: '鴨子、渡船、小孩……這條溪的東西，都是我的。' },
      { who: 'jiao', text: '……喔？你就是當年鬧海那個小鬼？', fx: 'shake' },
      { who: 'zhangjiang', text: '太子，別理牠——' },
      { who: 'taizi', text: '站好，別說我偷襲。', expr: 'cocky' },
      { who: 'narrator', text: '五面營旗同時豎了起來。', fx: 'flash' },
    ],
  },
  jiaoRecall: {
    mood: 'dawn',
    place: '疾水溪・天將亮',
    bg: 'river',
    lines: [
      { who: 'narrator', text: '天快亮了。溪水停了一下，慢慢轉回往海那邊流。' },
      { who: 'jiaoCalm', text: '……我在這裡幾百年，第一次有人沒讓我沉下去。' },
      { who: 'jiaoCalm', text: '要殺要剮，隨你。' },
      { who: 'taizi', text: '誰說要殺你。……我只是缺一隻坐騎。', expr: 'pout', fx: 'flash' },
      { who: 'xiaojiang', text: '坐騎！太子有坐騎了！', expr: 'smile' },
      { who: 'zhangjiang', text: '太子，您嘴角在笑。', expr: 'smile' },
      { who: 'taizi', text: '沒有。', expr: 'pout' },
      { who: 'liujiang', text: '有。' },
      { who: 'narrator', text: '蛟低下頭，讓太子踩上牠的頭。溪面上，一列白鴨慢慢游了過去。' },
    ],
  },
  jiaoSlay3: {
    mood: 'dawn',
    place: '疾水溪・天將亮',
    bg: 'river',
    lines: [
      { who: 'jiao', text: '你……真的一點情面都不留……' },
      { who: 'taizi', text: '鴨子、渡船、小孩。你欠的，自己算。', expr: 'fierce' },
      { who: 'narrator', text: '火尖槍落下。疾水溪的水嘩的一聲，轉回往海那邊流。', fx: 'flash' },
      { who: 'xiaojiang', text: '帥啦！', expr: 'smile' },
      { who: 'zhangjiang', text: '太子，收營吧。' },
      { who: 'taizi', text: '……嗯。' },
    ],
  },
  jiaoReturn3: {
    mood: 'dawn',
    place: '疾水溪・天將亮',
    bg: 'river',
    lines: [
      { who: 'lianjiang', text: '水府那邊，會收牠。' },
      { who: 'jiaoCalm', text: '……今天算你運氣好。' },
      { who: 'taizi', text: '下次再出來，我就不押了。', expr: 'cocky' },
      { who: 'narrator', text: '蛟沉回溪底。溪水平靜了，可是溪底深處，好像還有什麼在動。' },
      { who: 'lianjiang', text: '……下面，還有。' },
      { who: 'narrator', text: '沒有人接話。' },
    ],
  },
  shouying3: {
    mood: 'temple',
    place: '新瀛太子殿・收營',
    temple: 'temple_taizi',
    lines: [
      { who: 'narrator', text: '收營。五營旗一面一面收回太子殿，跟回來的營兵，比出營時多了好幾個。' },
      { who: 'bingbo', text: '太子，辛苦了。這是今年的蜂蜜。……還有這個。', expr: 'smile' },
      { who: 'narrator', text: '炳伯在供桌上擺了一碗蜂蜜，旁邊放了一個奶嘴。' },
      { who: 'taizi', text: '誰要這個。……先放著。', expr: 'pout' },
      { who: 'xiaojiang', text: '明年再出營！明年打二十隻！', expr: 'smile' },
      { who: 'zhangjiang', text: '你先把今年的營兵點清楚。', expr: 'sigh' },
      { who: 'lianjiang', text: '溪水，往海那邊流了。' },
      { who: 'narrator', text: '沒有人接話。廟埕外，電音的鼓點還在響。', fx: 'firecracker' },
    ],
  },
};
