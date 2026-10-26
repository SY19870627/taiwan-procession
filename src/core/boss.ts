/**
 * 最後一戰：喚回石駒（純邏輯，不碰畫面，可以在測試裡直接跑）。
 *
 * 一條戰線：神轎在左，石駒和小妖從右邊來。
 * 陣頭分前排（最多 3 個）和後排：
 *  - 前排：近戰會出手，也會挨打。石駒打前排第一個，小妖分散打前排。
 *  - 後排：不挨打；近戰在後排慢慢回血；遠程、輔助在後排照常出手。
 *  - 換位要走 2 秒，走路時不能出手。前排沒人，妖怪就直接打神轎。
 * 石駒的節奏：近身纏鬥 → 退開刨地（預告 2.5 秒）→ 衝鋒撞前排所有人 → 喘息（這時打肚子傷害大增）。
 * 煞氣打到 70%、40%、10% 時暫停，進入陣前審問（由畫面處理，結果用 answer() 告訴戰鬥）。
 */
import { ENEMIES, type EnemyId } from './units';

export type Row = 'front' | 'back';
export type Role = 'melee' | 'ranged' | 'support';

export interface MemberStats {
  key: string;
  name: string;
  role: Role;
  hp: number;
  atk: number;
  /** 出手間隔（秒） */
  cd: number;
  /** 攻擊距離（遠程用） */
  range: number;
  /** 範圍半徑 */
  aoe: number;
  /** 受到傷害的倍率 */
  guard: number;
  /** 特色 */
  trait?: 'chain' | 'block' | 'quake' | 'slow' | 'haste' | 'heal' | 'frost';
}

/** 超渡亡魂後增加的技能（劇情上是王爺的神威增長） */
export type SkillId = 'huichun' | 'hanshuang' | 'zhensha';

export const SKILLS: Record<SkillId, { name: string; cd: number; desc: string }> = {
  huichun: { name: '回春符', cd: 30, desc: '全隊陣頭回 35% 血，神轎回 10%' },
  hanshuang: { name: '寒霜令', cd: 35, desc: '小妖全部定住 4 秒；石駒出手變慢' },
  zhensha: { name: '鎮煞鈴', cd: 40, desc: '石駒刨地或衝鋒時搖鈴，打斷牠，直接喘息' },
};

export interface BossSetup {
  members: { stats: MemberStats; row: Row }[];
  palanquin: { hp: number; smite: number; bless: number };
  boss: { hpMul: number; atkMul: number; chargeEvery: number; skipCharges: number };
  /** 知道肚子的舊傷：喘息時傷害大增 */
  bellyWound: boolean;
  /** 多出來的小妖波數 */
  extraWaves: number;
  /** 超渡換來的技能 */
  skills: SkillId[];
  duration: number;
  seed?: number;
}

export interface Unit {
  uid: number;
  key: string;
  name: string;
  role: Role;
  trait?: MemberStats['trait'];
  row: Row;
  /** 換位中：走到 targetRow，剩幾秒 */
  moving: number;
  targetRow: Row;
  /** 前排的順序（0 是最前面，石駒打這個） */
  slot: number;
  x: number;
  hp: number;
  maxHp: number;
  atk: number;
  cd: number;
  range: number;
  aoe: number;
  guard: number;
  timer: number;
  hits: number;
  alive: boolean;
  flash: number;
}

export interface Enemy {
  uid: number;
  id: EnemyId;
  x: number;
  hp: number;
  maxHp: number;
  atk: number;
  cd: number;
  timer: number;
  speed: number;
  armor: number;
  stun: number;
  slow: number;
  /** 小妖鎖定的前排陣頭 */
  target?: number;
  alive: boolean;
  flash: number;
  state: 'walk' | 'fight' | 'back' | 'paw' | 'charge' | 'breath';
  stateTime: number;
}

