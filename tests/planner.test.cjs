const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const storageKey = "greenflow_pro_v5";
const day = "2026-10-07";
const instant = "2026-10-07T10:00:00+03:30";
let server, browser, origin;

function fixture(overrides = {}) {
  return {
    seq: 2,
    tasks: [
      {
        id: "t1",
        key: "GF-1",
        title: "Research",
        description: "",
        priority: "High",
        estimate: 120,
        status: "todo",
        due: "",
        label: "",
        subtasks: [],
      },
    ],
    plans: [],
    logs: [],
    routines: [],
    reminders: [],
    settings: {
      dayKey: day,
      dailyFocusTaskId: "t1",
      dailyGoalMinutes: 120,
      logMode: "week",
      focus: {
        minutes: 25,
        remaining: 1500,
        running: false,
        taskId: "t1",
        autoLog: true,
        endAt: null,
        startedAt: null,
      },
    },
    ...overrides,
  };
}
before(async () => {
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json",
  };
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;
    if (pathname === "/legacy-start.html") {
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end("<!doctype html><title>Legacy worker setup</title>");
      return;
    }
    if (pathname === "/sw.js" && url.searchParams.get("v") === "legacy") {
      const legacy = `
        const CACHE='greenflow-shell-v21';
        const assets=['./index.html','./app.js','./styles.css'];
        self.addEventListener('install',event=>event.waitUntil((async()=>{
          const cache=await caches.open(CACHE);
          await cache.put(new URL('./index.html',self.location).href,new Response('<!doctype html><title>Old GreenFlow</title><body>Old GreenFlow<script src="./app.js"><\\/script>',{headers:{'Content-Type':'text/html'}}));
          await cache.put(new URL('./app.js',self.location).href,new Response('window.legacyBuild=true;',{headers:{'Content-Type':'text/javascript'}}));
          await self.skipWaiting();
        })()));
        self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
        self.addEventListener('fetch',event=>{
          const url=new URL(event.request.url);url.search='';
          event.respondWith((async()=>{
            const cached=await (await caches.open(CACHE)).match(url.href);
            return cached||fetch(event.request);
          })());
        });
      `;
      res
        .writeHead(200, {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-store",
        })
        .end(legacy);
      return;
    }
    const target = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const data = await fs.readFile(target);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404).end("Missing asset");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + server.address().port;
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  browser = await chromium.launch({ executablePath, headless: true });
});
after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

async function withPage(run, data = fixture(), time = instant, options = {}) {
  const context = await browser.newContext({
    timezoneId: options.timezoneId || "Asia/Tehran",
    serviceWorkers: options.serviceWorkers || "block",
    viewport: options.viewport || { width: 1440, height: 1000 },
  });
  await context.addInitScript(
    ({ storageKey, data }) => {
      if (!localStorage.getItem(storageKey))
        localStorage.setItem(
          storageKey,
          typeof data === "string" ? data : JSON.stringify(data),
        );
    },
    { storageKey, data },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date(time) });
  await page.clock.pauseAt(new Date(time));
  try {
    await page.goto(origin + (options.startPath || ""));
    await run(page, context);
    assert.deepEqual(errors, [], "No uncaught JavaScript errors");
  } finally {
    await context.close();
  }
}
const readState = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
const navigate = (page, view) =>
  page.locator('.sidebar [data-view="' + view + '"]').click();
const submit = (page, form) =>
  page.locator(form + " .form-actions .primary").click();
async function createPlan(page, title = "Walk") {
  await page.locator('#today .head-actions [data-action="quick-plan"]').click();
  await page.locator('#planForm [name="title"]').fill(title);
  await page.locator('#planForm [name="duration"]').fill("0:30");
  await submit(page, "#planForm");
}
async function selectDate(page, form, date) {
  await page
    .locator(form + " .visual-date-picker .visual-picker-trigger")
    .click();
  await page.locator('[data-cal-day="' + date + '"]').click();
  await page.locator("[data-cal-select]").click();
}

