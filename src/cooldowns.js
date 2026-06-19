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
    blazingShotTimes: [...(useTimesByAction.get('blazing-shot') || []), ...(useTimesByAction.get('heat-blast') || [])].sort((a, b) => a - b)
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

function getReductionEventTimes(actionId, facts) {
  if (!facts) return [];
  if (actionId === 'gauss-round' || actionId === 'ricochet') return facts.heatBlastTimes;
  if (actionId === 'double-check' || actionId === 'checkmate') return facts.blazingShotTimes;
  return [];
}

function getChargeRecoveryTime(actionId, cooldownStartTime, facts) {
  const action = actionsById[actionId];
  const recast = action?.recast || DEFAULT_GCD_SECONDS;
  let remaining = recast;
  let cursor = cooldownStartTime;
  const reductionTimes = getReductionEventTimes(actionId, facts).filter(time => time > cooldownStartTime).sort((a, b) => a - b);

  for (const reductionTime of reductionTimes) {
    if (cursor + remaining <= reductionTime) return cursor + remaining;
    remaining -= reductionTime - cursor;
    cursor = reductionTime;
    remaining = Math.max(0, remaining - 15);
    if (remaining <= 0) return cursor;
  }

  return cursor + remaining;
}

function getDrillChargesFromEnergy(energy) {
  if (energy >= 40 - TIME_EPSILON) return 2;
  if (energy >= 20 - TIME_EPSILON) return 1;
  return 0;
}

function simulateDrillEnergyState(atTime, useTimes) {
  const maxEnergy = 40;
  const energyCost = 20;
  const recoveryEvents = [];
  let energy = maxEnergy;
  let cursor = START_TIME_SECONDS;
  let blockedUseTime = null;

  const recoverTo = time => {
    if (time <= cursor) return;
    energy = Math.min(maxEnergy, energy + (time - cursor));
    cursor = time;
  };

  useTimes.filter(useTime => useTime <= atTime).sort((a, b) => a - b).forEach(useTime => {
    const fullTime = energy < maxEnergy ? cursor + (maxEnergy - energy) : null;
    if (fullTime !== null && fullTime <= useTime + TIME_EPSILON) {
      recoveryEvents.push(fullTime);
      energy = maxEnergy;
      cursor = fullTime;
    }

    recoverTo(useTime);

    if (energy + TIME_EPSILON < energyCost) {
      blockedUseTime ??= useTime;
      return;
    }

    energy = Math.max(0, energy - energyCost);
    cursor = useTime;
  });

  const fullTime = energy < maxEnergy ? cursor + (maxEnergy - energy) : null;
  if (fullTime !== null && fullTime <= atTime + TIME_EPSILON) {
    recoveryEvents.push(fullTime);
    energy = maxEnergy;
    cursor = fullTime;
  }

  recoverTo(atTime);

  return {
    charges: getDrillChargesFromEnergy(energy),
    displayCharges: getDrillChargesFromEnergy(energy),
    energy,
    nextRecoveryTime: energy < maxEnergy ? cursor + (maxEnergy - energy) : null,
    recoveryEvents,
    blockedUseTime
  };
}

function simulateChargeState(actionId, atTime, useTimes, facts) {
  if (actionId === 'drill') return simulateDrillEnergyState(atTime, useTimes);

  const action = actionsById[actionId];
  const maxCharges = action?.charges || 1;
  let charges = maxCharges;
  let displayChargesAtTime = null;
  let nextRecoveryTime = null;
  const recoveryEvents = [];
  let blockedUseTime = null;

  const recoverUntil = (limitTime, includeEqual = true) => {
    while (
      nextRecoveryTime !== null
      && (includeEqual ? nextRecoveryTime <= limitTime + TIME_EPSILON : nextRecoveryTime < limitTime - TIME_EPSILON)
    ) {
      const recoveredAt = nextRecoveryTime;
      recoveryEvents.push(recoveredAt);
      charges = Math.min(maxCharges, charges + 1);
      nextRecoveryTime = charges < maxCharges
        ? getChargeRecoveryTime(actionId, recoveredAt, facts)
        : null;
    }
  };

  useTimes.filter(useTime => useTime <= atTime).sort((a, b) => a - b).forEach(useTime => {
    recoverUntil(useTime, false);

    if (nextRecoveryTime !== null && Math.abs(nextRecoveryTime - useTime) <= TIME_EPSILON) {
      const recoveredAt = nextRecoveryTime;
      if (Math.abs(atTime - useTime) <= TIME_EPSILON) {
        displayChargesAtTime = Math.max(0, Math.min(maxCharges, charges + 1) - 1);
      }
      charges = Math.max(0, charges - 1);
      nextRecoveryTime = getChargeRecoveryTime(actionId, recoveredAt, facts);
      return;
    }

    if (charges <= 0) {
      blockedUseTime ??= useTime;
      return;
    }

    charges -= 1;
    if (nextRecoveryTime === null) {
      nextRecoveryTime = getChargeRecoveryTime(actionId, useTime, facts);
    }
  });

  recoverUntil(atTime);

  return {
    charges,
    displayCharges: displayChargesAtTime ?? charges,
    nextRecoveryTime,
    recoveryEvents,
    blockedUseTime
  };
}

