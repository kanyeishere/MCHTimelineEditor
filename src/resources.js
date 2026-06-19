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


function ensureBuffStore(resources) {
  resources.buffs ??= {};
  return resources.buffs;
}

function isBuffActive(resources, buffId, releaseTime) {
  return (ensureBuffStore(resources)[buffId] || -Infinity) >= releaseTime;
}

function isBarrelPrepActive(resources, releaseTime) {
  return isBuffActive(resources, 'barrel-prep', releaseTime);
}

function getActiveBuffs(resources, releaseTime) {
  return Object.entries(ensureBuffStore(resources))
    .filter(([, expiresAt]) => expiresAt >= releaseTime)
    .map(([id, expiresAt]) => ({ id, expiresAt, stacks: id === 'overheat' ? resources.overheatStacks : undefined, ...(BUFF_DEFINITIONS[id] || { label: id, short: id }) }));
}

function getEffectiveHeatChange(action, resources, releaseTime) {
  if (action.id === 'hypercharge' && isBarrelPrepActive(resources, releaseTime)) return 0;
  return action.heat || 0;
}

function grantActionBuffs(resources, action, releaseTime) {
  if (!action.grantsBuffs) return;
  const buffs = ensureBuffStore(resources);
  action.grantsBuffs.forEach(buff => {
    buffs[buff.id] = releaseTime + buff.duration;
    if (buff.id === 'overheat') resources.overheatStacks = 5;
    if (buff.id === 'wildfire') resources.wildfireHits = 0;
  });
}

function consumeActionBuffs(resources, action, releaseTime) {
  const buffs = ensureBuffStore(resources);
  if (action.id === 'hypercharge' && isBuffActive(resources, 'barrel-prep', releaseTime)) delete buffs['barrel-prep'];
  if (action.requiresBuff && isBuffActive(resources, action.requiresBuff, releaseTime)) delete buffs[action.requiresBuff];
  if (action.requiresOverheat && isBuffActive(resources, 'overheat', releaseTime)) {
    resources.overheatStacks = Math.max(0, (resources.overheatStacks || 0) - 1);
    if (resources.overheatStacks <= 0) delete buffs.overheat;
  }
  if (action.type === 'gcd' && isBuffActive(resources, 'wildfire', releaseTime)) {
    resources.wildfireHits = (resources.wildfireHits || 0) + 1;
    if (resources.wildfireHits >= 6) delete buffs.wildfire;
  }
  if (action.type === 'gcd' && isBuffActive(resources, 'reassemble', releaseTime)) delete buffs.reassemble;
}

function applyResourceChange(resources, actionId, releaseTime = START_TIME_SECONDS) {
  const action = actionsById[actionId];
  if (!action) return resources;
  ensureBuffStore(resources);

  grantActionBuffs(resources, action, releaseTime);

  const heatChange = getEffectiveHeatChange(action, resources, releaseTime);
  resources.heat = Math.max(0, Math.min(100, resources.heat + heatChange));
  if (action.drainBattery) resources.battery = 0;
  else resources.battery = Math.max(0, Math.min(100, resources.battery + (action.battery || 0)));

  consumeActionBuffs(resources, action, releaseTime);
  return resources;
}

function getResourcesBefore(columnIndex, kind, ogcdIndex = 0, times = getTimelineTimes()) {
  const resources = getInitialResourceState();

  for (let index = 0; index < columnIndex; index += 1) {
    const column = plan[index];
    const baseTime = timeOf(index, times);
    if (column.gcd) applyResourceChange(resources, column.gcd, baseTime);
    column.ogcds.forEach((actionId, placedOgcdIndex) => {
      if (actionId) applyResourceChange(resources, actionId, baseTime + ((placedOgcdIndex + 1) * 0.6));
    });
  }

  const column = plan[columnIndex];
  const baseTime = timeOf(columnIndex, times);
  if (kind === 'ogcd') {
    if (column.gcd) applyResourceChange(resources, column.gcd, baseTime);
    column.ogcds.slice(0, ogcdIndex).forEach((actionId, placedOgcdIndex) => {
      if (actionId) applyResourceChange(resources, actionId, baseTime + ((placedOgcdIndex + 1) * 0.6));
    });
  }

  return resources;
}

function deriveState(times = getTimelineTimes(), facts = collectTimelineFacts(times)) {
  const resources = getInitialResourceState();
  derivedState = plan.map((column, columnIndex) => {
    const baseTime = timeOf(columnIndex, times);
    const activeBuffs = getActiveBuffs(resources, baseTime);
    if (column.gcd) applyResourceChange(resources, column.gcd, baseTime);
    column.ogcds.forEach((actionId, ogcdIndex) => {
      if (actionId) applyResourceChange(resources, actionId, baseTime + ((ogcdIndex + 1) * 0.6));
    });

    const columnTime = timeOf(columnIndex, times);
    return {
      heat: resources.heat,
      battery: resources.battery,
      activeBuffs,
      drillCharges: getDisplayChargesAtWithFacts('drill', columnTime, facts),
      reassembleCharges: getAvailableChargesAtWithFacts('reassemble', columnTime, facts),
      doubleCheckCharges: getAvailableChargesAtWithFacts('double-check', columnTime, facts),
      checkmateCharges: getAvailableChargesAtWithFacts('checkmate', columnTime, facts)
    };
  });
}
