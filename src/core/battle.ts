/**
 * 夜晚斬妖的戰鬥模擬（純邏輯，不碰畫面，可以在測試裡直接跑）。
 *
 * 一條橫向戰線：神轎在中間（或偏左），陣頭站在神轎兩側固定位置，
 * 妖怪從左右兩端往神轎走，遇到陣頭就停下來打，沒有陣頭擋就打神轎。
 * 全程自動戰鬥，玩家只能放兩個法術：天令（範圍雷擊）、淨符（回復）。
 */
import { ENEMIES, UNITS, type EnemyId, type UnitId } from './units';
import type { PalanquinStats, UnitStats } from './upgrades';

export type NightMode = 'patrol' | 'defend' | 'boss';
export type Side = -1 | 1;

export interface Spawn {
  /** 第幾秒開始出現 */
  t: number;
  enemy: EnemyId;
  side: Side;
  count: number;
  /** 同一批之間的間隔（秒） */
  gap: number;
}

export interface BattleSetup {
  mode: NightMode;
  /** 戰場寬度（像素） */
  fieldW: number;
  /** 夜晚長度（秒），撐到這個時間就天亮 */
  duration: number;
  spawns: Spawn[];
  /** 陣頭：數值由 core/upgrades.ts 算好再傳進來 */
  units: { id: UnitId; side: Side; stats: UnitStats }[];
  palanquin: PalanquinStats;
  followers: number;
  morale: number;
  incense: number;
  intel: { quakeTip?: boolean; bellyWound?: boolean; longBreath?: boolean };
  /** 亂數種子（測試用，可重現） */
  seed?: number;
}

export interface Fighter {
  uid: number;
  team: 'unit' | 'enemy';
  id: UnitId | EnemyId;
  name: string;
  side: Side;
  x: number;
  hp: number;
  maxHp: number;
  atk: number;
  range: number;
  cd: number;
  timer: number;
  aoe: number;
  /** 七爺八爺：捉拿門檻（剩多少血以下） */
  capture: number;
  /** 受到傷害的倍率（八將的架勢） */
  guard: number;
  alive: boolean;
  /** 動作狀態（畫面用） */
  state: 'idle' | 'walk' | 'fight' | 'charge' | 'breath' | 'retreat';
  /** 0–1，被打到時閃一下 */
  flash: number;
  /** 魔王用：下一次衝鋒倒數 */
  chargeIn?: number;
  stateTime?: number;
  chargeHit?: Set<number>;
}

export type BattleEvent =
  | { type: 'hit'; uid: number; x: number; dmg: number; weak?: boolean }
  | { type: 'shot'; fromX: number; toX: number; kind: 'firecracker' | 'flag' }
  | { type: 'quake'; x: number; r: number }
  | { type: 'capture'; uid: number; x: number }
  | { type: 'die'; uid: number; x: number }
  | { type: 'spawn'; uid: number }
  | { type: 'smite'; x: number; r: number }
  | { type: 'bless' }
  | { type: 'palanquin'; dmg: number }
  | { type: 'charge'; uid: number }
  | { type: 'breath'; uid: number }
  | { type: 'end'; result: 'win' | 'lose' };

export const SMITE_COST = 15;
export const BLESS_COST = 10;

export class Battle {
  readonly setup: BattleSetup;
  t = 0;
  result: 'win' | 'lose' | null = null;
  fighters: Fighter[] = [];
  palanquin: { x: number; hp: number; maxHp: number; flash: number };
  captured = 0;
  incense: number;
  events: BattleEvent[] = [];
  private uidSeq = 1;
  private bossSpawned = false;
  private spawnQueue: { t: number; enemy: EnemyId; side: Side }[] = [];
  private rng: () => number;

  constructor(setup: BattleSetup) {
    this.setup = setup;
    this.incense = setup.incense;
    let s = setup.seed ?? Math.floor(Math.random() * 1e9);
    this.rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const px = setup.mode === 'patrol' ? setup.fieldW * 0.42 : setup.fieldW / 2;
    this.palanquin = { x: px, hp: setup.palanquin.hp, maxHp: setup.palanquin.hp, flash: 0 };
    this.placeUnits();
    for (const sp of setup.spawns) {
      for (let i = 0; i < sp.count; i++) this.spawnQueue.push({ t: sp.t + i * sp.gap, enemy: sp.enemy, side: sp.side });
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);
  }