test("new plans, work logs, and routines keep today and edited dates", () =>
  withPage(async (page) => {
    await createPlan(page);
    assert.equal((await readState(page)).plans[0].date, day);
    assert.match(await page.locator("#todayPlans").textContent(), /Walk/);
    await page.locator("#todayPlans [data-edit-plan]").click();
    assert.equal(
      await page.locator('#planForm [name="date"]').inputValue(),
      day,
    );
    await selectDate(page, "#planForm", "2026-10-09");
    await submit(page, "#planForm");
    assert.equal((await readState(page)).plans[0].date, "2026-10-09");
    await navigate(page, "logged");
    await page.locator('#logged [data-action="new-log"]').click();
    assert.equal(
      await page.locator('#logForm [name="date"]').inputValue(),
      day,
    );
    await page.locator(".modal .close").click();
    await navigate(page, "routines");
    await page.locator('#routines [data-action="new-routine"]').click();
    assert.equal(
      await page.locator('#routineForm [name="startDate"]').inputValue(),
      day,
    );
  }));

test("plans can be edited from Today, week, and month without creating duplicates", () =>
  withPage(async (page) => {
    await createPlan(page);
    await page.locator("#todayPlans [data-edit-plan]").click();
    await page.locator('#planForm [name="title"]').fill("Morning walk");
    await submit(page, "#planForm");
    await navigate(page, "planner");
    await page.locator("#weekGrid [data-edit-plan]").click();
    assert.equal(
      await page.locator('#planForm [name="title"]').inputValue(),
      "Morning walk",
    );
    await page.locator(".modal .close").click();
    await page.locator('[data-plannermode="month"]').click();
    await page.locator("#weekGrid [data-edit-plan]").click();
    await page.locator('#planForm [name="title"]').fill("Evening walk");
    await submit(page, "#planForm");
    const state = await readState(page);
    assert.equal(state.plans.length, 1);
    assert.equal(state.plans[0].title, "Evening walk");
    await page.reload();
    assert.match(
      await page.locator("#todayPlans").textContent(),
      /Evening walk/,
    );
  }));

test("plan completion, actual logs, edits, and deletion maintain totals", () =>
  withPage(async (page) => {
    await createPlan(page);
    await page.locator("[data-plancheck]").click();
    assert.equal((await readState(page)).plans[0].done, true);
    assert.equal(await page.locator("#planForm").count(), 0);
    await page.locator("[data-plan-log]").click();
    await page.locator('#planLogForm [name="duration"]').fill("۰:۴۵");
    await submit(page, "#planLogForm");
    const state = await readState(page);
    assert.equal(state.logs[0].planId, state.plans[0].id);
    assert.equal(state.logs[0].minutes, 45);
    assert.match(await page.locator("#weeklyGoalValue").textContent(), /۴۵m/);
    await navigate(page, "logged");
    assert.match(await page.locator("#timesheet").textContent(), /Walk/);
    assert.match(await page.locator("#totalLogged").textContent(), /۴۵m/);
    await page.locator("#logActivity [data-edit-log]").click();
    await page.locator('#editLogForm [name="duration"]').fill("1:00");
    await submit(page, "#editLogForm");
    assert.equal((await readState(page)).logs[0].minutes, 60);
    await navigate(page, "today");
    await page.locator("[data-edit-plan]").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("[data-delete-plan]").click();
    assert.equal((await readState(page)).plans.length, 0);
    assert.equal((await readState(page)).logs.length, 0);
  }));

test("invalid plan duration and blank title are rejected without data changes", () =>
  withPage(async (page) => {
    await page
      .locator('#today .head-actions [data-action="quick-plan"]')
      .click();
    await page.locator('#planForm [name="title"]').fill("   ");
    await submit(page, "#planForm");
    assert.equal((await readState(page)).plans.length, 0);
    await page.locator('#planForm [name="title"]').fill("Walk");
    await page.locator('#planForm [name="duration"]').fill("1:99");
    await submit(page, "#planForm");
    assert.equal((await readState(page)).plans.length, 0);
    assert.equal(await page.locator("#planForm").count(), 1);
  }));

