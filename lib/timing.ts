export function createTiming(label: string) {
  const start = performance.now();

  function mark(step: string) {
    const elapsed = Math.round(performance.now() - start);
    console.info(`[timing] ${label}:${step} ${elapsed}ms`);
  }

  return {
    mark,
    done() {
      mark("done");
    },
  };
}