export type BossEvent =
  | { type: 'hit'; x: number; dmg: number; weak?: boolean; ally?: boolean }
  | { type: 'shot'; fromX: number; toX: number; kind: 'firecracker' | 'flag' }
  | { type: 'quake'; x: number; r: number }
  | { type: 'chain'; fromX: number; toX: number }
  | { type: 'block'; x: number }
  | { type: 'heal'; x: number; amount: number }
  | { type: 'die'; x: number; ally: boolean; name?: string }
  | { type: 'paw' }
  | { type: 'charge' }
  | { type: 'breath' }
  | { type: 'callout' }
  | { type: 'smite'; x: number; r: number }
  | { type: 'bless' }
  | { type: 'palanquin'; dmg: number }
  | { type: 'trial'; round: number }
  | { type: 'skill'; id: SkillId }
  | { type: 'end'; result: 'subdued' | 'lose' | 'dawn' };

export const SMITE_CD = 15;
export const BLESS_CD = 25;
export const FRONT_MAX = 3;
export const MOVE_TIME = 2;
export const PAL_X = 180;
/** 前排位置（0 最前面） */
export const FRONT_X = [640, 585, 530];
/** 後排位置 */
export const BACK_X = [430, 380, 330, 280, 240, 400, 350];
const HOME_X = 1060;
const TRIAL_AT = [0.7, 0.4, 0.1];

export class BossBattle {
  readonly setup: BossSetup;
  t = 0;
  result: 'subdued' | 'lose' | 'dawn' | null = null;
  units: Unit[] = [];
  enemies: Enemy[] = [];
  boss!: Enemy;
  palanquin: { x: number; hp: number; maxHp: number; flash: number };
  smiteCd = 0;
  blessCd = 0;
  /** 超渡技能的冷卻 */
  skillCd: Partial<Record<SkillId, number>> = {};
  /** 陣前審問暫停中 */
  paused = false;
  trialRound = 0;
  /** 審問結果造成的修正 */
  mods = { armor: 1, atk: 1, skip: 0 };
  events: BossEvent[] = [];
  private uidSeq = 1;
  private spawnQueue: { t: number; enemy: EnemyId }[] = [];
  private rng: () => number;

  constructor(setup: BossSetup) {
    this.setup = setup;
    let s = setup.seed ?? Math.floor(Math.random() * 1e9);
    this.rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    this.palanquin = { x: PAL_X, hp: setup.palanquin.hp, maxHp: setup.palanquin.hp, flash: 0 };
    const haste = setup.members.some((m) => m.stats.trait === 'haste') ? 0.85 : 1;
    for (const m of setup.members) {
      const st = m.stats;
      this.units.push({
        uid: this.uidSeq++, key: st.key, name: st.name, role: st.role, trait: st.trait,
        row: m.row, targetRow: m.row, moving: 0, slot: 0, x: 0,
        hp: st.hp, maxHp: st.hp, atk: st.atk, cd: st.cd * 0.95 * (st.trait === 'haste' ? 1 : haste), range: st.range, aoe: st.aoe, guard: st.guard,
        timer: this.rng() * st.cd, hits: 0, alive: true, flash: 0,
      });
    }
    this.layout();
    // 石駒
    const bd = ENEMIES.boss;
    const bhp = Math.round(bd.hp * setup.boss.hpMul);
    this.boss = this.makeEnemy('boss');
    this.boss.hp = this.boss.maxHp = bhp;
    this.boss.atk = bd.atk * setup.boss.atkMul;
    this.boss.x = 1340;
    this.mods.skip = setup.boss.skipCharges;
    this.enemies.push(this.boss);
    // 小妖：固定波次＋多出來的波次
    const waves: [number, EnemyId, number, number][] = [
      [3, 'wang', 3, 1.6], [16, 'mei', 3, 1.0], [30, 'kui', 2, 3], [44, 'wang', 4, 1.4],
      [60, 'mei', 4, 0.9], [76, 'kui', 2, 3], [92, 'wang', 5, 1.2], [110, 'mei', 4, 0.9], [128, 'kui', 2, 3],
    ];
    for (let i = 0; i < setup.extraWaves; i++) {
      waves.push([10 + i * 17, 'wang', 4, 1.0], [18 + i * 17, 'mei', 3, 0.8]);
    }
    for (const [t, e, n, gap] of waves) for (let k = 0; k < n; k++) this.spawnQueue.push({ t: t + k * gap, enemy: e });
    this.spawnQueue.sort((a, b) => a.t - b.t);
  }

