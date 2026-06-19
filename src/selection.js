function getLastGcdIndex() {
  for (let index = plan.length - 1; index >= 0; index -= 1) {
    if (actionsById[plan[index].gcd]?.type === 'gcd') return index;
  }
  return -1;
}

function getCurrentColumnIndex() {
  const lastGcdIndex = getLastGcdIndex();
  const fallbackIndex = lastGcdIndex >= 0 ? lastGcdIndex : 0;
  return Math.max(0, Math.min(plan.length - 1, selectedColumnIndex ?? fallbackIndex));
}

function selectColumn(columnIndex) {
  selectedColumnIndex = Math.max(0, Math.min(plan.length - 1, columnIndex));
  renderTimeline();
}

function findNextEmptyGcdSlot(startIndex) {
  for (let index = Math.max(0, startIndex); index < plan.length; index += 1) {
    if (!plan[index].gcd) return index;
  }
  return -1;
}

function findFirstEmptyOgcdSlot(columnIndex) {
  const maxSlots = maxOgcdSlotsFor(plan[columnIndex]);
  for (let index = 0; index < maxSlots; index += 1) {
    if (!plan[columnIndex].ogcds[index]) return index;
  }
  return -1;
}
