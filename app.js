const DEFAULT_GCD_SECONDS = 2.5;
const START_TIME_SECONDS = -15;
const MAX_TIME_SECONDS = 20 * 60;
const SLOT_COUNT = Math.ceil((MAX_TIME_SECONDS - START_TIME_SECONDS) / DEFAULT_GCD_SECONDS) + 1;
const ICON_BASE = 'https://ffxiv.gamerescape.com/wiki/Special:Redirect/file/';
const MAJOR_COOLDOWN_IDS = ['drill', 'air-anchor', 'chain-saw', 'barrel-stabilizer', 'wildfire'];

const actions = [
  { id: 'dexterity-potion', cn: '爆发药水', en: 'Grade 3 Gemdraught of Dexterity', level: 1, type: 'ogcd', category: '职业技能', recast: 270, buffDuration: 30, range: '0米', radius: '0米', desc: '视为能力技。使用后获得30秒爆发药效果，时间轴中处于药效窗口内的本体与机器人技能都会高亮。' },
  { id: 'split-shot', hidden: true, cn: '分裂弹', en: 'Split Shot', level: 1, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 140, heat: 5, desc: '对目标发动远距离物理攻击。追加效果：热量 +5。' },
  { id: 'slug-shot', hidden: true, cn: '独头弹', en: 'Slug Shot', level: 2, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, desc: '连击：分裂弹/热分裂弹。连击成功时威力提高并增加热量。' },
  { id: 'hot-shot', hidden: true, cn: '热弹', en: 'Hot Shot', level: 4, type: 'gcd', category: '职业技能', recast: 40, range: '25米', radius: '0米', potency: 240, battery: 20, desc: '不与其他战技共享复唱。追加效果：电量 +20。' },
  { id: 'reassemble', cn: '整备', en: 'Reassemble', level: 10, type: 'ogcd', category: '职业技能', recast: 55, charges: 2, range: '0米', radius: '0米', desc: '令下一个战技必定暴击并直击。最大档数：2。' },
  { id: 'gauss-round', hidden: true, cn: '虹吸弹', en: 'Gauss Round', level: 15, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '0米', potency: 130, desc: '对目标发动远距离物理攻击。最大档数：3。' },
  { id: 'spread-shot', hidden: true, cn: '散射', en: 'Spread Shot', level: 18, type: 'gcd', category: '职业技能', recast: 2.5, range: '12米', radius: '12米', potency: 110, heat: 5, desc: '向目标方向发动扇形范围攻击。追加效果：热量 +5。' },
  { id: 'clean-shot', hidden: true, cn: '狙击弹', en: 'Clean Shot', level: 26, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, battery: 10, desc: '连击：独头弹/热独头弹。连击成功时热量 +5、电量 +10。' },
  { id: 'hypercharge', cn: '超荷', en: 'Hypercharge', level: 30, type: 'ogcd', category: '职业技能', recast: 10, heat: -50, range: '0米', radius: '0米', desc: '消耗50热量，获得5档过热，可执行烈焰弹/自动弩。' },
  { id: 'heat-blast', hidden: true, cn: '热冲击', en: 'Heat Blast', level: 35, type: 'gcd', category: '职业技能', recast: 1.5, range: '25米', radius: '0米', potency: 200, desc: '过热时可用；追加效果：虹吸弹和弹射的复唱时间缩短15秒。' },
  { id: 'rook-autoturret', hidden: true, cn: '车式浮空炮塔', en: 'Rook Autoturret', level: 40, type: 'ogcd', category: '职业技能', recast: 6, battery: -50, range: '0米', radius: '0米', desc: '消耗50电量部署单体炮塔；与后式自走人偶共享用途。' },
  { id: 'rook-overdrive', hidden: true, cn: '超档车式炮塔', en: 'Rook Overdrive', level: 40, type: 'ogcd', category: '职业技能', recast: 15, range: '25米', radius: '0米', desc: '命令车式浮空炮塔执行超负荷。' },
  { id: 'wildfire', cn: '野火', en: 'Wildfire', level: 45, type: 'ogcd', category: '职业技能', recast: 120, range: '25米', radius: '0米', desc: '附加野火；持续结束或起爆时根据期间命中的战技次数造成伤害。' },
  { id: 'detonator', cn: '起爆', en: 'Detonator', level: 45, type: 'ogcd', category: '职业技能', recast: 1, range: '25米', radius: '0米', desc: '提前结束野火并造成伤害。' },
  { id: 'ricochet', hidden: true, cn: '弹射', en: 'Ricochet', level: 50, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '5米', potency: 130, desc: '对目标及周围敌人发动范围攻击。最大档数：3。' },
  { id: 'auto-crossbow', cn: '自动弩', en: 'Auto Crossbow', level: 52, type: 'gcd', category: '职业技能', recast: 1.5, range: '12米', radius: '12米', potency: 140, desc: '过热时可用的扇形范围战技。' },
  { id: 'heated-split-shot', cn: '热分裂弹', en: 'Heated Split Shot', level: 54, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 220, heat: 5, desc: '分裂弹的强化版。追加效果：热量 +5。' },
  { id: 'tactician', cn: '策动', en: 'Tactician', level: 56, type: 'ogcd', category: '职业技能', recast: 90, range: '0米', radius: '30米', desc: '降低自身与周围队员受到的伤害。' },
  { id: 'drill', cn: '钻头', en: 'Drill', level: 58, type: 'gcd', category: '职业技能', recast: 20, charges: 2, range: '25米', radius: '0米', potency: 660, desc: '强力单体战技；拥有独立复唱时间。最大档数：2。' },
  { id: 'heated-slug-shot', cn: '热独头弹', en: 'Heated Slug Shot', level: 60, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 140, heat: 5, desc: '独头弹的强化版；连击成功时提高威力并增加热量。' },
  { id: 'dismantle', cn: '武装解除', en: 'Dismantle', level: 62, type: 'ogcd', category: '职业技能', recast: 120, range: '25米', radius: '0米', desc: '降低目标造成的伤害。' },
  { id: 'heated-clean-shot', cn: '热狙击弹', en: 'Heated Clean Shot', level: 64, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 160, heat: 5, battery: 10, desc: '狙击弹的强化版；连击成功时热量 +5、电量 +10。' },
  { id: 'barrel-stabilizer', cn: '枪管加热', en: 'Barrel Stabilizer', level: 66, type: 'ogcd', category: '职业技能', recast: 120, heat: 50, range: '0米', radius: '0米', desc: '增加热量50。' },
  { id: 'blazing-shot', cn: '烈焰弹', en: 'Blazing Shot', level: 68, type: 'gcd', category: '职业技能', recast: 1.5, range: '25米', radius: '0米', potency: 220, desc: '热冲击的强化版；过热时可用，复唱1.5秒。追加效果：双将和将死的复唱时间缩短15秒。' },
  { id: 'flamethrower', cn: '火焰喷射器', en: 'Flamethrower', level: 70, type: 'ogcd', category: '职业技能', recast: 60, range: '0米', radius: '8米', desc: '持续向前方范围喷射火焰。移动或转身会取消。' },
  { id: 'bioblaster', cn: '毒菌冲击', en: 'Bioblaster', level: 72, type: 'gcd', category: '职业技能', recast: 20, range: '12米', radius: '12米', potency: 50, desc: '范围战技并附加持续伤害；与钻头共享用途场景。' },
  { id: 'air-anchor', cn: '空气锚', en: 'Air Anchor', level: 76, type: 'gcd', category: '职业技能', recast: 40, range: '25米', radius: '0米', potency: 660, battery: 20, desc: '热弹的强化版；不与其他战技共享复唱。追加效果：电量 +20。' },
  { id: 'automaton-queen', cn: '后式自走人偶', en: 'Automaton Queen', level: 80, type: 'ogcd', category: '职业技能', recast: 6, batteryCostMin: 50, drainBattery: true, range: '0米', radius: '0米', desc: '电量50以上发动，召唤后会耗尽当前全部电量。4.5秒后开始机器人连段。' },
  { id: 'pile-bunker', cn: '铁臂拳', en: 'Pile Bunker', level: 80, type: 'robot', category: '机器人', recast: 1.5, range: '3米', radius: '0米', potency: 680, desc: '后式自走人偶自动执行的攻击。' },
  { id: 'roller-dash', cn: '滚轮冲', en: 'Roller Dash', level: 80, type: 'ogcd', category: '职业技能', recast: 3, range: '0米', radius: '0米', desc: '后式自走人偶突进到目标附近。' },
  { id: 'crowned-collider', cn: '王室对撞机', en: 'Crowned Collider', level: 86, type: 'robot', category: '机器人', recast: 1, range: '3米', radius: '0米', potency: 780, desc: '后式自走人偶自动执行的终结攻击。' },
  { id: 'chain-saw', cn: '回转飞锯', en: 'Chain Saw', level: 90, type: 'gcd', category: '职业技能', recast: 60, range: '25米', radius: '25米直线', potency: 660, battery: 20, desc: '直线范围战技；追加效果：电量 +20。' },
  { id: 'double-check', cn: '双将', en: 'Double Check', level: 92, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '0米', potency: 160, desc: '虹吸弹的强化版。最大档数：3。' },
  { id: 'checkmate', cn: '将死', en: 'Checkmate', level: 92, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '5米', potency: 160, desc: '弹射的强化版。最大档数：3。' },
  { id: 'excavator', cn: '掘地飞轮', en: 'Excavator', level: 96, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '25米直线', potency: 620, battery: 20, desc: '回转飞锯后获得预备效果时可用，追加电量。' },
  { id: 'full-metal-field', cn: '全金属爆发', en: 'Full Metal Field', level: 100, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '5米', potency: 900, desc: '强力范围战技；通常由枪管加热相关效果触发。' },
  { id: 'second-wind', hidden: true, cn: '内丹', en: 'Second Wind', level: 8, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '恢复自身HP。' },
  { id: 'leg-graze', hidden: true, cn: '伤腿', en: 'Leg Graze', level: 6, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加加重。' },
  { id: 'foot-graze', hidden: true, cn: '伤足', en: 'Foot Graze', level: 10, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加止步。' },
  { id: 'head-graze', hidden: true, cn: '伤头', en: 'Head Graze', level: 24, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '打断目标咏唱。' },
  { id: 'peloton', hidden: true, cn: '速行', en: 'Peloton', level: 20, type: 'ogcd', category: '职能技能', recast: 5, range: '0米', radius: '30米', desc: '非战斗状态下提高自身与周围队员移动速度。' },
  { id: 'arms-length', hidden: true, cn: '亲疏自行', en: "Arm's Length", level: 32, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '令自身免疫大多数击退与吸引效果。' }
].map(action => ({
  ...action,
  icon: `${ICON_BASE}${encodeURIComponent(action.en.replaceAll(' ', '_') + '_Icon.png')}`,
  gcdDuration: action.type === 'gcd' ? (action.recast === 1.5 ? 1.5 : 2.5) : 0
}));

const actionsById = Object.fromEntries(actions.map(action => [action.id, action]));
let plan = createEmptyPlan();
let derivedState = [];

const elements = {
  palette: document.getElementById('palette'),
  grid: document.getElementById('grid'),
  toast: document.getElementById('toast'),
  heatNow: document.getElementById('heatNow'),
  heatMeter: document.getElementById('heatMeter'),
  batteryNow: document.getElementById('batteryNow'),
  batteryMeter: document.getElementById('batteryMeter'),
  doubleNow: document.getElementById('doubleNow'),
  checkNow: document.getElementById('checkNow'),
  reset: document.getElementById('reset'),
  exportPlan: document.getElementById('exportPlan'),
  importPlan: document.getElementById('importPlan')
};

function enableHorizontalWheelScroll() {
  const timeline = document.querySelector('.timeline');
  timeline.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    timeline.scrollLeft += event.deltaY;
  }, { passive: false });
}

