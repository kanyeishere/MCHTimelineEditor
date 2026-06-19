function serializePlan() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    initialResources,
    plan
  };
}


function canActionRemainAt(action, columnIndex, kind, ogcdIndex, times = getTimelineTimes()) {
  const releaseTime = getReleaseTimeForPlacement(columnIndex, kind, ogcdIndex ?? null, times);
  const resources = getResourcesBefore(columnIndex, kind, ogcdIndex || 0, times);
  if (action.requiresBuff && !isBuffActive(resources, action.requiresBuff, releaseTime)) return false;
  if (action.requiresOverheat && !isBuffActive(resources, 'overheat', releaseTime)) return false;
  const heatChange = getEffectiveHeatChange(action, resources, releaseTime);
  if (heatChange < 0 && resources.heat < Math.abs(heatChange)) return false;
  if (action.batteryCostMin && resources.battery < action.batteryCostMin) return false;
  if ((action.battery || 0) < 0 && resources.battery < Math.abs(action.battery)) return false;
  return true;
}

function sanitizeCurrentPlan() {
  let removed = 0;
  for (let columnIndex = 0; columnIndex < plan.length; columnIndex += 1) {
    const column = plan[columnIndex];
    const gcdAction = actionsById[column.gcd];
    if (gcdAction && !canActionRemainAt(gcdAction, columnIndex, 'gcd', null)) {
      column.gcd = null;
      removed += 1;
    }
    column.ogcds.forEach((actionId, ogcdIndex) => {
      const action = actionsById[actionId];
      if (action && !canActionRemainAt(action, columnIndex, 'ogcd', ogcdIndex)) {
        column.ogcds[ogcdIndex] = null;
        removed += 1;
      }
    });
  }
  return removed;
}

function normalizeImportedResources(imported) {
  const source = imported?.initialResources || {};
  return {
    heat: clampResource(source.heat),
    battery: clampResource(source.battery)
  };
}

function normalizeImportedPlan(imported) {
  const rawPlan = Array.isArray(imported) ? imported : imported?.plan;
  if (!Array.isArray(rawPlan)) throw new Error('导入文件中没有可识别的 plan 数组。');

  const normalized = Array.from({ length: Math.max(INITIAL_SLOT_COUNT, rawPlan.length) }, createEmptyColumn);
  rawPlan.forEach((column, index) => {
    const gcd = actionsById[column?.gcd] ? column.gcd : null;
    const ogcds = Array.isArray(column?.ogcds)
      ? column.ogcds.slice(0, 3).map(actionId => (actionsById[actionId] ? actionId : null))
      : [null, null, null];
    while (ogcds.length < 3) ogcds.push(null);
    const gapAfter = Number(column?.gapAfter || 0);
    const gapName = typeof column?.gapName === 'string' ? column.gapName.trim().slice(0, 20) : '转场';
    normalized[index] = { gcd, ogcds, gapAfter: Number.isFinite(gapAfter) && gapAfter > 0 ? Math.min(180, Math.round(gapAfter * 10) / 10) : 0, gapName: gapName || '转场' };
  });
  return normalized;
}

function encodeTimelineForUrl(data) {
  const json = JSON.stringify(data);
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return btoa(utf8);
}

function decodeTimelineFromUrl(encoded) {
  const binary = atob(encoded);
  const percentEncoded = Array.from(binary, char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
  return JSON.parse(decodeURIComponent(percentEncoded));
}

function loadTimelineData(imported, sourceLabel) {
  initialResources = normalizeImportedResources(imported);
  updateInitialResourceInputs();
  plan = normalizeImportedPlan(imported);
  ensurePlanCoversTimelineTail();
  const removed = sanitizeCurrentPlan();
  showToast(removed ? `已导入 ${sourceLabel}，并移除了 ${removed} 个缺少预备/资源的非法技能。` : `已导入 ${sourceLabel}。`);
  renderTimeline();
}

async function shareTimeline() {
  const encoded = encodeTimelineForUrl(serializePlan());
  const url = new URL(window.location.href);
  url.hash = `plan=${encoded}`;
  const shareUrl = url.toString();

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('已复制分享链接，别人打开该链接即可导入当前时间轴。');
  } catch {
    prompt('复制下面的分享链接：', shareUrl);
    showToast('已生成分享链接。');
  }
}

function loadTimelineFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith('plan=')) return;

  try {
    loadTimelineData(decodeTimelineFromUrl(hash.slice(5)), '分享链接');
  } catch (error) {
    showToast(`分享链接导入失败：${error.message}`);
  }
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
      loadTimelineData(JSON.parse(reader.result), file.name);
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    } finally {
      elements.importPlan.value = '';
    }
  });
  reader.readAsText(file);
}
