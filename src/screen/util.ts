export const addContainerListeners = (container: HTMLElement, map: { [type: string]: (e: any) => void }) => {
  Object.entries(map).forEach(([type, callback]) => {
    document.addEventListener(type, e => {
      if (container.contains(e.target as Element)) {
        callback(e);
      }
    });
  });
};
