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
    card.addEventListener('click', () => addActionByClick(card.dataset.id));
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
    action.buffDuration ? `Buff时间：${action.buffDuration}秒` : '',
    action.grantsBuffs ? `附加：${action.grantsBuffs.map(buff => `${BUFF_DEFINITIONS[buff.id]?.label || buff.id}${buff.duration}秒`).join('、')}` : '',
    action.requiresBuff ? `发动条件：${BUFF_DEFINITIONS[action.requiresBuff]?.label || action.requiresBuff}` : '',
    action.requiresOverheat ? '发动条件：过热' : ''
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
  ensurePlanCoversTimelineTail();
  const times = getTimelineTimes();
  const facts = collectTimelineFacts(times);
  const buffWindows = getBuffWindows(times);
  const robotBuckets = bucketRobotEventsByColumn(getRobotEventsFromFacts(facts), times);
  const robotSummons = getRobotSummons(times);
  const majorCooldownBuckets = bucketEventsByColumn(getMajorCooldownEventsFromFacts(facts), times);
  deriveState(times, facts);
  const lastState = derivedState.at(-1) || { heat: 0, battery: 0, activeBuffs: [], drillCharges: 2, reassembleCharges: 2, doubleCheckCharges: 3, checkmateCharges: 3 };
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
  const currentColumnIndex = getCurrentColumnIndex();
  plan.forEach((column, columnIndex) => {
    const element = document.createElement('div');
    const gapAfter = getColumnGapAfter(column);
    element.className = `timeline-column ${columnIndex === currentColumnIndex ? 'current-column' : ''}`;
    element.dataset.columnIndex = String(columnIndex);
    element.innerHTML = `
      <div class="time-label">${formatTime(timeOf(columnIndex, times))}</div>
      ${renderMajorCooldownCell(majorCooldownBuckets[columnIndex])}
      ${renderBuffCell(derivedState[columnIndex].activeBuffs)}
      <div class="charge-row drill-row" title="钻头层数 ${derivedState[columnIndex].drillCharges} / 2"><i style="width:${(derivedState[columnIndex].drillCharges / 2) * 100}%"></i></div>
      <div class="charge-row reassemble-row" title="整备层数 ${derivedState[columnIndex].reassembleCharges} / 2"><i style="width:${(derivedState[columnIndex].reassembleCharges / 2) * 100}%"></i></div>
      <div class="charge-row double-row" title="双将层数 ${derivedState[columnIndex].doubleCheckCharges} / 3"><i style="width:${(derivedState[columnIndex].doubleCheckCharges / 3) * 100}%"></i></div>
      <div class="charge-row check-row" title="将死层数 ${derivedState[columnIndex].checkmateCharges} / 3"><i style="width:${(derivedState[columnIndex].checkmateCharges / 3) * 100}%"></i></div>
      <div class="resource-bars" title="热量 ${derivedState[columnIndex].heat} / 100｜电量 ${derivedState[columnIndex].battery} / 100">
        <i class="heat-bar" title="热量 ${derivedState[columnIndex].heat} / 100" style="height:${derivedState[columnIndex].heat}%"></i>
        <i class="battery-bar" title="电量 ${derivedState[columnIndex].battery} / 100" style="height:${derivedState[columnIndex].battery}%"></i>
      </div>
    `;
    element.querySelectorAll('.major-cd-badge').forEach(badge => {
      badge.addEventListener('click', event => {
        event.stopPropagation();
        addMajorCooldownAction(badge.dataset.actionId, columnIndex);
      });
    });
    element.append(createSlot(columnIndex, 'gcd', null, column.gcd, false, timeOf(columnIndex, times), buffWindows));
    [0, 1, 2].forEach(slotIndex => {
      element.append(createSlot(columnIndex, 'ogcd', slotIndex, column.ogcds[slotIndex], slotIndex >= maxOgcdSlotsFor(column), timeOf(columnIndex, times) + ((slotIndex + 1) * 0.6), buffWindows));
    });
    const columnRobotSummons = getColumnRobotSummons(columnIndex, times, robotSummons);
    const robotActive = isRobotActiveInColumn(columnIndex, times, robotSummons);
    element.append(createRobotSlot(robotBuckets[columnIndex][0], buffWindows, columnRobotSummons, robotActive, 0));
    element.append(createRobotSlot(robotBuckets[columnIndex][1], buffWindows, columnRobotSummons, robotActive, 1));
    fragment.append(element);
    if (gapAfter) fragment.append(createTransitionColumn(columnIndex, gapAfter, column.gapName, times));
  });
  elements.grid.append(fragment);
}

