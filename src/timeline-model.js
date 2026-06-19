function clampResource(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getInitialResourceState() {
  return { heat: initialResources.heat, battery: initialResources.battery, buffs: {}, overheatStacks: 0, wildfireHits: 0 };
}

function updateInitialResourceInputs() {
  if (elements.initialHeat) elements.initialHeat.value = initialResources.heat;
  if (elements.initialBattery) elements.initialBattery.value = initialResources.battery;
}

function createEmptyColumn() {
  return { gcd: null, ogcds: [null, null, null], gapAfter: 0, gapName: '转场' };
}

function createEmptyPlan() {
  return Array.from({ length: INITIAL_SLOT_COUNT }, createEmptyColumn);
}

function getColumnGcdDuration(column) {
  const action = actionsById[column.gcd];
  return (action?.gcdDuration || DEFAULT_GCD_SECONDS) + getColumnGapAfter(column);
}

function getColumnGapAfter(column) {
  const gap = Number(column?.gapAfter || 0);
  return Number.isFinite(gap) && gap > 0 ? gap : 0;
}

function getColumnBaseDuration(column) {
  const action = actionsById[column.gcd];
  return action?.gcdDuration || DEFAULT_GCD_SECONDS;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


function getTimelineEndTime(times = getTimelineTimes()) {
  return times.at(-1) ?? START_TIME_SECONDS;
}

function getSimulationEndTime(times = getTimelineTimes()) {
  return Math.max(INITIAL_MAX_TIME_SECONDS, getTimelineEndTime(times) + TIMELINE_TAIL_SECONDS);
}

function ensurePlanCoversTimelineTail() {
  let times = getTimelineTimes();
  const lastGcdIndex = getLastGcdIndex();
  const desiredEnd = lastGcdIndex >= 0
    ? Math.max(INITIAL_MAX_TIME_SECONDS, timeOf(lastGcdIndex, times) + getColumnBaseDuration(plan[lastGcdIndex]) + TIMELINE_TAIL_SECONDS)
    : INITIAL_MAX_TIME_SECONDS;

  while (getTimelineEndTime(times) < desiredEnd) {
    plan.push(createEmptyColumn());
    times = getTimelineTimes();
  }
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