test("reopening on the next day resets daily focus and displays current plans only", () =>
  withPage(
    async (page) => {
      assert.equal((await readState(page)).settings.dayKey, day);
      assert.equal((await readState(page)).settings.dailyFocusTaskId, "");
      assert.match(
        await page.locator("#todayPlans").textContent(),
        /Today plan/,
      );
      assert.doesNotMatch(
        await page.locator("#todayPlans").textContent(),
        /Yesterday plan/,
      );
      assert.match(
        await page.locator("#todayActive").textContent(),
        /0m today/,
      );
    },
    fixture({
      settings: { dayKey: "2026-10-06", dailyFocusTaskId: "t1" },
      plans: [
        { id: "p1", title: "Yesterday plan", date: "2026-10-06" },
        { id: "p2", title: "Today plan", date: day },
      ],
      logs: [{ id: "l1", taskId: "t1", date: "2026-10-06", minutes: 30 }],
    }),
  ));

test("midnight refreshes an open tab immediately, preserves history, and resets cursors", () =>
  withPage(
    async (page) => {
      const before = await page.locator("#todayDate").textContent();
      await page.clock.runFor(2000);
      assert.notEqual(await page.locator("#todayDate").textContent(), before);
      assert.equal((await readState(page)).settings.dayKey, "2026-10-08");
      assert.equal((await readState(page)).settings.dailyFocusTaskId, "");
      assert.equal((await readState(page)).logs.length, 1);
      assert.match(await page.locator("#weeklyGoalValue").textContent(), /۰m/);
      await navigate(page, "planner");
      assert.equal(
        await page
          .locator("#weekGrid .day.today [data-adddate]")
          .getAttribute("data-adddate"),
        "2026-10-08",
      );
    },
    fixture({ logs: [{ id: "l1", taskId: "t1", date: day, minutes: 30 }] }),
    "2026-10-07T23:59:59+03:30",
  ));

test("returning after sleep refreshes Today through pageshow", () =>
  withPage(async (page) => {
    await page.clock.setSystemTime(new Date("2026-10-09T10:00:00+03:30"));
    await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
    assert.equal((await readState(page)).settings.dayKey, "2026-10-09");
    assert.equal((await readState(page)).settings.dailyFocusTaskId, "");
  }));

test("Persian year includes Farvardin first day and leap Esfand last day", () =>
  withPage(
    async (page) => {
      await navigate(page, "logged");
      await page.locator('[data-logmode="year"]').click();
      assert.equal(await page.locator("#totalLogged").textContent(), "۳۰m");
      assert.equal(
        await page
          .locator("[data-log-open-month]")
          .first()
          .getAttribute("data-log-open-month"),
        "2025-03-21",
      );
      await page.locator('[data-logmove="-1"]').click();
      assert.equal(await page.locator("#totalLogged").textContent(), "۴۵m");
      assert.equal(await page.locator("#logLabel").textContent(), "۱۴۰۳");
      await page.locator("[data-log-open-month]").last().click();
      assert.equal(await page.locator("#totalLogged").textContent(), "۴۵m");
    },
    fixture({
      logs: [
        { id: "l1", taskId: "t1", date: "2025-03-21", minutes: 30 },
        { id: "l2", taskId: "t1", date: "2025-03-20", minutes: 45 },
      ],
    }),
    "2025-10-07T10:00:00+03:30",
  ));

test("Logged month navigation follows Persian month boundaries", () =>
  withPage(async (page) => {
    await navigate(page, "logged");
    await page.locator('[data-logmode="month"]').click();
    const label = await page.locator("#logLabel").textContent();
    await page.locator('[data-logmove="1"]').click();
    assert.match(await page.locator("#logLabel").textContent(), /آبان/);
    await page.locator('[data-logmove="-1"]').click();
    assert.equal(await page.locator("#logLabel").textContent(), label);
  }));