function createEmptyPlan() {
  return Array.from({ length: SLOT_COUNT }, () => ({ gcd: null, ogcds: [null, null, null] }));
}

function getColumnGcdDuration(column) {
  const action = actionsById[column.gcd];
  return action?.gcdDuration || DEFAULT_GCD_SECONDS;
}

function getTimelineTimes() {
  const times = [];
  let current = START_TIME_SECONDS;

  for (let index = 0; index < plan.length; index += 1) {
    times[index] = current;
    current += getColumnGcdDuration(plan[index]);
  }

  return times;
}

function timeOf(slotIndex, times = getTimelineTimes()) {
  return times[slotIndex] ?? START_TIME_SECONDS;
}

function formatTime(seconds) {
  return `${Number(seconds.toFixed(1))}s`;
}

function maxOgcdSlotsFor(column) {
  const action = actionsById[column.gcd];
  return action?.gcdDuration === 1.5 ? 2 : 3;
}


function upperBound(sortedNumbers, value) {
  let low = 0;
  let high = sortedNumbers.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sortedNumbers[mid] <= value) low = mid + 1;
    else high = mid;
  }
  return low;
}

function countBetween(sortedNumbers, minExclusive, maxInclusive) {
  return upperBound(sortedNumbers, maxInclusive) - upperBound(sortedNumbers, minExclusive);
}

