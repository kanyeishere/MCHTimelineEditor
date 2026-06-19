function placeAction(action, columnIndex, kind, ogcdIndex = null, source = null, options = {}) {
  const times = getTimelineTimes();
  const dropTime = timeOf(columnIndex, times);
  const prepullGcdSlotAllowsOgcd = kind === 'gcd' && dropTime < 0 && action.type === 'ogcd';
  if (action.type !== kind && !prepullGcdSlotAllowsOgcd) {
    if (!options.silent) showToast(kind === 'gcd' ? '这里只能放战技（GCD）；但 -15s 到 0s 倒计时区间的GCD格可以放能力技。' : '每个GCD之间最多插入3个能力技能（oGCD）。');
    return false;
  }
  if (kind === 'ogcd' && ogcdIndex >= maxOgcdSlotsFor(plan[columnIndex])) {
    if (!options.silent) showToast('1.5秒短GCD后只能插入2个能力技能。');
    return false;
  }

  const releaseTime = getReleaseTimeForPlacement(columnIndex, kind, ogcdIndex ?? null, times);
  const destination = { columnIndex, kind, ogcdIndex: ogcdIndex ?? null };
  const availability = getAvailability(action, columnIndex, times, { kind, ogcdIndex: ogcdIndex ?? null, source, destination });
  if (!availability.ok) {
    if (!options.silent) showToast(`${action.cn} ${availability.message}，不能放在 ${formatTime(releaseTime)}。`);
    return false;
  }

  const availableResources = getResourcesBefore(columnIndex, kind, ogcdIndex || 0, times);
  if (action.requiresBuff && !isBuffActive(availableResources, action.requiresBuff, releaseTime)) {
    if (!options.silent) showToast(`${action.cn} 需要 ${BUFF_DEFINITIONS[action.requiresBuff]?.label || action.requiresBuff}。`);
    return false;
  }
  if (action.requiresOverheat && !isBuffActive(availableResources, 'overheat', releaseTime)) {
    if (!options.silent) showToast(`${action.cn} 需要过热状态。`);
    return false;
  }
  const heatChange = getEffectiveHeatChange(action, availableResources, releaseTime);
  if (heatChange < 0 && availableResources.heat < Math.abs(heatChange)) {
    if (!options.silent) showToast(`${action.cn} 需要 ${Math.abs(heatChange)} 热量，当前只有 ${availableResources.heat}。`);
    return false;
  }
  if (action.batteryCostMin && availableResources.battery < action.batteryCostMin) {
    if (!options.silent) showToast(`${action.cn} 至少需要 ${action.batteryCostMin} 电量，当前只有 ${availableResources.battery}，发动后会耗尽全部电量。`);
    return false;
  }
  if ((action.battery || 0) < 0 && availableResources.battery < Math.abs(action.battery)) {
    if (!options.silent) showToast(`${action.cn} 需要 ${Math.abs(action.battery)} 电量，当前只有 ${availableResources.battery}。`);
    return false;
  }

  if (source && !isSameLocation(source, columnIndex, kind, ogcdIndex ?? null)) {
    if (source.kind === 'gcd') plan[source.columnIndex].gcd = null;
    else plan[source.columnIndex].ogcds[source.ogcdIndex] = null;
  }
  if (kind === 'gcd') {
    plan[columnIndex].gcd = action.id;
    if (action.gcdDuration === 1.5) plan[columnIndex].ogcds[2] = null;
  } else {
    plan[columnIndex].ogcds[ogcdIndex] = action.id;
  }
  selectedColumnIndex = columnIndex;
  if (!options.skipRender) renderTimeline();
  if (!options.silent) showToast(`${action.cn} 已放入 ${formatTime(releaseTime)}。`);
  return true;
}