test("routine time appears in weekly rows and totals and unchecking removes its log", () =>
  withPage(
    async (page) => {
      await page.locator("[data-rcheck]").click();
      await page.locator('#routineDoneForm [name="duration"]').fill("0:20");
      await submit(page, "#routineDoneForm");
      await navigate(page, "logged");
      assert.match(await page.locator("#timesheet").textContent(), /Walking/);
      assert.equal(await page.locator("#totalLogged").textContent(), "۲۰m");
      await navigate(page, "today");
      await page.locator("[data-rcheck]").click();
      assert.equal((await readState(page)).logs.length, 0);
    },
    fixture({
      routines: [
        { id: "r1", title: "Walking", days: ["چهارشنبه"], checks: {} },
      ],
    }),
  ));

test("focus pause, resume, completion, and reload create exactly one log", () =>
  withPage(async (page) => {
    await page.locator("#focusMinutes").fill("1");
    await page.locator("#focusMinutes").dispatchEvent("change");
    await page.locator("#focusStart").click();
    await page.clock.runFor(20000);
    await page.locator("#focusPause").click();
    const paused = await page.locator("#focusTimerText").textContent();
    await page.clock.runFor(10000);
    assert.equal(await page.locator("#focusTimerText").textContent(), paused);
    await page.locator("#focusStart").click();
    await page.clock.runFor(41000);
    assert.equal((await readState(page)).logs.length, 1);
    assert.equal((await readState(page)).logs[0].minutes, 1);
    await page.reload();
    assert.equal((await readState(page)).logs.length, 1);
  }));

test("focus clock updates do not rebuild the issue selector", () =>
  withPage(async (page) => {
    await page.evaluate(() => {
      window.selectMutations = 0;
      new MutationObserver((records) => {
        window.selectMutations += records.length;
      }).observe(document.querySelector("#focusTask"), { childList: true });
    });
    await page.locator("#focusStart").click();
    await page.clock.runFor(500);
    await page.evaluate(() => {
      window.selectMutations = 0;
    });
    await page.clock.runFor(2000);
    assert.equal(await page.evaluate(() => window.selectMutations), 0);
  }));

test("backup round trip keeps plan logs and invalid backups leave data intact", () =>
  withPage(async (page) => {
    await createPlan(page);
    await page.locator("[data-plan-log]").click();
    await page.locator('#planLogForm [name="duration"]').fill("0:20");
    await submit(page, "#planLogForm");
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-action="export-backup"]').click();
    const backup = await fs.readFile(await (await downloadPromise).path());
    await page.locator("#backupInput").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
    await page.waitForFunction(() =>
      document
        .querySelector("#toastRoot")
        .textContent.includes("Backup restored"),
    );
    assert.equal((await readState(page)).plans[0].title, "Walk");
    assert.equal((await readState(page)).logs[0].minutes, 20);
    await page.locator("#backupInput").setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"tasks":[null]}'),
    });
    await page.waitForFunction(() =>
      document.querySelector("#toastRoot").textContent.includes("Invalid"),
    );
    assert.equal((await readState(page)).plans[0].title, "Walk");
  }));

test("corrupt stored data is preserved and can be exported for recovery", () =>
  withPage(async (page) => {
    const raw = await page.evaluate(
      (key) => localStorage.getItem(key),
      storageKey,
    );
    assert.equal(raw, "{broken json");
    assert.match(
      await page.locator("#saveStatus").textContent(),
      /needs recovery/,
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-action="export-backup"]').click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /recovery/);
    assert.equal(await fs.readFile(await download.path(), "utf8"), raw);
  }, "{broken json"));