function collectTimelineFacts(times = getTimelineTimes()) {
  const useTimesByAction = new Map();
  const addUse = (actionId, releaseTime) => {
    if (!actionId) return;
    if (!useTimesByAction.has(actionId)) useTimesByAction.set(actionId, []);
    useTimesByAction.get(actionId).push(releaseTime);
  };

  plan.forEach((column, columnIndex) => {
    const baseTime = timeOf(columnIndex, times);
    addUse(column.gcd, baseTime);
    column.ogcds.forEach((actionId, ogcdIndex) => addUse(actionId, baseTime + ((ogcdIndex + 1) * 0.6)));
  });

  useTimesByAction.forEach(useTimes => useTimes.sort((a, b) => a - b));
  return {
    times,
    useTimesByAction,
    heatBlastTimes: useTimesByAction.get('heat-blast') || [],
    blazingShotTimes: useTimesByAction.get('blazing-shot') || []
  };
}

function getReductionFromFacts(actionId, useTime, targetTime, facts) {
  if (actionId === 'gauss-round' || actionId === 'ricochet') {
    return countBetween(facts.heatBlastTimes, useTime, targetTime) * 15;
  }
  if (actionId === 'double-check' || actionId === 'checkmate') {
    return countBetween(facts.blazingShotTimes, useTime, targetTime) * 15;
  }
  return 0;
}

function getAvailableChargesAtWithFacts(actionId, atTime, facts) {
  const action = actionsById[actionId];
  const maxCharges = action?.charges || 1;
  const recast = action?.recast || DEFAULT_GCD_SECONDS;
  const useTimes = facts.useTimesByAction.get(actionId) || [];
  let activeCooldowns = 0;

  for (const useTime of useTimes) {
    if (useTime > atTime) break;
    const effectiveRecast = Math.max(0, recast - getReductionFromFacts(actionId, useTime, atTime, facts));
    if (atTime - useTime < effectiveRecast) activeCooldowns += 1;
  }

  return Math.max(0, maxCharges - activeCooldowns);
}