  /** 陣頭依布陣站在神轎兩側：每邊依序往外排 */
  private placeUnits(): void {
    const order: UnitId[] = ['bajiang', 'qiye', 'shiju', 'xingshi', 'kaijiang', 'paoshou'];
    const bySide: Record<string, number> = { '-1': 0, '1': 0 };
    const sorted = [...this.setup.units].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    for (const u of sorted) {
      const def = UNITS[u.id];
      const st = u.stats;
      const i = bySide[u.side]++;
      // 鞭炮組站在神轎旁邊往外射，近戰站外圈
      const dist = u.id === 'paoshou' ? 70 : 150 + i * 85;
      this.fighters.push({
        uid: this.uidSeq++, team: 'unit', id: u.id, name: def.name, side: u.side,
        x: this.palanquin.x + u.side * dist,
        hp: st.hp, maxHp: st.hp,
        atk: st.atk, range: st.range, cd: st.cd * this.cdMul(), timer: this.rng() * st.cd,
        aoe: st.aoe, capture: st.capture, guard: st.guard, alive: true, state: 'idle', flash: 0,
      });
    }
  }

  private cdMul(): number {
    return 1.25 - this.setup.morale / 200;
  }

  get units(): Fighter[] {
    return this.fighters.filter((f) => f.team === 'unit');
  }

  get enemies(): Fighter[] {
    return this.fighters.filter((f) => f.team === 'enemy');
  }

  get boss(): Fighter | undefined {
    return this.fighters.find((f) => f.id === 'boss');
  }

  /** 夜晚進度 0–1（畫面上的時鐘） */
  get progress(): number {
    return Math.min(1, this.t / this.setup.duration);
  }

  private spawn(enemy: EnemyId, side: Side): void {
    const def = ENEMIES[enemy];
    const isBoss = enemy === 'boss';
    const f: Fighter = {
      uid: this.uidSeq++, team: 'enemy', id: enemy, name: def.name, side,
      x: side === -1 ? -40 : this.setup.fieldW + 40,
      hp: def.hp, maxHp: def.hp, atk: def.atk, range: def.range, cd: def.cd, timer: def.cd * this.rng(),
      aoe: 0, capture: 0, guard: 1, alive: true, state: 'walk', flash: 0,
    };
    if (isBoss) {
      this.bossSpawned = true;
      f.chargeIn = 7;
      f.chargeHit = new Set();
    }
    this.fighters.push(f);
    this.events.push({ type: 'spawn', uid: f.uid });
  }

