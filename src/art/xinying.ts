/**
 * 第三章「新瀛・太子出營」的美術（程式繪製）。
 *
 * 【暫代美術】全部程式繪製（見 docs/第三章_開發計畫.md §5），之後可換正式圖：
 *  - 隊伍：五色營旗、太子神轎、四將步行小人、營兵（扛東南西北中五色小旗）
 *  - 九個鬼、信徒與路人的小人（隊伍帶、卡片小圖示用；對話與夜審用立繪）
 *  - 戰鬥圖：太子（出轎、踩風火輪）、四將（戰鬥姿勢）、蛟（平常／浪頭升起）、蝦兵、乾坤圈、風火輪火痕、水牆
 *  - 三張背景（庄頭街景、鴨母寮、溪邊渡口）在 art/xinyingScenery.ts
 */
import Phaser from 'phaser';
import { drawPalanquin, make, person } from './figures';
import { makeTemple } from './backdrop';
import { makeXinyingScenery } from './xinyingScenery';
import { makeXinyingBattle, pennant, ring } from './xinyingBattle';
import { CAMP_COLORS, CAMP_ORDER } from './xinyingSpec';

export { CAMP_COLORS, CAMP_ORDER } from './xinyingSpec';

export function makeXinying(scene: Phaser.Scene): void {
  makeTemple(scene, 'temple_taizi', '太子殿');
  makeXinyingScenery(scene);
  makeXinyingBattle(scene);

  // 五色營旗：一根竹竿上五面三角旗（白天隊伍最前面、營旗下的圖示）
  make(scene, 'w3_flags', 120, 210, (g, w, h) => {
    person(g, w, h, { robe: 0xf4f2ea, trim: 0xc8372d, pants: 0x2a2a30, tall: 0.95, hat: 'band', hatColor: 0xe9b949, item: 'none' });
    g.fillStyle(0x8a6a3a, 1);
    g.fillRect(w / 2 + 14, 8, 4, h - 40);
    const cs = [CAMP_COLORS.east, CAMP_COLORS.south, CAMP_COLORS.west, CAMP_COLORS.north, CAMP_COLORS.center];
    cs.forEach((c, i) => pennant(g, w / 2 + 18, 10 + i * 22, 30, c));
  });

  // 四將（步行）：盔甲配營色；與立繪的配色一致
  const general = (key: string, robe: number, trim: number, item: 'club' | 'flag' | 'fan' | 'chain') =>
    make(scene, key, 90, 128, (g, w, h) => person(g, w, h, { robe, trim, pants: 0x2a2a30, tall: 1.08, wide: 1.1, hat: 'helmet', hatColor: trim, item }));
  general('w3_zhang', CAMP_COLORS.east, 0xe9b949, 'club');
  general('w3_xiao', CAMP_COLORS.south, 0xe9b949, 'club');
  general('w3_liu', 0xd8d4ca, 0x6a6a7a, 'flag');
  general('w3_lian', CAMP_COLORS.north, 0x7a8aa0, 'chain');
  // 營兵：扛著小營旗的小兵；收編越多隊伍後面越多（xinyingSpec 的 bandLine3），小旗依東南西北中輪流上色
  const soldier = (key: string, flag: number) => make(scene, key, 80, 116, (g, w, h) => {
    person(g, w, h, { robe: 0x6a5a3a, trim: 0xe9b949, pants: 0x2a2a30, tall: 0.92, hat: 'helmet', hatColor: 0x3a3a3a, item: 'none' });
    g.fillStyle(0x8a6a3a, 1);
    g.fillRect(w / 2 + 12, 10, 3, h - 30);
    pennant(g, w / 2 + 15, 12, 22, flag);
  });
  soldier('w3_soldier', CAMP_COLORS.center);
  CAMP_ORDER.forEach((camp, i) => soldier(`w3_soldier${i}`, CAMP_COLORS[camp]));

  // 太子神轎（中營）：紅轎身、轎班穿中營黃、轎頂一圈乾坤圈、後面飄著混天綾
  make(scene, 'w3_palanquin', 230, 200, (g, w, h) => {
    // 混天綾（紅綢帶）從轎頂往後飄
    g.lineStyle(7, 0xd8372d, 0.9);
    g.beginPath();
    g.moveTo(w / 2 - 20, h - 150);
    for (let k = 1; k <= 8; k++) g.lineTo(w / 2 - 20 - k * 11, h - 150 + Math.sin(k * 0.9) * 12 + k * 2);
    g.strokePath();
    drawPalanquin(g, w, h, { shirt: 0xe9c13a, body: 0xb3261e, roof: 0xc8372d, sash: 0xb3261e });
    ring(g, w / 2, h - 176, 9, 3);
  });

  // 九個鬼
  make(scene, 'g3_yamupo', 80, 108, (g, w, h) => person(g, w, h, { robe: 0x4a4a52, tall: 0.8, wide: 0.9, hat: 'scarf', hatColor: 0x6a5a4a, item: 'basket', apron: 0x8a7a5a }));
  make(scene, 'g3_hutou', 100, 128, (g, w, h) => person(g, w, h, { robe: 0x2a2a2a, trim: 0xc8372d, pants: 0x1a1a1a, tall: 1.05, wide: 1.45, hat: 'none', item: 'club' }));
  make(scene, 'g3_zhizha', 70, 96, (g, w, h) => person(g, w, h, { robe: 0xd8372d, trim: 0xf4e2b0, skin: 0xf4efe6, tall: 0.7, wide: 0.8, hat: 'bun', hatColor: 0x1a1a1a, item: 'none', paint: [0xf4efe6, 0xf4c0c0] }));
  make(scene, 'g3_dubo', 90, 124, (g, w, h) => person(g, w, h, { robe: 0x3a4a3a, pants: 0x2a2a24, tall: 0.95, hat: 'straw', hatColor: 0xb89a5a, item: 'rudder' }));
  make(scene, 'g3_shuigui', 80, 116, (g, w, h) => person(g, w, h, { robe: 0x3a5a6a, pants: 0x2a3a4a, skin: 0xa8c0c0, tall: 1.0, hat: 'none', item: 'none' }));
  make(scene, 'g3_huosha', 76, 108, (g, w, h) => {
    person(g, w, h, { robe: 0x3a2a1a, pants: 0x1a1410, skin: 0x8a5a3a, tall: 0.86, wide: 0.85, hat: 'none', item: 'none' });
    g.fillStyle(0xff7a2a, 0.8);
    for (let i = 0; i < 3; i++) g.fillCircle(w / 2 + 16 + i * 5, 46 - i * 9, 3 + i);
  });
  make(scene, 'g3_shuyao', 90, 80, (g, w, h) => {
    // 胖老鼠：橢圓身體、圓耳、長尾巴
    g.fillStyle(0x6a5a5a, 1);
    g.fillEllipse(w / 2, h - 26, 58, 44);
    g.fillCircle(w / 2 + 22, h - 46, 16);
    g.fillStyle(0xc89a9a, 1);
    g.fillCircle(w / 2 + 16, h - 62, 7);
    g.fillCircle(w / 2 + 30, h - 60, 7);
    g.fillStyle(0x111111, 1);
    g.fillCircle(w / 2 + 28, h - 48, 2.5);
    g.lineStyle(3, 0x8a6a6a, 1);
    g.beginPath();
    g.moveTo(w / 2 - 28, h - 22);
    g.lineTo(w / 2 - 40, h - 36);
    g.lineTo(w / 2 - 36, h - 50);
    g.strokePath();
  });
  make(scene, 'g3_shaozaibo', 80, 116, (g, w, h) => person(g, w, h, { robe: 0xd8c84a, trim: 0x2a2a30, pants: 0x3a3a4a, tall: 0.92, hat: 'cap', hatColor: 0x2a3a6a, item: 'none' }));
  make(scene, 'g3_awang', 70, 108, (g, w, h) => person(g, w, h, { robe: 0x6a6a5a, pants: 0x3a3a30, tall: 0.88, wide: 0.75, hat: 'none', item: 'sack' }));

  // 信徒與路人
  make(scene, 'n3_bingbo', 76, 112, (g, w, h) => person(g, w, h, { robe: 0x3a5a3a, trim: 0xe9b949, tall: 0.9, wide: 1.05, hat: 'none', item: 'incense' }));
  make(scene, 'n3_akai', 76, 116, (g, w, h) => person(g, w, h, { robe: 0xf4f2ea, trim: 0xc8372d, pants: 0x2a3a6a, tall: 1.0, hat: 'band', hatColor: 0xe9b949, item: 'none' }));
  make(scene, 'n3_yashen', 72, 108, (g, w, h) => person(g, w, h, { robe: 0x7a6a4a, pants: 0x2a2a30, tall: 0.88, hat: 'straw', hatColor: 0xc8a86a, item: 'basket', apron: 0x5a7a8a }));
  make(scene, 'n3_aling', 70, 110, (g, w, h) => person(g, w, h, { robe: 0xe8a0b0, pants: 0x3a3a4a, tall: 0.9, hat: 'bun', hatColor: 0x2a1c14, item: 'none' }));
  make(scene, 'n3_hebo', 72, 108, (g, w, h) => person(g, w, h, { robe: 0x5a6a7a, pants: 0x2a2a30, tall: 0.86, hat: 'flat', hatColor: 0x3a3a3a, item: 'none' }));
  make(scene, 'n3_janitor', 72, 110, (g, w, h) => person(g, w, h, { robe: 0x4a6a8a, pants: 0x2a2a30, tall: 0.9, hat: 'cap', hatColor: 0x2a4a6a, item: 'brush' }));
  make(scene, 'n3_angler', 72, 110, (g, w, h) => person(g, w, h, { robe: 0x6a7a5a, pants: 0x2a2a30, tall: 0.9, hat: 'straw', hatColor: 0xb89a5a, item: 'none' }));
  make(scene, 'n3_auntie', 70, 108, (g, w, h) => person(g, w, h, { robe: 0x9a5a5a, pants: 0x2a2a30, tall: 0.86, hat: 'scarf', hatColor: 0x5a8a5a, item: 'basket', apron: 0xe8d0a0 }));
  make(scene, 'n3_kids', 70, 90, (g, w, h) => person(g, w, h, { robe: 0xe9b949, pants: 0x2a3a6a, tall: 0.65, wide: 0.8, hat: 'none', item: 'none' }));
  make(scene, 'n3_farmer', 72, 110, (g, w, h) => person(g, w, h, { robe: 0x8a7a5a, pants: 0x3a3a30, tall: 0.88, hat: 'straw', hatColor: 0xc8a86a, item: 'none' }));

  // 小妖：蝦兵（白天路上；最後一戰的蝦兵是 xinyingBattle.ts 的 xia）
  make(scene, 'xia_imp', 80, 70, (g, w, h) => {
    g.fillStyle(0xd86a4a, 1);
    g.fillEllipse(w / 2, h - 24, 50, 26);
    g.fillStyle(0xe88a6a, 1);
    for (let i = 0; i < 3; i++) g.fillEllipse(w / 2 - 22 - i * 8, h - 24 + i * 2, 12, 16 - i * 3);
    g.lineStyle(3, 0xb84a2a, 1);
    g.lineBetween(w / 2 + 18, h - 30, w / 2 + 34, h - 48);
    g.lineBetween(w / 2 + 14, h - 32, w / 2 + 22, h - 56);
    g.fillStyle(0x111111, 1);
    g.fillCircle(w / 2 + 16, h - 30, 3);
  });
}