function getRobotEventsFromFacts(facts) {
  const events = [];
  const queenTimes = facts.useTimesByAction.get('automaton-queen') || [];
  queenTimes.forEach(queenTime => {
    [0, 1, 2, 3].forEach(index => events.push({ actionId: 'pile-bunker', time: queenTime + 4.5 + (index * 1.5) }));
    events.push({ actionId: 'crowned-collider', time: queenTime + 10.5 });
  });
  return events.sort((a, b) => a.time - b.time);
}


function getMajorCooldownEventsFromFacts(facts) {
  const events = [];

  MAJOR_COOLDOWN_IDS.forEach(actionId => {
    const action = actionsById[actionId];
    if (!action) return;
    events.push({ actionId, time: START_TIME_SECONDS, kind: 'initial' });
    (facts.useTimesByAction.get(actionId) || []).forEach(useTime => {
      events.push({ actionId, time: useTime + (action.recast || DEFAULT_GCD_SECONDS), kind: 'ready' });
    });
  });

  return events
    .filter(event => event.time >= START_TIME_SECONDS && event.time <= MAX_TIME_SECONDS)
    .sort((a, b) => a.time - b.time || MAJOR_COOLDOWN_IDS.indexOf(a.actionId) - MAJOR_COOLDOWN_IDS.indexOf(b.actionId));
}

function bucketEventsByColumn(events, times) {
  const buckets = Array.from({ length: plan.length }, () => []);
  let columnIndex = 0;

  events.forEach(event => {
    while (columnIndex < times.length - 1 && event.time >= times[columnIndex + 1]) columnIndex += 1;
    if (event.time >= times[columnIndex] && event.time < (times[columnIndex + 1] ?? Infinity)) {
      buckets[columnIndex].push(event);
    }
  });

  return buckets;
}

function bucketRobotEventsByColumn(events, times) {
  const buckets = Array.from({ length: plan.length }, () => [[], []]);
  let columnIndex = 0;

  events.forEach((event, eventIndex) => {
    while (columnIndex < times.length - 1 && event.time >= times[columnIndex + 1]) columnIndex += 1;
    if (event.time >= times[columnIndex] && event.time < (times[columnIndex + 1] ?? Infinity)) {
      buckets[columnIndex][eventIndex % 2].push(event);
    }
  });

  return buckets;
}

function getBuffWindows(times = getTimelineTimes()) {
  const windows = [];
  plan.forEach((column, columnIndex) => {
    column.ogcds.forEach((actionId, ogcdIndex) => {
      const action = actionsById[actionId];
      if (!action?.buffDuration) return;
      const start = timeOf(columnIndex, times) + ((ogcdIndex + 1) * 0.6);
      windows.push({ start, end: start + action.buffDuration });
    });
  });
  return windows;
}

function isInBuffWindow(releaseTime, buffWindows) {
  return buffWindows.some(window => releaseTime >= window.start && releaseTime <= window.end);
}


function applyResourceChange(resources, actionId) {
  const action = actionsById[actionId];
  if (!action) return resources;
  resources.heat = Math.max(0, Math.min(100, resources.heat + (action.heat || 0)));
  if (action.drainBattery) resources.battery = 0;
  else resources.battery = Math.max(0, Math.min(100, resources.battery + (action.battery || 0)));
  return resources;
}

function getResourcesBefore(columnIndex, kind, ogcdIndex = 0) {
  const resources = { heat: 0, battery: 0 };

  for (let index = 0; index < columnIndex; index += 1) {
    const column = plan[index];
    [column.gcd, ...column.ogcds].filter(Boolean).forEach(actionId => applyResourceChange(resources, actionId));
  }

  const column = plan[columnIndex];
  if (kind === 'ogcd') {
    if (column.gcd) applyResourceChange(resources, column.gcd);
    column.ogcds.slice(0, ogcdIndex).filter(Boolean).forEach(actionId => applyResourceChange(resources, actionId));
  }

  return resources;
}

function deriveState(times = getTimelineTimes(), facts = collectTimelineFacts(times)) {
  let heat = 0;
  let battery = 0;
  derivedState = plan.map((column, columnIndex) => {
    [column.gcd, ...column.ogcds].filter(Boolean).forEach(actionId => {
      const resources = applyResourceChange({ heat, battery }, actionId);
      heat = resources.heat;
      battery = resources.battery;
    });

    const columnTime = timeOf(columnIndex, times);
    return {
      heat,
      battery,
      reassembleCharges: getAvailableChargesAtWithFacts('reassemble', columnTime, facts),
      doubleCheckCharges: getAvailableChargesAtWithFacts('double-check', columnTime, facts),
      checkmateCharges: getAvailableChargesAtWithFacts('checkmate', columnTime, facts)
    };
  });
}

