/**
 * 夜晚前：布陣與整備。決定每個陣頭站在神轎哪一邊，用香火升級陣頭。
 */
import Phaser from 'phaser';
import { C, H, W } from '../theme';
import { NIGHTS } from '../content/nights';
import { UNITS, type UnitId } from '../core/units';
import { run } from '../state';
import { ResourceBar, button, fullscreenButton, go, panel, txt, type Button } from '../ui/widgets';
import type { Side } from '../core/battle';

export function availableUnits(): UnitId[] {
  const list: UnitId[] = ['bajiang', 'qiye', 'xingshi', 'paoshou'];
  if (run.allied) list.push('kaijiang');
  return list;
}

export function upgradeCost(id: UnitId): number {
  return UNITS[id].upgradeCost * (run.levels[id] ?? 1);
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
    const bar = new ResourceBar(this, W - 520, 20);

    // 左欄：說明與情報
    const lx = 30;
    const lw = Math.max(380, W * 0.32);
    panel(this, lx, 120, lw, H - 140);
    txt(this, lx + 24, 140, '今夜', 24, C.gold, { serif: true });
    txt(this, lx + 24, 176, def.brief, 21, C.paper, { bold: false, lineSpacing: 8, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    const intel: string[] = [];
    if (run.intel.mainSide && n === 2) intel.push('妖怪主要從右側（北）來');
    if (run.intel.quakeTip && n === 2) intel.push('醒獅的震擊對石屑傀特別有效');
    if (run.intel.bellyWound && n === 3) intel.push('石駒肚子的舊傷是弱點（喘息時傷害大增）');
    if (run.intel.longBreath && n === 3) intel.push('石駒衝鋒後會喘息較久');
    if (run.allied && n === 3) intel.push('惠澤宮令旗隊助陣（交陪）');
    txt(this, lx + 24, 400, '判官情報', 24, C.gold, { serif: true });
    txt(this, lx + 24, 436, intel.length ? intel.map((s) => `・${s}`).join('\n') : '（沒有情報）', 20, intel.length ? 0x9fe8c0 : C.muted, { bold: false, lineSpacing: 8, wordWrap: { width: lw - 48, useAdvancedWrap: true } });
    txt(this, lx + 24, H - 70, '法術：天令（香火 15）範圍雷擊、淨符（香火 10）回復', 17, C.muted, { bold: false, wordWrap: { width: lw - 48, useAdvancedWrap: true } });

    // 右欄：陣頭列表
    const rx = lx + lw + 20;
    const rw = W - rx - 30;
    panel(this, rx, 120, rw, H - 140);
    txt(this, rx + 24, 136, '布陣與整備', 24, C.gold, { serif: true });
    txt(this, rx + rw - 24, 140, `${def.sideNames[-1 as Side]} ◀　神轎　▶ ${def.sideNames[1 as Side]}`, 18, C.muted).setOrigin(1, 0);
    const units = availableUnits();
    const refreshers: (() => void)[] = [];
    const upBtns: { id: UnitId; b: Button }[] = [];
    const rowH = Math.min(84, (H - 300) / units.length);
    units.forEach((id, i) => {
      const y = 186 + i * rowH;
      const u = UNITS[id];
      const fixed = id === 'kaijiang';
      const icon = id === 'qiye' ? 'qiye' : id === 'bajiang' ? 'bajiang0' : id === 'xingshi' ? 'lion' : id === 'paoshou' ? 'paoshou' : 'kaijiang';
      const img = this.add.image(rx + 54, y + rowH / 2, icon).setOrigin(0.5, 0.5);
      img.setScale(Math.min((rowH - 8) / img.height, 70 / img.width));
      const lvTxt = txt(this, rx + 100, y + 10, '', 24, C.paper);
      txt(this, rx + 100, y + 44, u.desc, 15, C.muted, { bold: false, wordWrap: { width: Math.max(160, rw - 520), useAdvancedWrap: true } });
      const sideBtns: Button[] = [];
      const refresh = () => {
        lvTxt.setText(`${u.name}　Lv${run.levels[id] ?? 1}`);
        const s = run.sides[id] ?? 1;
        sideBtns.forEach((b, k) => b.setEnabled(true).setAlpha((k === 0 ? s === -1 : s === 1) ? 1 : 0.45));
      };
      ([-1, 1] as Side[]).forEach((s, k) => {
        const b = button(this, rx + rw - 360 + k * 104, y + rowH / 2, 96, Math.min(56, rowH - 14), s === -1 ? '◀ 左' : '右 ▶', () => {
          run.sides[id] = s;
          refresh();
        }, { size: 20, fill: s === -1 ? 0x2b3a5a : 0x5a2b2b });
        sideBtns.push(b);
      });
      if (n === 1) {
        sideBtns[0].setLabel('◀ 後');
        sideBtns[1].setLabel('前 ▶');
      }
      if (!fixed) {
        const up = button(this, rx + rw - 110, y + rowH / 2, 180, Math.min(56, rowH - 14), '', () => {
          const cost = upgradeCost(id);
          if (run.incense < cost) return;
          run.incense -= cost;
          run.levels[id] = (run.levels[id] ?? 1) + 1;
          bar.refresh();
          refreshAll();
          this.tweens.add({ targets: img, scale: img.scale * 1.2, duration: 120, yoyo: true });
        }, { size: 18, fill: 0x2f6f5a });
        upBtns.push({ id, b: up });
      }
      refreshers.push(refresh);
      refresh();
    });
    const refreshAll = () => {
      refreshers.forEach((r) => r());
      for (const { id, b } of upBtns) {
        const cost = upgradeCost(id);
        b.setLabel(`升級（香火 ${cost}）`).setEnabled(run.incense >= cost);
      }
    };
    refreshAll();

    button(this, rx + rw / 2, H - 60, 280, 72, '出　陣', () => go(this, 'night', { night: n }), { size: 32, fill: 0x8a1b14 });
    fullscreenButton(this);
  }
}