function addMajorCooldownAction(actionId, columnIndex) {
  const action = actionsById[actionId];
  if (!action) return;
  if (action.type === 'gcd') {
    if (plan[columnIndex].gcd) return showToast(`${formatTime(timeOf(columnIndex))} 的GCD格已经有技能。`);
    placeAction(action, columnIndex, 'gcd');
    return;
  }
  const ogcdIndex = findFirstEmptyOgcdSlot(columnIndex);
  if (ogcdIndex < 0) return showToast(`${formatTime(timeOf(columnIndex))} 下面没有空的能力技槽。`);
  placeAction(action, columnIndex, 'ogcd', ogcdIndex);
}

function addActionByClick(actionId) {
  const action = actionsById[actionId];
  if (!action || action.type === 'robot') return;
  const columnIndex = getCurrentColumnIndex();
  if (action.type === 'gcd') {
    const targetIndex = plan[columnIndex].gcd ? findNextEmptyGcdSlot(columnIndex + 1) : columnIndex;
    if (targetIndex < 0) return showToast('后续没有空的GCD格。');
    placeAction(action, targetIndex, 'gcd');
    return;
  }
  const ogcdIndex = findFirstEmptyOgcdSlot(columnIndex);
  if (ogcdIndex < 0) return showToast('当前GCD下面没有空的能力技槽。');
  placeAction(action, columnIndex, 'ogcd', ogcdIndex);
}

function isColumnEmpty(column) {
  return !column.gcd && column.ogcds.every(actionId => !actionId);
}

function findPreviousGcdSlot(startIndex) {
  for (let index = Math.max(0, startIndex); index >= 0; index -= 1) {
    if (plan[index].gcd) return index;
  }
  return -1;
}

function findNextNonEmptyColumn(startIndex) {
  for (let index = Math.max(0, startIndex); index < plan.length; index += 1) {
    if (!isColumnEmpty(plan[index])) return index;
  }
  return -1;
}

function canCollapseBlankColumns(anchorIndex, nextIndex) {
  if (nextIndex <= anchorIndex + 1) return false;
  for (let index = anchorIndex + 1; index < nextIndex; index += 1) {
    if (!isColumnEmpty(plan[index])) return false;
  }
  return true;
}

function collapseBlankColumns(anchorIndex, nextIndex) {
  const removeCount = nextIndex - anchorIndex - 1;
  if (removeCount <= 0) return;
  for (let index = anchorIndex + 1; index < plan.length - removeCount; index += 1) {
    plan[index] = plan[index + removeCount];
  }
  for (let index = plan.length - removeCount; index < plan.length; index += 1) {
    plan[index] = createEmptyColumn();
  }
}

function resolveTransitionEditTarget(columnIndex, times) {
  const selectedIndex = Math.max(0, Math.min(plan.length - 1, columnIndex));
  if (plan[selectedIndex].gcd) {
    return { anchorIndex: selectedIndex, defaultGap: getColumnGapAfter(plan[selectedIndex]), collapseNextIndex: -1 };
  }

  const anchorIndex = findPreviousGcdSlot(selectedIndex);
  if (anchorIndex < 0) return { anchorIndex: -1, defaultGap: 0, collapseNextIndex: -1 };

  const existingGap = getColumnGapAfter(plan[anchorIndex]);
  const nextIndex = findNextNonEmptyColumn(anchorIndex + 1);
  const shouldCollapse = !existingGap && canCollapseBlankColumns(anchorIndex, nextIndex);
  const blankDuration = shouldCollapse
    ? Math.max(0, timeOf(nextIndex, times) - (timeOf(anchorIndex, times) + getColumnBaseDuration(plan[anchorIndex])))
    : existingGap;

  return { anchorIndex, defaultGap: blankDuration, collapseNextIndex: shouldCollapse ? nextIndex : -1 };
}

function addGcdSequence(actionIds, label) {
  let nextIndex = findNextEmptyGcdSlot(getLastGcdIndex() + 1);
  if (nextIndex < 0) return showToast('后续没有空的GCD格。');
  const placed = [];
  actionIds.forEach(actionId => {
    const action = actionsById[actionId];
    nextIndex = findNextEmptyGcdSlot(nextIndex);
    if (action && nextIndex >= 0 && placeAction(action, nextIndex, 'gcd', null, null, { silent: true, skipRender: true })) {
      placed.push(action.cn);
      nextIndex += 1;
    }
  });
  renderTimeline();
  showToast(placed.length ? `已添加${label}：${placed.join(' → ')}。` : `${label}没有可放置的位置。`);
}