function getRecastReduction(actionId, useTime, targetTime) {
  let reduction = 0;

  plan.forEach((column, columnIndex) => {
    const time = timeOf(columnIndex);
    if (time <= useTime || time > targetTime) return;
    if (actionId === 'gauss-round' || actionId === 'ricochet') {
      if (column.gcd === 'heat-blast') reduction += 15;
    }
    if (actionId === 'double-check' || actionId === 'checkmate') {
      if (column.gcd === 'blazing-shot') reduction += 15;
    }
  });

  return reduction;
}


function getActionUseTimes(actionId, times = getTimelineTimes()) {
  const uses = [];
  plan.forEach((column, columnIndex) => {
    const baseTime = timeOf(columnIndex, times);
    if (column.gcd === actionId) uses.push(baseTime);
    column.ogcds.forEach((placedId, ogcdIndex) => {
      if (placedId === actionId) uses.push(baseTime + ((ogcdIndex + 1) * 0.6));
    });
  });
  return uses.sort((a, b) => a - b);
}

function getAvailableChargesAt(actionId, atTime, times = getTimelineTimes()) {
  const action = actionsById[actionId];
  const maxCharges = action?.charges || 1;
  const recast = action?.recast || DEFAULT_GCD_SECONDS;
  const activeCooldowns = getActionUseTimes(actionId, times)
    .filter(useTime => useTime <= atTime)
    .filter(useTime => {
      const effectiveRecast = Math.max(0, recast - getRecastReduction(actionId, useTime, atTime));
      return atTime - useTime < effectiveRecast;
    });
  return Math.max(0, maxCharges - activeCooldowns.length);
}

function getReleaseTimeForPlacement(columnIndex, kind, ogcdIndex, times = getTimelineTimes()) {
  const baseTime = timeOf(columnIndex, times);
  return kind === 'ogcd' ? baseTime + ((ogcdIndex + 1) * 0.6) : baseTime;
}

function isSameLocation(location, columnIndex, kind, ogcdIndex) {
  return Boolean(location)
    && location.columnIndex === columnIndex
    && location.kind === kind
    && location.ogcdIndex === ogcdIndex;
}

function shouldIgnorePlacement(ignoreLocations, columnIndex, kind, ogcdIndex) {
  return ignoreLocations.some(location => isSameLocation(location, columnIndex, kind, ogcdIndex));
}

function getActionUseEvents(actionId, times = getTimelineTimes(), ignoreLocations = []) {
  const uses = [];
  plan.forEach((column, columnIndex) => {
    if (column.gcd === actionId && !shouldIgnorePlacement(ignoreLocations, columnIndex, 'gcd', null)) {
      uses.push({ time: timeOf(columnIndex, times), columnIndex, kind: 'gcd', ogcdIndex: null });
    }
    column.ogcds.forEach((placedId, ogcdIndex) => {
      if (placedId === actionId && !shouldIgnorePlacement(ignoreLocations, columnIndex, 'ogcd', ogcdIndex)) {
        uses.push({ time: timeOf(columnIndex, times) + ((ogcdIndex + 1) * 0.6), columnIndex, kind: 'ogcd', ogcdIndex });
      }
    });
  });
  return uses.sort((a, b) => a.time - b.time);
}

function cooldownActiveAt(actionId, useTime, atTime, recast) {
  const effectiveRecast = Math.max(0, recast - getRecastReduction(actionId, useTime, atTime));
  return atTime - useTime < effectiveRecast;
}

function getAvailability(action, slotIndex, times = getTimelineTimes(), options = {}) {
  const kind = options.kind || action.type;
  const ogcdIndex = options.ogcdIndex ?? null;
  const now = getReleaseTimeForPlacement(slotIndex, kind, ogcdIndex, times);
  const ignoreLocations = [options.source, options.destination].filter(Boolean);
  const useEvents = getActionUseEvents(action.id, times, ignoreLocations);

  if (useEvents.length === 0) return { ok: true };

  const recast = action.recast || DEFAULT_GCD_SECONDS;
  if (action.charges) {
    const candidate = { time: now, candidate: true };
    const simulatedUses = [...useEvents, candidate].sort((a, b) => a.time - b.time || (a.candidate ? 1 : -1));

    for (const currentUse of simulatedUses) {
      const activeBeforeCurrentUse = simulatedUses
        .filter(use => use !== currentUse && use.time < currentUse.time)
        .filter(use => cooldownActiveAt(action.id, use.time, currentUse.time, recast));

      if (activeBeforeCurrentUse.length >= action.charges) {
        if (currentUse.candidate) {
          const firstBlockedUse = activeBeforeCurrentUse[0];
          const remaining = Math.max(0, recast - getRecastReduction(action.id, firstBlockedUse.time, now) - (now - firstBlockedUse.time));
          return { ok: false, message: `充能中，约 ${Math.ceil(remaining)} 秒后可用` };
        }
        return { ok: false, message: `会导致后续 ${formatTime(currentUse.time)} 的${action.cn}充能不足` };
      }
    }

    return { ok: true };
  }

  const previousUse = useEvents.filter(use => use.time < now).at(-1);
  if (previousUse && cooldownActiveAt(action.id, previousUse.time, now, recast)) {
    const effectiveRecast = Math.max(0, recast - getRecastReduction(action.id, previousUse.time, now));
    return {
      ok: false,
      message: `CD中，约 ${Math.ceil(effectiveRecast - (now - previousUse.time))} 秒后可用`
    };
  }

  const nextUse = useEvents.find(use => use.time > now);
  if (nextUse && cooldownActiveAt(action.id, now, nextUse.time, recast)) {
    const effectiveRecast = Math.max(0, recast - getRecastReduction(action.id, now, nextUse.time));
    return {
      ok: false,
      message: `会卡到后续 ${formatTime(nextUse.time)} 的${action.cn}，需要至少间隔 ${Number(effectiveRecast.toFixed(1))} 秒`
    };
  }

  return { ok: true };
}

