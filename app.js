const DEFAULT_GCD_SECONDS = 2.5;
const START_TIME_SECONDS = -15;
const MAX_TIME_SECONDS = 20 * 60;
const SLOT_COUNT = Math.ceil((MAX_TIME_SECONDS - START_TIME_SECONDS) / DEFAULT_GCD_SECONDS) + 1;
const ICON_BASE = 'https://ffxiv.gamerescape.com/wiki/Special:Redirect/file/';

const actions = [
  { id: 'dexterity-potion', cn: '爆发药水', en: 'Grade 3 Gemdraught of Dexterity', level: 1, type: 'ogcd', category: '药品', recast: 270, buffDuration: 30, range: '0米', radius: '0米', desc: '视为能力技。使用后获得30秒爆发药效果，时间轴中处于药效窗口内的本体与机器人技能都会高亮。' },
  { id: 'split-shot', cn: '分裂弹', en: 'Split Shot', level: 1, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 140, heat: 5, desc: '对目标发动远距离物理攻击。追加效果：热量 +5。' },
  { id: 'slug-shot', cn: '独头弹', en: 'Slug Shot', level: 2, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, desc: '连击：分裂弹/热分裂弹。连击成功时威力提高并增加热量。' },
  { id: 'hot-shot', cn: '热弹', en: 'Hot Shot', level: 4, type: 'gcd', category: '职业技能', recast: 40, range: '25米', radius: '0米', potency: 240, battery: 20, desc: '不与其他战技共享复唱。追加效果：电量 +20。' },
  { id: 'reassemble', cn: '整备', en: 'Reassemble', level: 10, type: 'ogcd', category: '职业技能', recast: 55, charges: 2, range: '0米', radius: '0米', desc: '令下一个战技必定暴击并直击。最大档数：2。' },
  { id: 'gauss-round', cn: '虹吸弹', en: 'Gauss Round', level: 15, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '0米', potency: 130, desc: '对目标发动远距离物理攻击。最大档数：3。' },
  { id: 'spread-shot', cn: '散射', en: 'Spread Shot', level: 18, type: 'gcd', category: '职业技能', recast: 2.5, range: '12米', radius: '12米', potency: 110, heat: 5, desc: '向目标方向发动扇形范围攻击。追加效果：热量 +5。' },
  { id: 'clean-shot', cn: '狙击弹', en: 'Clean Shot', level: 26, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, battery: 10, desc: '连击：独头弹/热独头弹。连击成功时热量 +5、电量 +10。' },
  { id: 'hypercharge', cn: '超荷', en: 'Hypercharge', level: 30, type: 'ogcd', category: '职业技能', recast: 10, heat: -50, range: '0米', radius: '0米', desc: '消耗50热量，获得5档过热，可执行烈焰弹/自动弩。' },
  { id: 'heat-blast', cn: '热冲击', en: 'Heat Blast', level: 35, type: 'gcd', category: '职业技能', recast: 1.5, range: '25米', radius: '0米', potency: 200, desc: '过热时可用；追加效果：虹吸弹和弹射的复唱时间缩短15秒。' },
  { id: 'rook-autoturret', cn: '车式浮空炮塔', en: 'Rook Autoturret', level: 40, type: 'ogcd', category: '职业技能', recast: 6, battery: -50, range: '0米', radius: '0米', desc: '消耗50电量部署单体炮塔；与后式自走人偶共享用途。' },
  { id: 'rook-overdrive', cn: '超档车式炮塔', en: 'Rook Overdrive', level: 40, type: 'ogcd', category: '职业技能', recast: 15, range: '25米', radius: '0米', desc: '命令车式浮空炮塔执行超负荷。' },
  { id: 'wildfire', cn: '野火', en: 'Wildfire', level: 45, type: 'ogcd', category: '职业技能', recast: 120, range: '25米', radius: '0米', desc: '附加野火；持续结束或起爆时根据期间命中的战技次数造成伤害。' },
  { id: 'detonator', cn: '起爆', en: 'Detonator', level: 45, type: 'ogcd', category: '职业技能', recast: 1, range: '25米', radius: '0米', desc: '提前结束野火并造成伤害。' },
  { id: 'ricochet', cn: '弹射', en: 'Ricochet', level: 50, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '5米', potency: 130, desc: '对目标及周围敌人发动范围攻击。最大档数：3。' },
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
  { id: 'double-check', cn: '双将', en: 'Double Check', level: 92, type: 'ogcd', category: '职业技能', recast: 1, charges: 3, range: '25米', radius: '0米', potency: 160, desc: '虹吸弹的强化版。最大档数：3。' },
  { id: 'checkmate', cn: '将死', en: 'Checkmate', level: 92, type: 'ogcd', category: '职业技能', recast: 1, charges: 3, range: '25米', radius: '5米', potency: 160, desc: '弹射的强化版。最大档数：3。' },
  { id: 'excavator', cn: '掘地飞轮', en: 'Excavator', level: 96, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '25米直线', potency: 620, battery: 20, desc: '回转飞锯后获得预备效果时可用，追加电量。' },
  { id: 'full-metal-field', cn: '全金属爆发', en: 'Full Metal Field', level: 100, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '5米', potency: 900, desc: '强力范围战技；通常由枪管加热相关效果触发。' },
  { id: 'second-wind', cn: '内丹', en: 'Second Wind', level: 8, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '恢复自身HP。' },
  { id: 'leg-graze', cn: '伤腿', en: 'Leg Graze', level: 6, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加加重。' },
  { id: 'foot-graze', cn: '伤足', en: 'Foot Graze', level: 10, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加止步。' },
  { id: 'head-graze', cn: '伤头', en: 'Head Graze', level: 24, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '打断目标咏唱。' },
  { id: 'peloton', cn: '速行', en: 'Peloton', level: 20, type: 'ogcd', category: '职能技能', recast: 5, range: '0米', radius: '30米', desc: '非战斗状态下提高自身与周围队员移动速度。' },
  { id: 'arms-length', cn: '亲疏自行', en: "Arm's Length", level: 32, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '令自身免疫大多数击退与吸引效果。' }
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
  reset: document.getElementById('reset')
};

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

function deriveState(times = getTimelineTimes()) {
  let heat = 0;
  let battery = 0;
  let doubleCheckCharges = 3;
  let checkmateCharges = 3;

  derivedState = plan.map(column => {
    [column.gcd, ...column.ogcds].filter(Boolean).forEach(actionId => {
      const resources = applyResourceChange({ heat, battery }, actionId);
      heat = resources.heat;
      battery = resources.battery;
      if (actionId === 'double-check') doubleCheckCharges -= 1;
      if (actionId === 'checkmate') checkmateCharges -= 1;
    });

    return {
      heat,
      battery,
      doubleCheckCharges: Math.max(0, doubleCheckCharges),
      checkmateCharges: Math.max(0, checkmateCharges)
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

function getAvailability(action, slotIndex, times = getTimelineTimes()) {
  const now = timeOf(slotIndex, times);
  const previousUses = [];

  plan.forEach((column, columnIndex) => {
    [column.gcd, ...column.ogcds].forEach(actionId => {
      if (actionId === action.id) previousUses.push(timeOf(columnIndex, times));
    });
  });

  if (previousUses.length === 0) return { ok: true };

  const recast = action.recast || DEFAULT_GCD_SECONDS;
  if (action.charges) {
    const recentUses = previousUses.filter(useTime => now - useTime < Math.max(0, recast - getRecastReduction(action.id, useTime, now)));
    const firstBlockedUse = recentUses[0];
    const remaining = firstBlockedUse === undefined ? 0 : Math.max(0, recast - getRecastReduction(action.id, firstBlockedUse, now) - (now - firstBlockedUse));
    return {
      ok: recentUses.length < action.charges,
      message: `充能中，约 ${Math.ceil(remaining)} 秒后可用`
    };
  }

  const lastUse = Math.max(...previousUses);
  const effectiveRecast = Math.max(0, recast - getRecastReduction(action.id, lastUse, now));
  return {
    ok: now - lastUse >= effectiveRecast,
    message: `CD中，约 ${Math.ceil(effectiveRecast - (now - lastUse))} 秒后可用`
  };
}

function renderPalette() {
  const categories = ['职业技能', '职能技能', '药品'];
  elements.palette.innerHTML = categories.map(category => `
    <section class="skill-category">
      <h2>${category}</h2>
      <div class="skill-list">
        ${actions.filter(action => action.category === category).map(renderPaletteAction).join('')}
      </div>
    </section>
  `).join('');

  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', card.dataset.id);
    });
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
  const buffWindows = getBuffWindows(times);
  deriveState(times);
  const lastState = derivedState.at(-1) || { heat: 0, battery: 0, doubleCheckCharges: 3, checkmateCharges: 3 };
  elements.heatNow.textContent = lastState.heat;
  elements.heatNow.title = `当前热量：${lastState.heat} / 100`;
  elements.heatMeter.value = lastState.heat;
  elements.heatMeter.title = `当前热量：${lastState.heat} / 100`;
  elements.batteryNow.textContent = lastState.battery;
  elements.batteryNow.title = `当前电量：${lastState.battery} / 100`;
  elements.batteryMeter.value = lastState.battery;
  elements.batteryMeter.title = `当前电量：${lastState.battery} / 100`;
  elements.doubleNow.textContent = lastState.doubleCheckCharges;
  elements.checkNow.textContent = lastState.checkmateCharges;

  elements.grid.innerHTML = '';
  plan.forEach((column, columnIndex) => {
    const element = document.createElement('div');
    element.className = 'timeline-column';
    element.innerHTML = `
      <div class="time-label">${formatTime(timeOf(columnIndex, times))}</div>
      <div class="resource-bars" title="热量 ${derivedState[columnIndex].heat} / 100｜电量 ${derivedState[columnIndex].battery} / 100">
        <i class="heat-bar" title="热量 ${derivedState[columnIndex].heat} / 100" style="height:${derivedState[columnIndex].heat}%"></i>
        <i class="battery-bar" title="电量 ${derivedState[columnIndex].battery} / 100" style="height:${derivedState[columnIndex].battery}%"></i>
      </div>
    `;
    element.append(createSlot(columnIndex, 'gcd', null, column.gcd, false, timeOf(columnIndex, times), buffWindows));
    [0, 1, 2].forEach(slotIndex => {
      element.append(createSlot(columnIndex, 'ogcd', slotIndex, column.ogcds[slotIndex], slotIndex >= maxOgcdSlotsFor(column), timeOf(columnIndex, times) + ((slotIndex + 1) * 0.6), buffWindows));
    });
    element.append(createRobotSlot(columnIndex, times, buffWindows));
    elements.grid.append(element);
  });
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
    slot.innerHTML = `<span class="placed-action ${isInBuffWindow(releaseTime, buffWindows) ? 'buffed-action' : ''}"><small>${formatTime(releaseTime)}</small><img class="placed-icon ${action.gcdDuration === 1.5 ? 'short-gcd' : ''}" src="${action.icon}" alt="${action.cn}" title="点击移除 ${action.cn}"></span>`;
    slot.addEventListener('click', () => {
      if (kind === 'gcd') plan[columnIndex].gcd = null;
      else plan[columnIndex].ogcds[ogcdIndex] = null;
      renderTimeline();
    });
  }

  return slot;
}

function getRobotEvents(times = getTimelineTimes()) {
  const events = [];
  plan.forEach((column, columnIndex) => {
    if (column.ogcds.includes('automaton-queen')) {
      const queenTime = timeOf(columnIndex, times) + ((column.ogcds.indexOf('automaton-queen') + 1) * 0.6);
      [0, 1, 2, 3].forEach(index => events.push({ actionId: 'pile-bunker', time: queenTime + 4.5 + (index * 1.5) }));
      events.push({ actionId: 'crowned-collider', time: queenTime + 10.5 });
    }
  });
  return events;
}

function createRobotSlot(columnIndex, times, buffWindows) {
  const slot = document.createElement('div');
  slot.className = 'timeline-slot robot-slot';
  const start = timeOf(columnIndex, times);
  const end = timeOf(columnIndex + 1, times);
  const events = getRobotEvents(times).filter(event => event.time >= start && event.time < end);
  slot.innerHTML = events.map(event => {
    const action = actionsById[event.actionId];
    return `<span class="placed-action robot-action ${isInBuffWindow(event.time, buffWindows) ? 'buffed-action' : ''}"><small>${formatTime(event.time)}</small><img class="placed-icon" src="${action.icon}" alt="${action.cn}" title="${action.cn} ${formatTime(event.time)}"></span>`;
  }).join('');
  return slot;
}

function handleDrop(event, columnIndex, kind, ogcdIndex) {
  event.preventDefault();
  const times = getTimelineTimes();
  const action = actionsById[event.dataTransfer.getData('text/plain')];
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

  const availability = getAvailability(action, columnIndex, times);
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

elements.reset.addEventListener('click', () => {
  plan = createEmptyPlan();
  showToast('已重置时间轴。');
  renderTimeline();
});

renderPalette();
renderTimeline();