function editTransitionGap(columnIndex = getCurrentColumnIndex()) {
  const times = getTimelineTimes();
  const target = resolveTransitionEditTarget(columnIndex, times);
  const index = target.anchorIndex;
  if (index < 0 || !plan[index].gcd) {
    showToast('请先选择或放置一个GCD技能，再添加转场空白。');
    return;
  }

  const input = prompt('请输入当前GCD结束后的Boss上天/转场空白秒数；输入0可清除。', target.defaultGap ? String(Number(target.defaultGap.toFixed(1))) : '5.5');
  if (input === null) return;

  const normalizedInput = input.trim().replace('秒', '').replace('s', '');
  const seconds = Number(normalizedInput);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 180) {
    showToast('转场空白时长需要是 0 到 180 秒之间的数字。');
    return;
  }

  const roundedSeconds = Math.round(seconds * 10) / 10;
  let gapName = plan[index].gapName || '转场';
  if (roundedSeconds > 0) {
    const nameInput = prompt('请输入这段空白/转场的名字，例如 P2转场、Boss上天。', gapName);
    if (nameInput === null) return;
    gapName = nameInput.trim().slice(0, 20) || '转场';
  }

  if (target.collapseNextIndex > 0) collapseBlankColumns(index, target.collapseNextIndex);
  plan[index].gapAfter = roundedSeconds;
  plan[index].gapName = gapName;
  renderTimeline();
  showToast(plan[index].gapAfter
    ? `已在 ${formatTime(timeOf(index, times))} 的GCD结束后添加 ${gapName} ${formatTime(plan[index].gapAfter)}。`
    : `已清除 ${formatTime(timeOf(index, times))} 后的转场空白。`);
}

function addOverheatCombo() {
  const lastGcdIndex = getLastGcdIndex();
  if (lastGcdIndex < 0) return showToast('请先放置一个GCD技能，再添加过热连。');

  const hyperchargeSlot = findFirstEmptyOgcdSlot(lastGcdIndex);
  if (hyperchargeSlot < 0) return showToast('最后一个GCD下面没有空的能力技槽，不能添加过热连。');

  let scanIndex = lastGcdIndex + 1;
  const blazingSlots = [];
  for (let count = 0; count < 5; count += 1) {
    const nextSlot = findNextEmptyGcdSlot(scanIndex);
    if (nextSlot < 0) return showToast('后续没有足够的空GCD格，不能添加完整过热连。');
    blazingSlots.push(nextSlot);
    scanIndex = nextSlot + 1;
  }

  const hypercharge = actionsById.hypercharge;
  if (!placeAction(hypercharge, lastGcdIndex, 'ogcd', hyperchargeSlot, null, { skipRender: true })) {
    renderTimeline();
    return;
  }

  const placed = ['超荷'];
  for (const slotIndex of blazingSlots) {
    if (placeAction(actionsById['blazing-shot'], slotIndex, 'gcd', null, null, { silent: true, skipRender: true })) {
      placed.push('烈焰弹');
    }
  }
  renderTimeline();
  showToast(`已添加过热连：${placed.join(' → ')}。`);
}

function handleDrop(event, columnIndex, kind, ogcdIndex) {
  event.preventDefault();
  document.body.classList.remove('dragging');
  const action = actionsById[event.dataTransfer.getData('text/plain')];
  const sourceText = event.dataTransfer.getData('application/x-mch-source');
  const source = sourceText ? JSON.parse(sourceText) : null;
  if (!action) return;

  if (action.type === 'robot') {
    showToast('机器人技能由后式自走人偶自动生成，不能手动放置。');
    return;
  }

  placeAction(action, columnIndex, kind, ogcdIndex, source);
}

function showToast(message) {
  elements.toast.textContent = message;
}
