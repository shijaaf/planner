// Calendar clock only. Focus-session durations keep their existing clock.
(() => {
  "use strict";
  const KEY = "greenflow_clock_v1";
  let anchor = null;
  let status = "device";
  let inFlight = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    const elapsed = Date.now() - saved?.deviceMs;
    if (
      Number.isFinite(saved?.utcMs) &&
      elapsed >= 0 &&
      elapsed <= 7 * 86400000
    ) {
      anchor = { utcMs: saved.utcMs + elapsed, tick: performance.now() };
      status = "estimated";
    }
  } catch (_) {}

  const now = () =>
    new Date(
      anchor ? anchor.utcMs + performance.now() - anchor.tick : Date.now(),
    );

  async function sync() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      try {
        const start = performance.now();
        const response = await fetch("./api/time", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Time unavailable");
        const sample = await response.json();
        const utcMs = sample.utcMs;
        if (
          !Number.isFinite(utcMs) ||
          !Number.isFinite(sample.syncedAgoSeconds) ||
          sample.syncedAgoSeconds < 0 ||
          utcMs < Date.UTC(2020, 0, 1) ||
          utcMs >= Date.UTC(2101, 0, 1)
        )
          throw new Error("Invalid time sample");
        anchor = {
          utcMs: utcMs + (performance.now() - start) / 2,
          tick: performance.now(),
        };
        status = sample.syncedAgoSeconds <= 600 ? "verified" : "estimated";
        try {
          localStorage.setItem(
            KEY,
            JSON.stringify({ utcMs: now().getTime(), deviceMs: Date.now() }),
          );
        } catch (_) {}
        return true;
      } catch (_) {
        status = anchor ? "estimated" : "device";
        return false;
      } finally {
        clearTimeout(timeout);
      }
    })();
    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  }

  window.GreenFlowClock = {
    now,
    sync,
    get status() {
      return status;
    },
  };
})();