  step(dt: number): void {
    if (this.result) return;
    this.t += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].t <= this.t) {
      const s = this.spawnQueue.shift()!;
      this.spawn(s.enemy, s.side);
    }
    for (const f of this.fighters) {
      f.flash = Math.max(0, f.flash - dt * 4);
      if (!f.alive) continue;
      if (f.team === 'unit') this.stepUnit(f, dt);
      else if (f.id === 'boss') this.stepBoss(f, dt);
      else this.stepEnemy(f, dt);
    }
    this.palanquin.flash = Math.max(0, this.palanquin.flash - dt * 4);
    this.fighters = this.fighters.filter((f) => f.alive || f.flash > 0);
    this.checkEnd();
  }

  private checkEnd(): void {
    if (this.palanquin.hp <= 0) {
      this.palanquin.hp = 0;
      return this.finish('lose');
    }
    const mode = this.setup.mode;
    if (mode === 'boss') {
      const b = this.boss;
      // 石駒的煞氣被清空（被喚回）就贏
      if (this.bossSpawned && (!b || !b.alive)) return this.finish('win');
      if (this.t >= this.setup.duration) return this.finish('lose');
    } else if (this.t >= this.setup.duration) {
      this.finish('win');
    }
  }

  private finish(r: 'win' | 'lose'): void {
    this.result = r;
    this.events.push({ type: 'end', result: r });
  }

  // ---------- 陣頭 ----------
  private stepUnit(u: Fighter, dt: number): void {
    u.timer -= dt;
    const target = this.nearestEnemy(u.x, u.range);
    u.state = target ? 'fight' : 'idle';
    if (!target || u.timer > 0) return;
    u.timer = u.cd;
    const id = u.id as UnitId;
    const def = UNITS[id];
    if (id === 'paoshou' || id === 'kaijiang') {
      this.events.push({ type: 'shot', fromX: u.x, toX: target.x, kind: id === 'paoshou' ? 'firecracker' : 'flag' });
      this.area(target.x, u.aoe, u.atk, u);
      return;
    }
    if (def.trait === 'quake') {
      this.events.push({ type: 'quake', x: target.x, r: u.aoe });
      this.area(target.x, u.aoe, u.atk, u);
      return;
    }
    if (def.trait === 'charge') {
      this.area(target.x, u.aoe, u.atk, u);
      this.events.push({ type: 'quake', x: target.x, r: u.aoe });
      return;
    }
    this.damage(target, u.atk, u);
  }

  private nearestEnemy(x: number, range: number): Fighter | undefined {
    let best: Fighter | undefined;
    let bd = Infinity;
    for (const e of this.fighters) {
      if (e.team !== 'enemy' || !e.alive) continue;
      const d = Math.abs(e.x - x);
      if (d <= range && d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  private area(x: number, r: number, dmg: number, src: Fighter): void {
    for (const e of this.fighters) {
      if (e.team === 'enemy' && e.alive && Math.abs(e.x - x) <= Math.max(r, 20)) this.damage(e, dmg, src);
    }
  }

  private damage(e: Fighter, raw: number, src?: Fighter): void {
    const def = ENEMIES[e.id as EnemyId];
    let mul = def.armor;
    let weak = false;
    if (src && UNITS[src.id as UnitId]?.trait === 'quake') {
      mul *= def.quakeWeak;
      if (e.id === 'kui' && this.setup.intel.quakeTip) mul *= 1.5;
    }
    if (e.id === 'boss' && e.state === 'breath') {
      mul = this.setup.intel.bellyWound ? 2.4 : 1.4;
      weak = true;
    }
    const dmg = raw * mul;
    e.hp -= dmg;
    e.flash = 1;
    this.events.push({ type: 'hit', uid: e.uid, x: e.x, dmg: Math.round(dmg), weak });
    // 七爺八爺：打到虛弱就捉拿
    if (src && src.capture > 0 && def.capturable && e.hp > 0 && e.hp <= e.maxHp * src.capture) {
      e.alive = false;
      this.captured++;
      this.events.push({ type: 'capture', uid: e.uid, x: e.x });
      return;
    }
    if (e.hp <= 0) {
      e.alive = false;
      this.events.push({ type: 'die', uid: e.uid, x: e.x });
    }
  }

  // ---------- 妖怪 ----------
  /** 妖怪往神轎走的路上，第一個擋路的陣頭 */
  private blocker(e: Fighter): Fighter | undefined {
    let best: Fighter | undefined;
    let bd = Infinity;
    for (const u of this.fighters) {
      if (u.team !== 'unit' || !u.alive || u.side !== e.side) continue;
      // 在妖怪和神轎之間（含已經被妖怪走過頭一點點的）
      const between = e.side === -1 ? u.x >= e.x - 10 && u.x <= this.palanquin.x : u.x <= e.x + 10 && u.x >= this.palanquin.x;
      if (!between) continue;
      const d = Math.abs(u.x - e.x);
      if (d < bd) {
        bd = d;
        best = u;
      }
    }
    return best;
  }

  private stepEnemy(e: Fighter, dt: number): void {
    e.timer -= dt;
    const def = ENEMIES[e.id as EnemyId];
    const b = this.blocker(e);
    const dir = e.side === -1 ? 1 : -1;
    if (b && Math.abs(b.x - e.x) <= e.range + 18) {
      e.state = 'fight';
      if (e.timer <= 0) {
        e.timer = e.cd;
        this.hurtUnit(b, e.atk);
      }
      return;
    }
    const toP = Math.abs(this.palanquin.x - e.x);
    if (!b && toP <= e.range + 46) {
      e.state = 'fight';
      if (e.timer <= 0) {
        e.timer = e.cd;
        this.hurtPalanquin(e.atk);
      }
      return;
    }
    e.state = 'walk';
    e.x += dir * def.speed * dt;
  }

  private hurtUnit(u: Fighter, raw: number): void {
    const dmg = raw * u.guard;
    u.hp -= dmg;
    u.flash = 1;
    this.events.push({ type: 'hit', uid: u.uid, x: u.x, dmg: Math.round(dmg) });
    if (u.hp <= 0) {
      u.alive = false;
      this.events.push({ type: 'die', uid: u.uid, x: u.x });
    }
  }

  private hurtPalanquin(dmg: number): void {
    this.palanquin.hp -= dmg;
    this.palanquin.flash = 1;
    this.events.push({ type: 'palanquin', dmg: Math.round(dmg) });
  }

  // ---------- 魔王：石駒 ----------
  private stepBoss(b: Fighter, dt: number): void {
    b.stateTime = (b.stateTime ?? 0) + dt;
    const dir = b.side === -1 ? 1 : -1;
    const home = b.side === -1 ? 90 : this.setup.fieldW - 90;
    if (b.state === 'charge') {
      b.x += dir * 430 * dt;
      for (const u of this.fighters) {
        if (u.team === 'unit' && u.alive && !b.chargeHit!.has(u.uid) && Math.abs(u.x - b.x) < 30) {
          b.chargeHit!.add(u.uid);
          this.hurtUnit(u, b.atk * 1.4);
        }
      }
      if (Math.abs(this.palanquin.x - b.x) < 70) {
        this.hurtPalanquin(b.atk * 1.2);
        b.state = 'breath';
        b.stateTime = 0;
        this.events.push({ type: 'breath', uid: b.uid });
      }
      return;
    }
    if (b.state === 'breath') {
      const len = this.setup.intel.longBreath ? 5 : 3;
      if (b.stateTime >= len) {
        b.state = 'retreat';
        b.stateTime = 0;
      }
      return;
    }
    if (b.state === 'retreat') {
      b.x -= dir * 150 * dt;
      if ((dir === 1 && b.x <= home) || (dir === -1 && b.x >= home)) {
        b.state = 'walk';
        b.stateTime = 0;
        b.chargeIn = 8;
      }
      return;
    }
    // 走路或近身打：倒數到了就衝鋒
    b.chargeIn = (b.chargeIn ?? 8) - dt;
    if (b.chargeIn <= 0 && Math.abs(this.palanquin.x - b.x) > 160) {
      b.state = 'charge';
      b.stateTime = 0;
      b.chargeHit = new Set();
      this.events.push({ type: 'charge', uid: b.uid });
      return;
    }
    this.stepEnemy(b, dt);
  }

  // ---------- 玩家法術 ----------
  canSmite(): boolean {
    return !this.result && this.incense >= SMITE_COST && this.enemies.some((e) => e.alive);
  }

  /** 天令：在妖怪最密集（離神轎最近）的地方降下雷擊 */
  smite(): boolean {
    if (!this.canSmite()) return false;
    const alive = this.enemies.filter((e) => e.alive);
    const target = alive.reduce((a, e) => (Math.abs(e.x - this.palanquin.x) < Math.abs(a.x - this.palanquin.x) ? e : a));
    this.incense -= SMITE_COST;
    const r = 130;
    this.events.push({ type: 'smite', x: target.x, r });
    for (const e of alive) if (Math.abs(e.x - target.x) <= r) this.damage(e, this.setup.palanquin.smite);
    return true;
  }

  canBless(): boolean {
    return !this.result && this.incense >= BLESS_COST;
  }

  /** 淨符：神轎回復 25%，陣頭回復 35% */
  bless(): boolean {
    if (!this.canBless()) return false;
    this.incense -= BLESS_COST;
    this.palanquin.hp = Math.min(this.palanquin.maxHp, this.palanquin.hp + this.palanquin.maxHp * this.setup.palanquin.bless);
    for (const u of this.units) if (u.alive) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * (this.setup.palanquin.bless + 0.1));
    this.events.push({ type: 'bless' });
    return true;
  }

  drainEvents(): BattleEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