function renderPalette() {
  const categories = ['职业技能'];
  elements.palette.innerHTML = categories.map(category => {
    const visibleActions = actions
      .filter(action => action.category === category && !action.hidden)
      .sort((a, b) => (a.id === 'dexterity-potion') - (b.id === 'dexterity-potion'));
    return `
      <section class="skill-category">
        <h2>${category}</h2>
        <div class="skill-list">
          ${visibleActions.map(renderPaletteAction).join('')}
        </div>
      </section>
    `;
  }).join('');

  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('dragstart', event => {
      document.body.classList.add('dragging');
      event.dataTransfer.setData('text/plain', card.dataset.id);
    });
    card.addEventListener('dragend', () => document.body.classList.remove('dragging'));
  });
}

function renderPaletteAction(action) {
  return `
    <article class="skill-card ${action.type}" draggable="true" data-id="${action.id}">
      <img src="${action.icon}" alt="${action.cn}" loading="lazy" onerror="this.src='';this.classList.add('icon-fallback')">
      <div>
        <strong>${action.cn}</strong>
        <span>${action.level}级 · ${action.type === 'gcd' ? '战技' : '能力'}</span>
      </div>
      ${renderTooltip(action)}
    </article>
  `;
}

function renderTooltip(action) {
  const resourceLines = [
    action.heat ? `${action.heat > 0 ? '热量 +' : '热量 '}${action.heat}` : '',
    action.drainBattery ? '消耗：全部电量（最低50）' : '',
    action.battery ? `${action.battery > 0 ? '电量 +' : '电量 '}${action.battery}` : '',
    action.charges ? `最大档数：${action.charges}` : '',
    action.buffDuration ? `Buff时间：${action.buffDuration}秒` : ''
  ].filter(Boolean).join('　');

  return `
    <aside class="skill-tooltip">
      <div class="tooltip-head">
        <img src="${action.icon}" alt="">
        <div><small>${action.en}</small><b>${action.cn}</b><span>${action.type === 'gcd' ? '战技' : '能力'}</span></div>
      </div>
      <div class="tooltip-stats">
        <span>距离${action.range}</span><span>范围${action.radius}</span>
        <span>咏唱时间<br><b>即时</b></span><span>复唱时间<br><b>${Number(action.recast).toFixed(2)}秒</b></span>
      </div>
      <p>对目标发动物理攻击 ${action.potency ? `<em>威力：${action.potency}</em>` : ''}</p>
      ${resourceLines ? `<p class="resource-line">${resourceLines}</p>` : ''}
      <p>${action.desc}</p>
      <p class="requirements"><span>习得条件</span><b>${action.level}级</b><span>适用职业</span><b>机工士</b></p>
    </aside>
  `;
}