  private makeEnemy(id: EnemyId): Enemy {
    const d = ENEMIES[id];
    return {
      uid: this.uidSeq++, id, x: 1320 + this.rng() * 40, hp: d.hp, maxHp: d.hp, atk: d.atk, cd: d.cd, timer: d.cd * this.rng(),
      speed: d.speed, armor: d.armor, stun: 0, slow: 0, alive: true, flash: 0, state: 'walk', stateTime: 0,
    };
  }

  // ---------- 陣形 ----------
  get front(): Unit[] {
    return this.units.filter((u) => u.alive && u.row === 'front' && u.moving <= 0).sort((a, b) => a.slot - b.slot);
  }

  get back(): Unit[] {
    return this.units.filter((u) => u.alive && u.row === 'back' && u.moving <= 0);
  }

  /** 前排的人數（含正在走上去的） */
  frontCount(): number {
    return this.units.filter((u) => u.alive && (u.moving > 0 ? u.targetRow === 'front' : u.row === 'front')).length;
  }

  /** 依前後排重新站位 */
  private layout(): void {
    const fr = this.units.filter((u) => u.alive && u.row === 'front').sort((a, b) => a.slot - b.slot);
    fr.forEach((u, i) => { u.slot = i; if (u.moving <= 0) u.x = FRONT_X[i] ?? FRONT_X[FRONT_X.length - 1]; });
    const bk = this.units.filter((u) => u.alive && u.row === 'back');
    bk.forEach((u, i) => { u.slot = 99; if (u.moving <= 0) u.x = BACK_X[i % BACK_X.length]; });
  }

  /** 玩家點卡片：換到前排或後排（前排滿了就不行） */
  canSwap(uid: number): boolean {
    const u = this.units.find((x) => x.uid === uid);
    if (!u || !u.alive || u.moving > 0 || this.result || this.paused) return false;
    if (u.row === 'back') return this.frontCount() < FRONT_MAX;
    return true;
  }

  swap(uid: number): boolean {
    if (!this.canSwap(uid)) return false;
    const u = this.units.find((x) => x.uid === uid)!;
    u.targetRow = u.row === 'front' ? 'back' : 'front';
    u.moving = MOVE_TIME;
    if (u.targetRow === 'front') u.slot = 50 + this.t; // 排到前排最後面
    return true;
  }

