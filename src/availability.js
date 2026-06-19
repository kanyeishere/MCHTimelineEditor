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
  const facts = collectTimelineFacts(times);
  return getAvailableChargesAtWithFacts(actionId, atTime, facts);
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
    const facts = collectTimelineFacts(times);
    const existingUseTimes = useEvents.map(use => use.time);
    const beforeCandidate = simulateChargeState(action.id, now, existingUseTimes, facts);

    if (beforeCandidate.charges <= 0) {
      const remaining = beforeCandidate.nextRecoveryTime === null ? action.recast : Math.max(0, beforeCandidate.nextRecoveryTime - now);
      return { ok: false, message: `充能中，约 ${Math.ceil(remaining)} 秒后可用` };
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