function renderTimeline() {
  const times = getTimelineTimes();
  const facts = collectTimelineFacts(times);
  const buffWindows = getBuffWindows(times);
  const robotBuckets = bucketRobotEventsByColumn(getRobotEventsFromFacts(facts), times);
  const majorCooldownBuckets = bucketEventsByColumn(getMajorCooldownEventsFromFacts(facts), times);
  deriveState(times, facts);
  const lastState = derivedState.at(-1) || { heat: 0, battery: 0, reassembleCharges: 2, doubleCheckCharges: 3, checkmateCharges: 3 };
  if (elements.heatNow) {
    elements.heatNow.textContent = lastState.heat;
    elements.heatNow.title = `当前热量：${lastState.heat} / 100`;
  }
  if (elements.heatMeter) {
    elements.heatMeter.value = lastState.heat;
    elements.heatMeter.title = `当前热量：${lastState.heat} / 100`;
  }
  if (elements.batteryNow) {
    elements.batteryNow.textContent = lastState.battery;
    elements.batteryNow.title = `当前电量：${lastState.battery} / 100`;
  }
  if (elements.batteryMeter) {
    elements.batteryMeter.value = lastState.battery;
    elements.batteryMeter.title = `当前电量：${lastState.battery} / 100`;
  }
  if (elements.doubleNow) elements.doubleNow.textContent = lastState.doubleCheckCharges;
  if (elements.checkNow) elements.checkNow.textContent = lastState.checkmateCharges;

  elements.grid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  plan.forEach((column, columnIndex) => {
    const element = document.createElement('div');
    element.className = 'timeline-column';
    element.innerHTML = `
      <div class="time-label">${formatTime(timeOf(columnIndex, times))}</div>
      ${renderMajorCooldownCell(majorCooldownBuckets[columnIndex])}
      <div class="charge-row reassemble-row" title="整备层数 ${derivedState[columnIndex].reassembleCharges} / 2"><i style="width:${(derivedState[columnIndex].reassembleCharges / 2) * 100}%"></i></div>
      <div class="charge-row double-row" title="双将层数 ${derivedState[columnIndex].doubleCheckCharges} / 3"><i style="width:${(derivedState[columnIndex].doubleCheckCharges / 3) * 100}%"></i></div>
      <div class="charge-row check-row" title="将死层数 ${derivedState[columnIndex].checkmateCharges} / 3"><i style="width:${(derivedState[columnIndex].checkmateCharges / 3) * 100}%"></i></div>
      <div class="resource-bars" title="热量 ${derivedState[columnIndex].heat} / 100｜电量 ${derivedState[columnIndex].battery} / 100">
        <i class="heat-bar" title="热量 ${derivedState[columnIndex].heat} / 100" style="height:${derivedState[columnIndex].heat}%"></i>
        <i class="battery-bar" title="电量 ${derivedState[columnIndex].battery} / 100" style="height:${derivedState[columnIndex].battery}%"></i>
      </div>
    `;
    element.append(createSlot(columnIndex, 'gcd', null, column.gcd, false, timeOf(columnIndex, times), buffWindows));
    [0, 1, 2].forEach(slotIndex => {
      element.append(createSlot(columnIndex, 'ogcd', slotIndex, column.ogcds[slotIndex], slotIndex >= maxOgcdSlotsFor(column), timeOf(columnIndex, times) + ((slotIndex + 1) * 0.6), buffWindows));
    });
    element.append(createRobotSlot(robotBuckets[columnIndex][0], buffWindows));
    element.append(createRobotSlot(robotBuckets[columnIndex][1], buffWindows));
    fragment.append(element);
  });
  elements.grid.append(fragment);
}

function renderMajorCooldownCell(events) {
  const content = events.map(event => {
    const action = actionsById[event.actionId];
    const title = event.kind === 'initial'
      ? `${action.cn} 开场可用`
      : `${action.cn} 在 ${formatTime(event.time)} 转好`;
    return `<span class="major-cd-badge ${event.kind}" title="${title}"><img src="${action.icon}" alt="${action.cn}"><small>${formatTime(event.time)}</small></span>`;
  }).join('');
  return `<div class="major-cd-row" title="大技能CD提醒：钻头 / 空气锚 / 回转飞锯 / 枪管加热 / 野火">${content}</div>`;
}

function createSlot(columnIndex, kind, ogcdIndex, actionId, disabled = false, releaseTime = timeOf(columnIndex), buffWindows = []) {
  const slot = document.createElement('div');
  slot.className = `timeline-slot ${kind === 'gcd' ? 'gcd-slot' : 'ogcd-slot'} ${disabled ? 'disabled-slot' : ''}`;
  if (!disabled) {
    slot.addEventListener('dragover', event => event.preventDefault());
    slot.addEventListener('drop', event => handleDrop(event, columnIndex, kind, ogcdIndex));
  }

  if (actionId) {
    const action = actionsById[actionId];
    slot.innerHTML = `<span class="placed-action ${isInBuffWindow(releaseTime, buffWindows) ? 'buffed-action' : ''}" draggable="true"><small>${formatTime(releaseTime)}</small><img class="placed-icon ${action.gcdDuration === 1.5 ? 'short-gcd' : ''}" src="${action.icon}" alt="${action.cn}" title="拖动移动，点击移除 ${action.cn}"></span>`;
    slot.querySelector('.placed-action').addEventListener('dragstart', event => {
      document.body.classList.add('dragging');
      event.dataTransfer.setData('text/plain', action.id);
      event.dataTransfer.setData('application/x-mch-source', JSON.stringify({ columnIndex, kind, ogcdIndex }));
    });
    slot.querySelector('.placed-action').addEventListener('dragend', () => document.body.classList.remove('dragging'));
    slot.addEventListener('click', () => {
      if (kind === 'gcd') plan[columnIndex].gcd = null;
      else plan[columnIndex].ogcds[ogcdIndex] = null;
      renderTimeline();
    });
  }

  return slot;
}

function createRobotSlot(events, buffWindows) {
  const slot = document.createElement('div');
  slot.className = 'timeline-slot robot-slot';
  slot.innerHTML = events.map(event => {
    const action = actionsById[event.actionId];
    return `<span class="placed-action robot-action ${isInBuffWindow(event.time, buffWindows) ? 'buffed-action' : ''}"><small>${formatTime(event.time)}</small><img class="placed-icon" src="${action.icon}" alt="${action.cn}" title="${action.cn} ${formatTime(event.time)}"></span>`;
  }).join('');
  return slot;
}