test("legacy backups normalize missing fields and allocate a unique issue key", () =>
  withPage(
    async (page) => {
      await page.locator('.sidebar [data-action="new-task"]').click();
      await page.locator('#taskForm [name="title"]').fill("New task");
      await submit(page, "#taskForm");
      const tasks = (await readState(page)).tasks;
      assert.equal(tasks[1].key, "GF-100");
      assert.equal(tasks[0].title, "Existing task");
    },
    { seq: 1, tasks: [{ id: "old", key: "GF-99", title: "Existing task" }] },
  ));

test("two open tabs synchronize without repeated storage writes", () =>
  withPage(async (page, context) => {
    const second = await context.newPage();
    await second.clock.install({ time: new Date(instant) });
    await second.clock.pauseAt(new Date(instant));
    await second.goto(origin);
    await page.evaluate(() => {
      window.storageEvents = 0;
      window.addEventListener("storage", () => window.storageEvents++);
    });
    await createPlan(page, "Synced plan");
    await second.waitForFunction(() =>
      document.querySelector("#todayPlans").textContent.includes("Synced plan"),
    );
    assert.ok(
      (await page.evaluate(() => window.storageEvents)) <= 1,
      "No storage event loop",
    );
    await second.close();
  }));

test("offline shell keeps saved plans and does not substitute HTML for missing assets", () =>
  withPage(
    async (page, context) => {
      await createPlan(page);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller)
          await new Promise((resolve) =>
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              resolve,
              { once: true },
            ),
          );
      });
      assert.deepEqual(await page.evaluate(() => caches.keys()), [
        "greenflow-shell-v23",
      ]);
      await context.setOffline(true);
      await page.reload();
      assert.match(await page.locator("#todayPlans").textContent(), /Walk/);
      const missing = await page.evaluate(() =>
        fetch("./missing.js")
          .then((r) => r.headers.get("content-type"))
          .catch(() => "network failure"),
      );
      assert.equal(missing, "network failure");
    },
    fixture(),
    instant,
    { serviceWorkers: "allow" },
  ));

test("large history avoids hidden renders and opens forms within an interaction budget", () => {
  const tasks = Array.from({ length: 500 }, (_, i) => ({
    id: "t" + i,
    key: "GF-" + (i + 1),
    title: "Task " + i,
    priority: "Medium",
    status: i < 10 ? "todo" : "archived",
    subtasks: [],
  }));
  const logs = Array.from({ length: 10000 }, (_, i) => ({
    id: "l" + i,
    taskId: "t" + (i % 500),
    date: i % 2 ? day : "2026-10-06",
    minutes: 1,
  }));
  return withPage(async (page) => {
    assert.equal(await page.locator("#archiveList").textContent(), "");
    assert.equal(await page.locator("#weekGrid").textContent(), "");
    const duration = await page.evaluate(() => {
      const start = performance.now();
      document
        .querySelector('#today .head-actions [data-action="quick-plan"]')
        .click();
      return performance.now() - start;
    });
    assert.ok(
      duration < 100,
      "Quick plan should open under 100ms, measured " + duration,
    );
    assert.equal(
      await page.locator('#planForm [name="date"]').inputValue(),
      day,
    );
    await page.locator(".modal .close").click();
    await navigate(page, "logged");
    assert.equal((await readState(page)).logs.length, 10000);
    assert.equal(
      await page
        .locator("#timesheet .ts-row:not(.header):not(.daily-total)")
        .count(),
      500,
    );
  }, fixture({ tasks, logs }));
});

test("mobile plan editing and logging fit the viewport", () =>
  withPage(
    async (page) => {
      await page.locator(".mobile-fab").click();
      await page.locator('#planForm [name="title"]').fill("Mobile plan");
      await submit(page, "#planForm");
      await page.locator("#todayPlans [data-plan-log]").click();
      const bounds = await page.locator("#planLogForm").boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391);
      await page.locator('#planLogForm [name="duration"]').fill("0:15");
      await submit(page, "#planLogForm");
      assert.equal((await readState(page)).logs[0].minutes, 15);
    },
    fixture(),
    instant,
    { viewport: { width: 390, height: 844 } },
  ));