function getAvailableChargesAtWithFacts(actionId, atTime, facts) {
  const action = actionsById[actionId];
  if (!action?.charges) return 1;
  const useTimes = facts.useTimesByAction.get(actionId) || [];
  return simulateChargeState(actionId, atTime, useTimes, facts).charges;
}

function getDisplayChargesAtWithFacts(actionId, atTime, facts) {
  const action = actionsById[actionId];
  if (!action?.charges) return 1;
  const useTimes = facts.useTimesByAction.get(actionId) || [];
  return simulateChargeState(actionId, atTime, useTimes, facts).displayCharges;
}

function getChargeRecoveryEventsFromFacts(actionId, facts) {
  const action = actionsById[actionId];
  if (!action?.charges) return [];
  const useTimes = facts.useTimesByAction.get(actionId) || [];
  return simulateChargeState(actionId, getSimulationEndTime(), useTimes, facts).recoveryEvents;
}

function getRobotEventsFromFacts(facts) {
  const events = [];
  const queenTimes = facts.useTimesByAction.get('automaton-queen') || [];
  queenTimes.forEach(queenTime => {
    [0, 1, 2, 3, 4].forEach(index => events.push({ actionId: 'arm-punch', time: queenTime + 5.75 + (index * 1.5) }));
    events.push({ actionId: 'pile-bunker', time: queenTime + 13.25 });
    events.push({ actionId: 'crowned-collider', time: queenTime + 15.75 });
  });
  return events.sort((a, b) => a.time - b.time);
}


function getMajorCooldownEventsFromFacts(facts) {
  const events = [];

  MAJOR_COOLDOWN_IDS.forEach(actionId => {
    const action = actionsById[actionId];
    if (!action) return;
    events.push({ actionId, time: START_TIME_SECONDS, kind: 'initial' });

    if (action.charges) {
      getChargeRecoveryEventsFromFacts(actionId, facts)
        .forEach(time => events.push({ actionId, time, kind: 'ready' }));
      return;
    }

    const readyTimes = (facts.useTimesByAction.get(actionId) || []).map(useTime => useTime + (action.recast || DEFAULT_GCD_SECONDS));
    readyTimes.forEach(time => events.push({ actionId, time, kind: 'ready' }));
  });

  return events
    .filter(event => event.time >= START_TIME_SECONDS && event.time <= getSimulationEndTime())
    .sort((a, b) => a.time - b.time || MAJOR_COOLDOWN_IDS.indexOf(a.actionId) - MAJOR_COOLDOWN_IDS.indexOf(b.actionId));
}

function bucketEventsByColumn(events, times) {
  const buckets = Array.from({ length: plan.length }, () => []);
  let columnIndex = 0;

  events.forEach(event => {
    while (columnIndex < times.length - 1 && event.time >= times[columnIndex + 1]) columnIndex += 1;
    const displayColumnIndex = getCooldownDisplayColumnIndex(event.time, columnIndex, times);
    if (displayColumnIndex >= 0 && displayColumnIndex < buckets.length) buckets[displayColumnIndex].push(event);
  });

  return buckets;
}

function getCooldownDisplayColumnIndex(eventTime, columnIndex, times) {
  const column = plan[columnIndex];
  const columnStart = times[columnIndex];
  const columnEnd = times[columnIndex + 1] ?? Infinity;
  if (eventTime < columnStart || eventTime >= columnEnd) return -1;

  const gapAfter = getColumnGapAfter(column);
  if (!gapAfter || columnIndex >= plan.length - 1) return columnIndex;

  const transitionStart = columnStart + getColumnBaseDuration(column);
  if (eventTime >= transitionStart && eventTime < columnEnd) return columnIndex + 1;
  return columnIndex;
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