function handleDrop(event, columnIndex, kind, ogcdIndex) {
  event.preventDefault();
  const times = getTimelineTimes();
  document.body.classList.remove('dragging');
  const action = actionsById[event.dataTransfer.getData('text/plain')];
  const sourceText = event.dataTransfer.getData('application/x-mch-source');
  const source = sourceText ? JSON.parse(sourceText) : null;
  if (!action) return;

  if (action.type === 'robot') {
    showToast('机器人技能由后式自走人偶自动生成，不能手动放置。');
    return;
  }

  const dropTime = timeOf(columnIndex, times);
  const prepullGcdSlotAllowsOgcd = kind === 'gcd' && dropTime < 0 && action.type === 'ogcd';
  if (action.type !== kind && !prepullGcdSlotAllowsOgcd) {
    showToast(kind === 'gcd' ? '这里只能放战技（GCD）；但 -15s 到 0s 倒计时区间的GCD格可以放能力技。' : '每个GCD之间最多插入3个能力技能（oGCD）。');
    return;
  }

  if (kind === 'ogcd' && ogcdIndex >= maxOgcdSlotsFor(plan[columnIndex])) {
    showToast('1.5秒短GCD后只能插入2个能力技能。');
    return;
  }

  const destination = { columnIndex, kind, ogcdIndex: ogcdIndex ?? null };
  const availability = getAvailability(action, columnIndex, times, { kind, ogcdIndex: ogcdIndex ?? null, source, destination });
  if (!availability.ok) {
    showToast(`${action.cn} ${availability.message}，不能放在 ${formatTime(timeOf(columnIndex, times))}。`);
    return;
  }

  const availableResources = getResourcesBefore(columnIndex, kind, ogcdIndex || 0);
  if ((action.heat || 0) < 0 && availableResources.heat < Math.abs(action.heat)) {
    showToast(`${action.cn} 需要 ${Math.abs(action.heat)} 热量，当前只有 ${availableResources.heat}。`);
    return;
  }
  if (action.batteryCostMin && availableResources.battery < action.batteryCostMin) {
    showToast(`${action.cn} 至少需要 ${action.batteryCostMin} 电量，当前只有 ${availableResources.battery}，发动后会耗尽全部电量。`);
    return;
  }
  if ((action.battery || 0) < 0 && availableResources.battery < Math.abs(action.battery)) {
    showToast(`${action.cn} 需要 ${Math.abs(action.battery)} 电量，当前只有 ${availableResources.battery}。`);
    return;
  }

  if (source && !(source.columnIndex === columnIndex && source.kind === kind && source.ogcdIndex === ogcdIndex)) {
    if (source.kind === 'gcd') plan[source.columnIndex].gcd = null;
    else plan[source.columnIndex].ogcds[source.ogcdIndex] = null;
  }

  if (kind === 'gcd') {
    plan[columnIndex].gcd = action.id;
    if (action.gcdDuration === 1.5) plan[columnIndex].ogcds[2] = null;
  } else {
    plan[columnIndex].ogcds[ogcdIndex] = action.id;
  }
  showToast(`${action.cn} 已放入 ${formatTime(timeOf(columnIndex, times))}。`);
  renderTimeline();
}

function showToast(message) {
  elements.toast.textContent = message;
}


function serializePlan() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    plan
  };
}

function normalizeImportedPlan(imported) {
  const rawPlan = Array.isArray(imported) ? imported : imported?.plan;
  if (!Array.isArray(rawPlan)) throw new Error('导入文件中没有可识别的 plan 数组。');

  const normalized = createEmptyPlan();
  rawPlan.slice(0, SLOT_COUNT).forEach((column, index) => {
    const gcd = actionsById[column?.gcd] ? column.gcd : null;
    const ogcds = Array.isArray(column?.ogcds)
      ? column.ogcds.slice(0, 3).map(actionId => (actionsById[actionId] ? actionId : null))
      : [null, null, null];
    while (ogcds.length < 3) ogcds.push(null);
    normalized[index] = { gcd, ogcds };
  });
  return normalized;
}

function exportTimeline() {
  const json = JSON.stringify(serializePlan(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mch-timeline-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('已导出当前时间轴 JSON。');
}

function importTimeline(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      plan = normalizeImportedPlan(JSON.parse(reader.result));
      showToast(`已导入 ${file.name}。`);
      renderTimeline();
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    } finally {
      elements.importPlan.value = '';
    }
  });
  reader.readAsText(file);
}

elements.exportPlan.addEventListener('click', exportTimeline);
elements.importPlan.addEventListener('change', event => {
  const [file] = event.target.files;
  if (file) importTimeline(file);
});

elements.reset.addEventListener('click', () => {
  plan = createEmptyPlan();
  showToast('已重置时间轴。');
  renderTimeline();
});

enableHorizontalWheelScroll();
renderPalette();
renderTimeline();