function createTransitionColumn(columnIndex, gapAfter, gapName, times) {
  const start = timeOf(columnIndex, times) + getColumnBaseDuration(plan[columnIndex]);
  const end = start + gapAfter;
  const label = String(gapName || '转场').trim() || '转场';
  const element = document.createElement('div');
  element.className = 'timeline-column transition-column';
  element.innerHTML = `
    <button class="transition-cell" type="button" title="点击修改/清除 ${escapeHtml(label)}：${formatTime(start)} → ${formatTime(end)}">
      <strong>${escapeHtml(label)}</strong>
      <span>+${formatTime(gapAfter)}</span>
      <small>${formatTime(start)} → ${formatTime(end)}</small>
    </button>
  `;
  element.querySelector('.transition-cell').addEventListener('click', () => editTransitionGap(columnIndex));
  return element;
}

function renderBuffCell(activeBuffs) {
  const content = activeBuffs.map(buff => {
    const action = actionsById[buff.actionId];
    const icon = action?.icon || '';
    const clickTarget = getBuffClickActionId(buff.id);
    const clickable = clickTarget ? ` data-action-id="${clickTarget}" title="${buff.label}：点击添加 ${actionsById[clickTarget]?.cn || ''}"` : ` title="${buff.label}"`;
    return `<span class="buff-badge buff-${buff.id} ${clickTarget ? 'clickable-buff' : ''}"${clickable}><img src="${icon}" alt="${buff.label}"></span>`;
  }).join('');
  return `<div class="buff-row" title="Buff：爆发药 / 野火 / 超荷预备 / 整备 / 过热 / 掘地飞轮预备 / 全金属爆发预备">${content}</div>`;
}

function getBuffClickActionId(buffId) {
  return {
    'excavator-prep': 'excavator',
    'full-metal-prep': 'full-metal-field',
    'barrel-prep': 'hypercharge'
  }[buffId] || null;
}

function renderMajorCooldownCell(events) {
  const content = events.map(event => {
    const action = actionsById[event.actionId];
    const title = event.kind === 'initial'
      ? `${action.cn} 开场可用`
      : event.kind === 'charge'
        ? `${action.cn} 当前 ${event.charges} / ${action.charges} 层，可用`
        : `${action.cn} 在 ${formatTime(event.time)} 转好`;
    const label = event.kind === 'charge' ? `${event.chargeIndex + 1}/${action.charges}` : formatTime(event.time);
    return `<span class="major-cd-badge ${event.kind}" data-action-id="${event.actionId}" title="${title}"><img src="${action.icon}" alt="${action.cn}"><small>${label}</small></span>`;
  }).join('');
  return `<div class="major-cd-row" title="大技能CD提醒：钻头 / 空气锚 / 回转飞锯 / 枪管加热 / 野火 / 爆发药水">${content}</div>`;
}

function createSlot(columnIndex, kind, ogcdIndex, actionId, disabled = false, releaseTime = timeOf(columnIndex), buffWindows = []) {
  const slot = document.createElement('div');
  slot.className = `timeline-slot ${kind === 'gcd' ? 'gcd-slot' : 'ogcd-slot'} ${disabled ? 'disabled-slot' : ''}`;
  if (!disabled) {
    slot.addEventListener('dragover', event => event.preventDefault());
    slot.addEventListener('drop', event => handleDrop(event, columnIndex, kind, ogcdIndex));
  }

  if (!actionId && !disabled) {
    slot.addEventListener('click', () => selectColumn(columnIndex));
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


function getRobotSummons(times = getTimelineTimes()) {
  const summons = [];
  plan.forEach((column, columnIndex) => {
    column.ogcds.forEach((actionId, ogcdIndex) => {
      if (actionId !== 'automaton-queen') return;
      const start = timeOf(columnIndex, times) + ((ogcdIndex + 1) * 0.6);
      const resources = getResourcesBefore(columnIndex, 'ogcd', ogcdIndex, times);
      summons.push({ start, end: start + 15.75, battery: resources.battery });
    });
  });
  return summons;
}

function getColumnRobotSummons(columnIndex, times, summons) {
  const start = timeOf(columnIndex, times);
  const end = timeOf(columnIndex + 1, times);
  return summons.filter(summon => summon.start >= start && summon.start < end);
}

function isRobotActiveInColumn(columnIndex, times, summons) {
  const start = timeOf(columnIndex, times);
  const end = timeOf(columnIndex + 1, times);
  return summons.some(summon => summon.start < end && summon.end >= start);
}

function createRobotSlot(events, buffWindows, summonStarts = [], active = false, rowIndex = 0) {
  const slot = document.createElement('div');
  slot.className = `timeline-slot robot-slot ${active ? 'robot-active-slot' : ''}`;
  const summonBadges = rowIndex === 0 ? summonStarts.map(summon => `<span class="robot-battery" title="后式自走人偶消耗电量 ${summon.battery}">电${summon.battery}</span>`).join('') : '';
  slot.innerHTML = summonBadges + events.map(event => {
    const action = actionsById[event.actionId];
    return `<span class="placed-action robot-action ${isInBuffWindow(event.time, buffWindows) ? 'buffed-action' : ''}"><small>${formatTime(event.time)}</small><img class="placed-icon" src="${action.icon}" alt="${action.cn}" title="${action.cn} ${formatTime(event.time)}"></span>`;
  }).join('');
  return slot;
}
