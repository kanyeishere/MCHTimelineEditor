let timelineColumnWidth = 66;

function setTimelineZoom(nextWidth, anchorRatio = 0) {
  const timeline = document.querySelector('.timeline');
  const previousScrollableWidth = Math.max(1, timeline.scrollWidth - timeline.clientWidth);
  const previousScrollRatio = (timeline.scrollLeft + (timeline.clientWidth * anchorRatio)) / previousScrollableWidth;
  timelineColumnWidth = Math.max(36, Math.min(140, nextWidth));
  document.documentElement.style.setProperty('--timeline-column-width', `${timelineColumnWidth}px`);
  requestAnimationFrame(() => {
    const nextScrollableWidth = Math.max(1, timeline.scrollWidth - timeline.clientWidth);
    timeline.scrollLeft = (previousScrollRatio * nextScrollableWidth) - (timeline.clientWidth * anchorRatio);
  });
}

function enableHorizontalWheelScroll() {
  const timeline = document.querySelector('.timeline');
  timeline.addEventListener('wheel', event => {
    if (event.ctrlKey) {
      event.preventDefault();
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      const anchorRatio = Math.max(0, Math.min(1, (event.clientX - timeline.getBoundingClientRect().left) / timeline.clientWidth));
      setTimelineZoom(timelineColumnWidth + (zoomDirection * 6), anchorRatio);
      return;
    }
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    timeline.scrollLeft += event.deltaY;
  }, { passive: false });
}

function enableTimelineGridClicks() {
  elements.grid.addEventListener('click', event => {
    const buffBadge = event.target.closest('.buff-badge[data-action-id]');
    if (!buffBadge) return;

    event.stopPropagation();
    const column = buffBadge.closest('.timeline-column');
    const columnIndex = Number(column?.dataset.columnIndex);
    if (!Number.isInteger(columnIndex)) return;
    addMajorCooldownAction(buffBadge.dataset.actionId, columnIndex);
  });
}
