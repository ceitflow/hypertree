export function createTestUI(container: HTMLElement) {
  // todo this is test ui only
  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      const rect = entry.contentRect;
      const toolbar = document.getElementById('toolbar')!;
      const spanWidth = toolbar.getElementsByTagName('span')[0].getBoundingClientRect().width;
      let temp = rect.width * 2;
      while (temp > 0) {
        const s = document.createElement('span');
        s.innerText = 'Graphkit';
        toolbar.append(s);
        temp -= spanWidth;
      }
    }
  });
  resize.observe(container);
  //
}
