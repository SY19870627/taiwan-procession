/**
 * 夜晚前：布陣與整備。決定每個陣頭站在神轎哪一邊，用香火升級陣頭。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { NIGHTS } from '../content/nights';
import { UNITS, type UnitId } from '../core/units';
import { run } from '../state';
import { ResourceBar, button, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';
import { lvOf, memberDef, type MemberKey } from '../core/upgrades';
import { nightEffects } from '../content/believers';
import type { Side } from '../core/battle';

export function availableUnits(): UnitId[] {
  const list: UnitId[] = ['bajiang', 'qiye', 'xingshi', 'paoshou'];
  if (run.allied) list.push('kaijiang');
  return list;
}


export class PrepScene extends Phaser.Scene {
  rebuildable = true;
  restartData: object = {};

  constructor() {
    super('prep');
  }

  create(data: { night: number }): void {
    const n = data.night ?? 1;
    this.restartData = { night: n };
    const def = NIGHTS[n];
    if (run.allied && run.sides.kaijiang === undefined) run.sides.kaijiang = 1;
    this.cameras.main.fadeIn(400, 10, 8, 18);
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    bg.fillRect(0, 0, W, H);
    const temple = n === 1 ? 'temple_qingling' : n === 2 ? 'temple_zhuang' : 'temple_huize';
    this.add.image(W / 2, H, temple).setOrigin(0.5, 1).setAlpha(0.25).setDepth(-9);

    txt(this, 24, 16, def.title, 36, C.gold, { serif: true });
    txt(this, 26, 64, `地點：${def.place}`, 20, C.paper, { bold: false });
    new ResourceBar(this, 16, 100);

    // 上：今夜說明與狀況
    const lx = 16;
    const lw = W - 32;
    const lines = [...nightEffects(run, n)];
    if (run.intel.quakeTip && n === 2) lines.push('醒獅的震擊對石屑傀特別有效');
    if (run.intel.bellyWound && n === 3) lines.push('石駒肚子的舊傷是弱點（喘息時傷害大增）');
    if (run.intel.longBreath && n === 3) lines.push('石駒衝鋒後會喘息較久');
    const topY = 166;
    const pg = this.add.graphics();
    const t1 = txt(this, lx + 24, topY + 16, '今夜', 24, C.gold, { serif: true });
    const brief = txt(this, lx + 24, t1.y + 38, def.brief, 20, C.paper, { bold: false, lineSpacing: 6, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    const t2 = txt(this, lx + 24, brief.y + brief.height + 14, '今晚的狀況', 24, C.gold, { serif: true });
    const cond = txt(this, lx + 24, t2.y + 38, lines.length ? lines.map((s) => `・${s}`).join('\n') : '（沒有特別的狀況）', 18, lines.length ? 0x9fe8c0 : C.muted, { bold: false, lineSpacing: 6, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    const topH = cond.y + cond.height + 18 - topY;
    pg.destroy();
    panel(this, lx, topY, lw, topH).setDepth(-1);

    // 下：陣頭列表
    const rx = 16;
    const rw = W - 32;
    const ry = topY + topH + 16;
    const units = availableUnits();
    const bottomY = H - 190;
    const rowH = Math.min(104, (bottomY - ry - 70) / units.length);
    panel(this, rx, ry, rw, 62 + rowH * units.length).setDepth(-1);
    txt(this, rx + 24, ry + 14, '布陣', 24, C.gold, { serif: true });
    txt(this, rx + rw - 24, ry + 20, `${def.sideNames[-1 as Side]} ◀　神轎　▶ ${def.sideNames[1 as Side]}`, 17, C.muted).setOrigin(1, 0);
    const openTeam = (focus: MemberKey) => {
      this.scene.pause();
      this.scene.launch('unit', { from: 'prep', focus });
    };
    // 整備畫面關掉後，重畫一次（等級、香火可能變了）
    this.events.off('resume');
    this.events.on('resume', () => this.scene.restart({ night: n }));
    units.forEach((id, i) => {
      const y = ry + 56 + i * rowH;
      const u = UNITS[id];
      if (i > 0) this.add.rectangle(rx + 20, y, rw - 40, 1, 0x5a4a6e).setOrigin(0, 0.5);
      const icon = id === 'qiye' ? 'qiye' : id === 'bajiang' ? 'bajiang0' : id === 'xingshi' ? 'lion' : id === 'paoshou' ? 'paoshou' : 'kaijiang';
      const img = this.add.image(rx + 54, y + rowH / 2, icon).setOrigin(0.5, 0.5);
      img.setScale(Math.min((rowH - 12) / img.height, 70 / img.width));
      txt(this, rx + 100, y + 10, u.name, 22, C.paper);
      // 各項等級摘要
      const md = memberDef(id);
      const summary = md.stats.map((st) => `${st.name}${lvOf(run.ups, id, st.key)}`).join('・');
      txt(this, rx + 100, y + 42, md.locked ? '交陪援軍（不可升級）' : summary, 15, md.locked ? C.muted : 0x9fe8c0, { bold: false, wordWrap: { width: 250, useAdvancedWrap: true } });
      const sideBtns: Button[] = [];
      const refresh = () => {
        const s = run.sides[id] ?? 1;
        sideBtns.forEach((b, k) => b.setAlpha((k === 0 ? s === -1 : s === 1) ? 1 : 0.45));
      };
      const bh = Math.min(60, rowH - 20);
      ([-1, 1] as Side[]).forEach((s, k) => {
        const b = button(this, rx + rw - 262 + k * 88, y + rowH / 2, 82, bh, s === -1 ? (n === 1 ? '◀ 後' : '◀ 左') : (n === 1 ? '前 ▶' : '右 ▶'), () => {
          run.sides[id] = s;
          refresh();
        }, { size: 19, fill: s === -1 ? 0x2b3a5a : 0x5a2b2b });
        sideBtns.push(b);
      });
      button(this, rx + rw - 70, y + rowH / 2, 112, bh, '整備 ▶', () => openTeam(id), { size: 19, fill: 0x2f6f5a });
      refresh();
    });

    txt(this, W / 2, H - 168, '法術（冷卻制）：天令 15 秒一次（範圍雷擊）、淨符 25 秒一次（回復）', 16, C.muted, { bold: false, align: 'center', wordWrap: { width: W - 48, useAdvancedWrap: true } }).setOrigin(0.5, 0);
    button(this, 24 + 150, H - 72, 300, 84, '神轎整備', () => openTeam('palanquin'), { size: 26, fill: 0x5a2a6a });
    button(this, W - 24 - 170, H - 72, 340, 96, '出　陣', () => go(this, 'night', { night: n }), { size: 36, fill: 0x8a1b14 });
    fullscreenButton(this);
  }
}
