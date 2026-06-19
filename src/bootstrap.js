elements.exportPlan.addEventListener('click', exportTimeline);
elements.sharePlan.addEventListener('click', shareTimeline);
window.addEventListener('hashchange', loadTimelineFromHash);
elements.importPlan.addEventListener('change', event => {
  const [file] = event.target.files;
  if (file) importTimeline(file);
});
elements.addBasicCombo.addEventListener('click', () => addGcdSequence(['heated-split-shot', 'heated-slug-shot', 'heated-clean-shot'], '基础连'));
elements.addOverheatCombo.addEventListener('click', addOverheatCombo);
elements.addTransitionGap.addEventListener('click', () => editTransitionGap());
[elements.initialHeat, elements.initialBattery].forEach(input => {
  input?.addEventListener('input', () => {
    initialResources = {
      heat: clampResource(elements.initialHeat?.value),
      battery: clampResource(elements.initialBattery?.value)
    };
    renderTimeline();
  });
});

elements.reset.addEventListener('click', () => {
  plan = createEmptyPlan();
  initialResources = { heat: 0, battery: 0 };
  updateInitialResourceInputs();
  selectedColumnIndex = null;
  showToast('已重置时间轴。');
  renderTimeline();
});

enableHorizontalWheelScroll();
enableTimelineGridClicks();
updateInitialResourceInputs();
renderPalette();
renderTimeline();
loadTimelineFromHash();
