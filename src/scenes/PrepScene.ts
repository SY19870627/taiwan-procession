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
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b0a1c, 0x0b0a1c, 0x231d40, 0x231d40, 1);
    bg.fillRect(0, 0, W, H);
    const temple = n === 1 ? 'temple_qingling' : n === 2 ? 'temple_zhuang' : 'temple_huize';
    this.add.image(W / 2, H, temple).setOrigin(0.5, 1).setAlpha(0.25);

    txt(this, 40, 26, def.title, 40, C.gold, { serif: true });
    txt(this, 44, 80, `地點：${def.place}`, 22, C.paper, { bold: false });
    new ResourceBar(this, W - 520, 20);

    // 左欄：說明與情報
    const lx = 30;
    const lw = Math.max(380, W * 0.32);
    panel(this, lx, 120, lw, H - 140);
    txt(this, lx + 24, 140, '今夜', 24, C.gold, { serif: true });
    txt(this, lx + 24, 176, def.brief, 21, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    // 白天的選擇造成的今晚狀況＋判官情報
    const lines = [...nightEffects(run, n)];
    if (run.intel.quakeTip && n === 2) lines.push('醒獅的震擊對石屑傀特別有效');
    if (run.intel.bellyWound && n === 3) lines.push('石駒肚子的舊傷是弱點（喘息時傷害大增）');
    if (run.intel.longBreath && n === 3) lines.push('石駒衝鋒後會喘息較久');
    txt(this, lx + 24, 330, '今晚的狀況', 24, C.gold, { serif: true });
    txt(this, lx + 24, 366, lines.length ? lines.map((s) => `・${s}`).join('\n') : '（沒有特別的狀況）', 18, lines.length ? 0x9fe8c0 : C.muted, { bold: false, lineSpacing: 6, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    txt(this, lx + 24, H - 70, '法術（冷卻制）：天令 15 秒一次（範圍雷擊）、淨符 25 秒一次（回復）', 17, C.muted, { bold: false, wordWrap: { width: lw - 48, useAdvancedWrap: true } });

    // 右欄：陣頭列表
    const rx = lx + lw + 20;
    const rw = W - rx - 30;
    panel(this, rx, 120, rw, H - 140);
    txt(this, rx + 24, 136, '布陣', 24, C.gold, { serif: true });
    txt(this, rx + rw - 24, 140, `${def.sideNames[-1 as Side]} ◀　神轎　▶ ${def.sideNames[1 as Side]}`, 18, C.muted).setOrigin(1, 0);
    const units = availableUnits();
    const rowH = Math.min(84, (H - 300) / units.length);
    const openTeam = (focus: MemberKey) => {
      this.scene.pause();
      this.scene.launch('unit', { from: 'prep', focus });
    };
    // 整備畫面關掉後，重畫一次（等級、香火可能變了）
    this.events.off('resume');
    this.events.on('resume', () => this.scene.restart({ night: n }));
    units.forEach((id, i) => {
      const y = 186 + i * rowH;
      const u = UNITS[id];
      const icon = id === 'qiye' ? 'qiye' : id === 'bajiang' ? 'bajiang0' : id === 'xingshi' ? 'lion' : id === 'paoshou' ? 'paoshou' : 'kaijiang';
      const img = this.add.image(rx + 54, y + rowH / 2, icon).setOrigin(0.5, 0.5);
      img.setScale(Math.min((rowH - 8) / img.height, 70 / img.width));
      txt(this, rx + 100, y + 10, u.name, 24, C.paper);
      // 各項等級摘要
      const md = memberDef(id);
      const summary = md.stats.map((st) => `${st.name}${lvOf(run.ups, id, st.key)}`).join('・');
      txt(this, rx + 100, y + 46, md.locked ? '交陪援軍（不可升級）' : summary, 16, md.locked ? C.muted : 0x9fe8c0, { bold: false });
      const sideBtns: Button[] = [];
      const refresh = () => {
        const s = run.sides[id] ?? 1;
        sideBtns.forEach((b, k) => b.setAlpha((k === 0 ? s === -1 : s === 1) ? 1 : 0.45));
      };
      ([-1, 1] as Side[]).forEach((s, k) => {
        const b = button(this, rx + rw - 330 + k * 100, y + rowH / 2, 92, Math.min(56, rowH - 14), s === -1 ? (n === 1 ? '◀ 後' : '◀ 左') : (n === 1 ? '前 ▶' : '右 ▶'), () => {
          run.sides[id] = s;
          refresh();
        }, { size: 20, fill: s === -1 ? 0x2b3a5a : 0x5a2b2b });
        sideBtns.push(b);
      });
      button(this, rx + rw - 100, y + rowH / 2, 150, Math.min(56, rowH - 14), '整備 ▶', () => openTeam(id), { size: 20, fill: 0x2f6f5a });
      refresh();
    });
    button(this, rx + 150, H - 60, 240, 64, '神轎整備', () => openTeam('palanquin'), { size: 24, fill: 0x5a2a6a });

    button(this, rx + rw - 170, H - 60, 280, 72, '出　陣', () => go(this, 'night', { night: n }), { size: 32, fill: 0x8a1b14 });
    fullscreenButton(this);
  }
}