  // ---------- 每幀 ----------
  step(dt: number): void {
    if (this.result || this.paused) return;
    this.t += dt;
    this.smiteCd = Math.max(0, this.smiteCd - dt);
    this.blessCd = Math.max(0, this.blessCd - dt);
    for (const k of Object.keys(this.skillCd) as SkillId[]) this.skillCd[k] = Math.max(0, (this.skillCd[k] ?? 0) - dt);
    while (this.spawnQueue.length && this.spawnQueue[0].t <= this.t) {
      this.enemies.push(this.makeEnemy(this.spawnQueue.shift()!.enemy));
    }
    // 換位走路
    for (const u of this.units) {
      u.flash = Math.max(0, u.flash - dt * 4);
      if (!u.alive || u.moving <= 0) continue;
      const goal = u.targetRow === 'front' ? FRONT_X[Math.min(FRONT_MAX - 1, this.front.length)] : BACK_X[0];
      u.x += (goal - u.x) * Math.min(1, dt * 2.5);
      u.moving -= dt;
      if (u.moving <= 0) {
        u.moving = 0;
        u.row = u.targetRow;
        if (u.row === 'front') u.slot = 50 + this.t;
        this.layout();
      }
    }
    for (const u of this.units) if (u.alive && u.moving <= 0) this.stepUnit(u, dt);
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt * 4);
      if (!e.alive) continue;
      if (e === this.boss) this.stepBoss(e, dt);
      else this.stepEnemy(e, dt);
    }
    this.palanquin.flash = Math.max(0, this.palanquin.flash - dt * 4);
    this.enemies = this.enemies.filter((e) => e.alive || e.flash > 0 || e === this.boss);
    this.checkTrial();
    this.checkEnd();
  }

  private checkTrial(): void {
    if (this.trialRound >= TRIAL_AT.length) return;
    if (this.boss.hp <= this.boss.maxHp * TRIAL_AT[this.trialRound]) {
      this.trialRound++;
      this.paused = true;
      this.events.push({ type: 'trial', round: this.trialRound });
    }
  }

  /** 陣前審問的結果 */
  answer(round: number, ok: boolean): void {
    if (ok) {
      if (round === 1) this.mods.armor = 1.15;
      if (round === 2) { this.mods.skip++; this.mods.atk *= 0.85; }
    } else {
      this.mods.atk *= 1.1;
    }
    this.paused = false;
  }

  private checkEnd(): void {
    if (this.palanquin.hp <= 0) {
      this.palanquin.hp = 0;
      return this.finish('lose');
    }
    if (this.boss.hp <= 0) {
      this.boss.hp = 0;
      return this.finish('subdued');
    }
    if (this.t >= this.setup.duration) this.finish('dawn');
  }

  private finish(r: 'subdued' | 'lose' | 'dawn'): void {
    this.result = r;
    this.events.push({ type: 'end', result: r });
  }

  get progress(): number {
    return Math.min(1, this.t / this.setup.duration);
  }

  // ---------- 陣頭 ----------
  private stepUnit(u: Unit, dt: number): void {
    // 近戰在後排：喘口氣，慢慢回血
    if (u.row === 'back' && u.role === 'melee') {
      u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.06 * dt);
      return;
    }
    u.timer -= dt;
    if (u.timer > 0) return;
    if (u.trait === 'heal') {
      // 護嬰娘：照顧血最少的陣頭
      const hurt = this.units.filter((x) => x.alive && x.hp < x.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      u.timer = u.cd;
      if (hurt) {
        const amt = Math.min(hurt.maxHp - hurt.hp, u.atk);
        hurt.hp += amt;
        this.events.push({ type: 'heal', x: hurt.x, amount: Math.round(amt) });
      }
      return;
    }
    const reach = u.role === 'melee' ? u.x + u.range : u.x + u.range;
    const target = this.nearestEnemy(u.x, reach);
    if (!target) return;
    u.timer = u.cd;
    u.hits++;
    if (u.role === 'ranged' || u.trait === 'frost') {
      this.events.push({ type: 'shot', fromX: u.x, toX: target.x, kind: u.trait === 'haste' ? 'flag' : 'firecracker' });
      const hit = this.area(target.x, u.aoe, u.atk);
      if (u.trait === 'slow' || u.trait === 'frost') for (const e of hit) if (e !== this.boss) e.slow = u.trait === 'frost' ? 4 : 2;
      return;
    }
    if (u.trait === 'quake') {
      this.events.push({ type: 'quake', x: target.x, r: u.aoe });
      for (const e of this.area(target.x, u.aoe, u.atk, 'quake')) {
        if (e === this.boss || !e.alive) continue;
        e.x += 30;
        e.stun = Math.max(e.stun, 0.4);
      }
      return;
    }
    if (u.trait === 'chain' && u.hits % 4 === 0) {
      // 勾魂鎖：把遠處的小妖拉過來定身
      const far = this.enemies.filter((e) => e.alive && e !== this.boss && e.x > u.x + 120).sort((a, b) => b.x - a.x)[0];
      if (far) {
        this.events.push({ type: 'chain', fromX: u.x, toX: far.x });
        far.x = u.x + 40;
        far.stun = 1.5;
        this.damage(far, u.atk);
        return;
      }
    }
    if (u.trait === 'block') {
      this.area(target.x, 45, u.atk);
      return;
    }
    this.damage(target, u.atk);
  }

  private nearestEnemy(x: number, reach: number): Enemy | undefined {
    let best: Enemy | undefined;
    for (const e of this.enemies) {
      if (!e.alive || e.x > reach || e.x < x - 40) continue;
      if (!best || e.x < best.x) best = e;
    }
    return best;
  }

  private area(x: number, r: number, dmg: number, kind?: 'quake'): Enemy[] {
    const hit: Enemy[] = [];
    for (const e of this.enemies) {
      if (e.alive && Math.abs(e.x - x) <= Math.max(r, 24)) {
        hit.push(e);
        this.damage(e, dmg, kind);
      }
    }
    return hit;
  }

  private damage(e: Enemy, raw: number, kind?: 'quake'): void {
    let mul = e.armor;
    let weak = false;
    if (kind === 'quake') mul *= ENEMIES[e.id].quakeWeak;
    if (e === this.boss) {
      mul *= this.mods.armor;
      if (e.state === 'breath') {
        mul = (this.setup.bellyWound ? 1.8 : 1.2) * this.mods.armor;
        weak = true;
      }
    }
    const dmg = raw * mul;
    e.hp -= dmg;
    e.flash = 1;
    this.events.push({ type: 'hit', x: e.x, dmg: Math.round(dmg), weak });
    if (e.hp <= 0 && e !== this.boss) {
      e.alive = false;
      this.events.push({ type: 'die', x: e.x, ally: false });
    }
  }

  // ---------- 妖怪 ----------
  private frostAura(): number {
    return this.units.some((u) => u.alive && u.trait === 'frost') ? 1.25 : 1;
  }

  private stepEnemy(e: Enemy, dt: number): void {
    e.slow = Math.max(0, e.slow - dt);
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    const front = this.front;
    e.timer -= dt;
    if (front.length) {
      let t = front.find((u) => u.uid === e.target);
      if (!t) {
        t = front[Math.floor(this.rng() * front.length)];
        e.target = t.uid;
      }
      if (e.x - t.x <= ENEMIES[e.id].range + 30) {
        e.state = 'fight';
        if (e.timer <= 0) {
          e.timer = e.cd * this.frostAura();
          this.hurt(t, e.atk);
        }
        return;
      }
    } else if (e.x - this.palanquin.x <= ENEMIES[e.id].range + 50) {
      e.state = 'fight';
      if (e.timer <= 0) {
        e.timer = e.cd * this.frostAura();
        this.hurtPalanquin(e.atk);
      }
      return;
    }
    e.state = 'walk';
    e.x -= e.speed * (e.slow > 0 ? 0.55 : 1) * dt;
  }

  private hurt(u: Unit, raw: number): void {
    if (u.trait === 'block' && this.rng() < 0.25) {
      this.events.push({ type: 'block', x: u.x });
      return;
    }
    const dmg = raw * u.guard;
    u.hp -= dmg;
    u.flash = 1;
    this.events.push({ type: 'hit', x: u.x, dmg: Math.round(dmg), ally: true });
    if (u.hp <= 0) {
      u.hp = 0;
      u.alive = false;
      this.events.push({ type: 'die', x: u.x, ally: true, name: u.name });
      this.layout();
    }
  }

  private hurtPalanquin(dmg: number): void {
    this.palanquin.hp -= dmg;
    this.palanquin.flash = 1;
    this.events.push({ type: 'palanquin', dmg: Math.round(dmg) });
  }

  // ---------- 石駒 ----------
  private bossAtk(): number {
    return this.boss.atk * this.mods.atk;
  }

  private stepBoss(b: Enemy, dt: number): void {
    b.stateTime += dt;
    const lineX = (this.front[0]?.x ?? this.palanquin.x) + 50;
    switch (b.state) {
      case 'walk':
      case 'fight': {
        // 近身纏鬥，時間到了退開準備衝鋒
        if (b.x > lineX) {
          b.state = 'walk';
          b.x = Math.max(lineX, b.x - b.speed * dt * 1.5);
        } else {
          if (b.state === 'walk') b.stateTime = 0;
          b.state = 'fight';
          b.timer -= dt;
          if (b.timer <= 0) {
            b.timer = b.cd * this.frostAura();
            const t = this.front[0];
            if (t) this.hurt(t, this.bossAtk());
            else this.hurtPalanquin(this.bossAtk());
          }
        }
        if (b.stateTime >= this.setup.boss.chargeEvery && b.x <= lineX + 5) {
          b.state = 'back';
          b.stateTime = 0;
        }
        return;
      }
      case 'back':
        b.x += 260 * dt;
        if (b.x >= HOME_X) {
          b.state = 'paw';
          b.stateTime = 0;
          this.events.push({ type: 'paw' });
        }
        return;
      case 'paw':
        // 刨地：預告衝鋒，給玩家時間換人
        if (b.stateTime >= 2.5) {
          b.state = 'charge';
          b.stateTime = 0;
          (b as Enemy & { hitSet?: Set<number> }).hitSet = new Set();
          this.events.push({ type: 'charge' });
        }
        return;
      case 'charge': {
        b.x -= 480 * dt;
        if (this.mods.skip > 0 && HOME_X - b.x > 220) {
          // 小芸喊住了牠（或審問讓牠動搖）：衝到一半停下來喘息
          this.mods.skip--;
          b.state = 'breath';
          b.stateTime = 0;
          this.events.push({ type: 'callout' });
          return;
        }
        const hs = (b as Enemy & { hitSet?: Set<number> }).hitSet!;
        for (const u of this.front) {
          if (!hs.has(u.uid) && b.x - u.x < 40) {
            hs.add(u.uid);
            this.hurt(u, this.bossAtk() * 2.2);
          }
        }
        const stopX = (this.front[this.front.length - 1]?.x ?? this.palanquin.x) + 20;
        if (b.x <= stopX) {
          if (!this.front.length) this.hurtPalanquin(this.bossAtk() * 2);
          b.x = Math.max(b.x, this.palanquin.x + 80);
          b.state = 'breath';
          b.stateTime = 0;
          this.events.push({ type: 'breath' });
        }
        return;
      }
      case 'breath':
        if (b.stateTime >= 4) {
          b.state = 'fight';
          b.stateTime = 0;
          b.x = Math.max(b.x, lineX);
        }
        return;
    }
  }

  // ---------- 法術 ----------
  canSmite(): boolean {
    return !this.result && !this.paused && this.smiteCd <= 0;
  }

  /** 天令：打在離神轎最近的那一群妖怪 */
  smite(): boolean {
    if (!this.canSmite()) return false;
    const alive = this.enemies.filter((e) => e.alive);
    if (!alive.length) return false;
    const target = alive.reduce((a, e) => (e.x < a.x ? e : a));
    this.smiteCd = SMITE_CD;
    const r = 140;
    this.events.push({ type: 'smite', x: target.x, r });
    for (const e of alive) if (Math.abs(e.x - target.x) <= r) this.damage(e, this.setup.palanquin.smite);
    return true;
  }

  canBless(): boolean {
    return !this.result && !this.paused && this.blessCd <= 0;
  }

  /** 淨符：神轎與所有陣頭回血 */
  bless(): boolean {
    if (!this.canBless()) return false;
    this.blessCd = BLESS_CD;
    const p = this.setup.palanquin.bless;
    this.palanquin.hp = Math.min(this.palanquin.maxHp, this.palanquin.hp + this.palanquin.maxHp * p);
    for (const u of this.units) if (u.alive) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * (p + 0.1));
    this.events.push({ type: 'bless' });
    return true;
  }

  canSkill(id: SkillId): boolean {
    if (this.result || this.paused || !this.setup.skills.includes(id) || (this.skillCd[id] ?? 0) > 0) return false;
    if (id === 'zhensha') return ['paw', 'charge', 'back'].includes(this.boss.state);
    return true;
  }

  skill(id: SkillId): boolean {
    if (!this.canSkill(id)) return false;
    this.skillCd[id] = SKILLS[id].cd;
    const b = this.boss;
    if (id === 'huichun') {
      for (const u of this.units) if (u.alive) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.35);
      this.palanquin.hp = Math.min(this.palanquin.maxHp, this.palanquin.hp + this.palanquin.maxHp * 0.1);
      this.events.push({ type: 'skill', id });
    }
    if (id === 'hanshuang') {
      for (const e of this.enemies) if (e.alive && e !== b) e.stun = Math.max(e.stun, 4);
      b.timer += 3;
      this.events.push({ type: 'skill', id });
    }
    if (id === 'zhensha') {
      // 鎮煞鈴一響，石駒停下來喘息
      b.state = 'breath';
      b.stateTime = 0;
      b.x = Math.max(b.x, (this.front[0]?.x ?? this.palanquin.x) + 50);
      this.events.push({ type: 'skill', id });
    }
    return true;
  }

  drainEvents(): BossEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