test("archiving and restoring a task preserves its description, subtasks and logs", () =>
  withPage(
    async (page) => {
      await page.locator("#todayActive [data-open-task]").click();
      page.once("dialog", (dialog) => dialog.accept());
      await page.locator("[data-archive-task]").click();
      await navigate(page, "archive");
      await page.locator("[data-restore-task]").click();
      const state = await readState(page);
      assert.equal(state.tasks[0].status, "todo");
      assert.equal(state.tasks[0].description, "Preserved notes");
      assert.equal(state.tasks[0].subtasks[0].title, "Read paper");
      assert.equal(state.logs.length, 1);
    },
    fixture({
      tasks: [
        {
          id: "t1",
          key: "GF-1",
          title: "Research",
          priority: "High",
          status: "todo",
          description: "Preserved notes",
          subtasks: [{ id: "s1", title: "Read paper", done: true }],
        },
      ],
      logs: [{ id: "l1", taskId: "t1", date: day, minutes: 30 }],
    }),
  ));

test("deleting a routine removes its time logs", () =>
  withPage(
    async (page) => {
      await navigate(page, "routines");
      await page.locator("[data-edit-routine]").click();
      page.once("dialog", (dialog) => dialog.accept());
      await page.locator("[data-delete-routine]").click();
      assert.equal((await readState(page)).routines.length, 0);
      assert.equal((await readState(page)).logs.length, 0);
      await navigate(page, "logged");
      assert.equal(await page.locator("#totalLogged").textContent(), "۰m");
    },
    fixture({
      routines: [
        {
          id: "r1",
          title: "Walking",
          days: ["چهارشنبه"],
          checks: { [day]: true },
        },
      ],
      logs: [
        {
          id: "l1",
          routineId: "r1",
          source: "routine",
          date: day,
          minutes: 20,
        },
      ],
    }),
  ));

test("manual work logs support a time range crossing midnight", () =>
  withPage(async (page) => {
    await navigate(page, "logged");
    await page.locator('#logged [data-action="new-log"]').click();
    await page.locator('#logForm [name="taskId"]').selectOption("t1");
    for (const [name, hour, minute] of [
      ["start", 23, 30],
      ["end", 0, 15],
    ]) {
      await page
        .locator("#logForm .visual-time-picker")
        .filter({ has: page.locator('input[name="' + name + '"]') })
        .locator("button")
        .click();
      await page.locator('[data-wheel-h] [data-v="' + hour + '"]').click();
      await page.locator('[data-wheel-m] [data-v="' + minute + '"]').click();
      await page.locator("[data-time-select]").click();
    }
    await submit(page, "#logForm");
    assert.equal((await readState(page)).logs[0].minutes, 45);
  }));

test("invalid stored backup structure is preserved without crashing the app", () =>
  withPage(async (page) => {
    assert.match(
      await page.locator("#saveStatus").textContent(),
      /needs recovery/,
    );
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), storageKey),
      '{"tasks":[null]}',
    );
  }, '{"tasks":[null]}'));

test("launching from a stale service worker loads current files and preserves saved data", () =>
  withPage(
    async (page) => {
      await page.evaluate(async () => {
        await navigator.serviceWorker.register("./sw.js?v=legacy");
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller)
          await new Promise((resolve) =>
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              resolve,
              { once: true },
            ),
          );
        const other = await caches.open("other-app-cache");
        await other.put("./other", new Response("Keep unrelated cached data"));
      });
      await page.goto(origin + "/index.html");
      assert.equal(await page.title(), "Old GreenFlow");
      assert.equal(await page.evaluate(() => window.legacyBuild), true);
      const before = await readState(page);
      await page.goto(origin + "/launch.html");
      await page.waitForURL("**/index.html?v=23");
      await page.waitForFunction(
        () =>
          document.querySelector("#todayDate")?.textContent !== "—" &&
          document
            .querySelector("#todayActive")
            ?.textContent.includes("Research"),
      );
      assert.match(await page.locator(".sidebar-foot").textContent(), /v23/);
      assert.equal(await page.evaluate(() => window.legacyBuild), undefined);
      const after = await readState(page);
      assert.equal(after.tasks[0].title, before.tasks[0].title);
      assert.deepEqual(after.logs, before.logs);
      assert.deepEqual(after.plans, before.plans);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      const cacheNames = await page.evaluate(() => window.caches.keys());
      assert.ok(cacheNames.includes("other-app-cache"));
      assert.ok(cacheNames.includes("greenflow-shell-v23"));
      assert.ok(!cacheNames.includes("greenflow-shell-v21"));
    },
    fixture({
      logs: [{ id: "l1", taskId: "t1", date: day, minutes: 30 }],
      plans: [{ id: "p1", title: "Saved plan", date: day, time: "" }],
    }),
    instant,
    { serviceWorkers: "allow", startPath: "/legacy-start.html" },
  ));

