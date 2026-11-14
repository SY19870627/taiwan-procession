import Phaser from 'phaser';
import { makeFigures } from '../art/figures';
import { makeBackdropTextures, makeTemple } from '../art/backdrop';
import { makeHarbor } from '../art/harbor';
import { makeXinying } from '../art/xinying';
import { makeStageArt } from '../art/stage';
import { makeBaishadun } from '../art/baishadun';
import { CH, playOverride, startChapter } from '../content/chapter';
import { applyMissedPreset4 } from '../content/ch4/missed';
import { run } from '../state';
import { applyBroadcast, skipStray } from '../core/procession';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    makeFigures(this);
    makeBackdropTextures(this);
    makeTemple(this, 'temple_qingling', '青嶺宮');
    makeTemple(this, 'temple_zhuang', '福安宮');
    makeTemple(this, 'temple_huize', '惠澤宮');
    makeHarbor(this);
    makeXinying(this);
    makeStageArt(this);
    // 第四章：四人小轎（粉紅遮雨布）、頭旗、香擔、香燈腳、點心站、牽路仔、拱辰宮的暫代
    makeBaishadun(this);
    // 立繪圖檔在背景載入
    this.scene.launch('assets');
    // 網址加 ?scene=night&n=2 可以直接跳到某個場景（測試用）
    const q = new URLSearchParams(location.search);
    // &full=1：不管試玩版只做到第幾天（playableDays），整章走到底（第四章第 B2 輪已經拿掉 playableDays，不用加也走得到底）
    playOverride.full = q.get('full') === '1';
    // ?proto=stage&id=recall：原型的舊網址，現在等同 ?scene=story&id=recall（播正式演出，看完回標題）
    const jump = q.get('proto') === 'stage' ? 'story' : q.get('scene');
    if (jump) {
      const n = Number(q.get('n') ?? 1);
      // ?ch=dongjin 指定章節
      const ch = q.get('ch');
      if (ch) startChapter(ch);
      // 第四章開發用（截圖）：&preset=missed —— 前幾天當成什麼都沒做（信徒卡全略過、鬼沒帶），「昨日」寫漏掉的化解版
      // 開爐那頁（&epilogue=1）算三天都沒做；其他場景算第 1～n-1 天
      // 截圖用（只有加網址參數才會觸發）：
      //  ?scene=day&ch=baishadun&n=1&preset=missed&sunset=1：第 n 天也當成什麼都沒做，直接跳到那天日落（日落的搞笑版 dayEndMissed 馬上播）
      //  ?scene=trial&n=1&ch=baishadun&preset=missed&fun=1：第一夜頭旗下帶著草鞋丁、真相一句都沒對，自動判一個錯的歸處（判決頁接 N1-2 搞笑）
      const missed = ch === 'baishadun' && q.get('preset') === 'missed';
      const sunset = missed && jump === 'day' && q.get('sunset') === '1';
      const fun = missed && jump === 'trial' && q.get('fun') === '1';
      if (missed) {
        applyMissedPreset4(run, q.get('epilogue') === '1' ? 3 : n - 1, sunset ? n : undefined);
        run.day = n;
      }
      // 第四章語氣重過（截圖，tools/shots-ch4-voice.mjs）：塞進度的參數，只有加網址參數才會觸發，不影響正常遊玩
      if (ch === 'baishadun') voicePreset4(q, n);
      if (fun && !run.held.some((h) => h.id === 'caoxie')) {
        run.held.push({ id: 'caoxie', grudge: 0 });
        run.cases.caoxie ??= { truths: [] };
      }
      // ?scene=cut&kind=boss 看過場（depart／dusk／dawn／boss），看完回標題
      const kind = q.get('kind') ?? 'depart';
      // ?scene=story&id=recall：&text=1 強制播文字版、&beat=3 演出直接停在第 4 拍（截圖、驗收用）
      const beat = q.get('beat') !== null ? Math.max(0, Math.floor(Number(q.get('beat'))) || 0) : undefined;
      // 第四章 jump scare（截圖）：&preset=missed&scare=1
      //  ?scene=trial&n=1&ch=baishadun&preset=missed&scare=1：問歸處一開就播 N1-4 阿婆
      //  ?scene=boss&ch=baishadun&preset=missed&scare=1：開戰過場 mangdu4 直接從 3-13 提燈的那一句開始（燈亮），播完進最後一戰
      // 測試區截圖用（跟 &preset=missed 一樣只有加網址參數才會觸發）
      const scare = ch === 'baishadun' && q.get('preset') === 'missed' && q.get('scare') === '1';
      if (scare && jump === 'boss') {
        this.scene.start('story', { id: CH().finale.story, scare: true, next: { key: 'boss' } });
        return;
      }
      this.scene.start(jump, {
        scare, sunset, fun,
        day: n, night: n, id: q.get('id') ?? (jump === 'story' && q.get('proto') ? 'recall' : 'dusk3'), prologue: q.get('prologue') === '1', kind, title: kind, next: { key: 'title' },
        text: q.get('text') === '1', beat,
        // ?scene=almanac&ch=baishadun&epilogue=1：第四章開爐那頁黃曆（收尾）
        epilogue: q.get('epilogue') === '1',
        // 第四章夜審（截圖）：&ask=lobby 跳過開審前的對話停在大廳；&ask=<案> 直接問那個鬼；再加 &panel=verdicts 直接開判決面板
        ask: ch === 'baishadun' ? q.get('ask') ?? undefined : undefined,
        panel: q.get('panel') ?? undefined,
      });
      return;
    }
    this.scene.start('title');
  }
}

/**
 * 第四章開發用（截圖、驗收；tools/shots-ch4-voice.mjs）：深層連結塞進度。每一個都要自己加網址參數才會動，正常遊玩不會經過。
 *  &bc1=garage            第一天日落傳消息選了哪一個（第二天的事件池跟著換：garage → 冬瓜茶攤的牽路仔 stray2y）
 *  &done=xianzai3,arui3   第三天那幾張信徒卡辦成了（最後一戰人鏈的台詞）
 *  &strayed=stray2y,...   略過了哪幾隻牽路仔（最後一戰水裡的名單）
 *  &held=caoxie,apo       頭旗下帶著的鬼（夜審）
 *  &ending=recall|return|slay  茫渡的結局（開爐那段最後兩句）
 *  &yday=1                「昨日」欄照第 n−1 天實際漏掉的寫（黃曆）
 */
function voicePreset4(q: URLSearchParams, n: number): void {
  const list = (k: string) => (q.get(k) ?? '').split(',').filter(Boolean);
  const bc1 = q.get('bc1');
  const opt = bc1 ? CH().days[1]?.broadcast?.find((o) => o.id === bc1) : undefined;
  if (opt) applyBroadcast(run, 1, opt);
  for (const c of list('done')) { run.flags[`done_${c}`] = true; run.flags[`helped_${c.replace(/\d+$/, '')}`] = true; } // 跟 believers.ts did() 一樣：辦成也記 helped（人鏈）
  for (const id of list('strayed')) skipStray(run, id);
  for (const id of list('held')) {
    if (!CH().cases[id] || run.held.some((h) => h.id === id)) continue;
    run.held.push({ id, grudge: 0 });
    run.cases[id] ??= { truths: [] };
  }
  const end = q.get('ending');
  if (end === 'recall' || end === 'return' || end === 'slay') run.shijuEnd = end;
  if (q.get('yday') === '1' && n > 1) run.yesterday = CH().dawn(run, n - 1);
}