test("online reload fetches current app files instead of a stale cached asset", () =>
  withPage(
    async (page, context) => {
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller)
          await new Promise((resolve) =>
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              resolve,
              { once: true },
            ),
          );
        const cache = await caches.open("greenflow-shell-v23");
        await cache.put(
          new URL("./app.js", location.href).href,
          new Response("window.staleAsset=true;", {
            headers: { "Content-Type": "text/javascript" },
          }),
        );
      });
      await page.reload();
      assert.equal(await page.evaluate(() => window.staleAsset), undefined);
      assert.match(
        await page.locator("#todayActive").textContent(),
        /Research/,
      );
      await context.setOffline(true);
      await page.reload();
      assert.equal(await page.evaluate(() => window.staleAsset), undefined);
      assert.match(
        await page.locator("#todayActive").textContent(),
        /Research/,
      );
    },
    fixture(),
    instant,
    { serviceWorkers: "allow" },
  ));

for (const timezoneId of ["UTC", "America/New_York", "Pacific/Kiritimati"]) {
  test(`Today uses Tehran's 16 Mehr Thursday in ${timezoneId}`, () =>
    withPage(
      async (page) => {
        const label = await page.locator("#todayDate").textContent();
        assert.match(label, /۱۶/);
        assert.match(label, /مهر/);
        assert.match(label, /پنجشنبه/);
        assert.equal((await readState(page)).settings.dayKey, "2026-10-08");
        await navigate(page, "planner");
        assert.equal(
          await page
            .locator("#weekGrid .day.today [data-adddate]")
            .getAttribute("data-adddate"),
          "2026-10-08",
        );
      },
      fixture(),
      "2026-10-07T21:00:00Z",
      { timezoneId },
    ));
}

test("Tehran midnight refreshes Today while the browser is still on Wednesday", () =>
  withPage(
    async (page) => {
      assert.match(await page.locator("#todayDate").textContent(), /۱۵/);
      await page.clock.runFor(2000);
      assert.match(await page.locator("#todayDate").textContent(), /۱۶/);
      assert.match(await page.locator("#todayDate").textContent(), /پنجشنبه/);
      assert.equal((await readState(page)).settings.dayKey, "2026-10-08");
    },
    fixture(),
    "2026-10-07T20:29:59Z",
    { timezoneId: "UTC" },
  ));

test("reminders use Tehran's date and time when the browser is behind", () =>
  withPage(
    async (page) => {
      await page.clock.runFor(1500);
      const reminders = (await readState(page)).reminders;
      assert.equal(reminders.find((r) => r.id === "due").notified, true);
      assert.equal(reminders.find((r) => r.id === "later").notified, false);
    },
    fixture({
      reminders: [
        {
          id: "due",
          title: "Due in Tehran",
          date: "2026-10-08",
          time: "00:15",
          notified: false,
        },
        {
          id: "later",
          title: "Later in Tehran",
          date: "2026-10-08",
          time: "01:00",
          notified: false,
        },
      ],
    }),
    "2026-10-07T21:00:00Z",
    { timezoneId: "UTC" },
  ));
