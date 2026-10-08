(async () => {
  "use strict";
  const calendarClock = window.GreenFlowClock;
  await calendarClock.sync();
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STORAGE = "greenflow_pro_v5";
  const LEGACY_STORAGE = "greenflow_pro_v4";
  const weekFa = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
  ];
  const jsFa = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];
  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const iso = (d) => {
    d = new Date(d);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  };
  const tehranClock = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const clockParts = (date = calendarClock.now()) =>
    Object.fromEntries(
      tehranClock.formatToParts(date).map(({ type, value }) => [type, value]),
    );
  const today = () => {
    const p = clockParts();
    return `${p.year}-${p.month}-${p.day}`;
  };
  // Calendar dates are UTC noon; browser time zones must never shift a selected day.
  const fromISO = (s) => new Date(s + "T12:00:00Z");
  const addDays = (s, n) => {
    let d = fromISO(s);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  };
  const dateFormats = {
    parts: new Intl.DateTimeFormat("en-US-u-ca-persian", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }),
    short: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    long: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    month: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "UTC",
      month: "long",
    }),
    monthYear: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }),
  };
  const datePartsCache = new Map(),
    calendarYears = new Map();
  const faNum = (v) => String(v ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const jalali = (s) => dateFormats.short.format(fromISO(s));
  const longJ = (s) => dateFormats.long.format(fromISO(s));
  const weekStart = (s) => {
    let d = fromISO(s),
      diff = (d.getUTCDay() + 1) % 7;
    d.setUTCDate(d.getUTCDate() - diff);
    return iso(d);
  };
  const weekdayFa = (s) => jsFa[fromISO(s).getUTCDay()];
  const fmtMin = (n) => {
    n = Math.max(0, Number(n) || 0);
    let h = Math.floor(n / 60),
      m = n % 60;
    return h ? `${faNum(h)}h${m ? " " + faNum(m) + "m" : ""}` : `${faNum(m)}m`;
  };
  const defaultState = {
    seq: 4,
    tasks: [
      {
        id: "t1",
        key: "GF-1",
        title: "Review anomaly detection papers",
        description:
          "Read the selected papers and capture the methods, datasets, evaluation metrics, limitations, and useful citations.",
        priority: "High",
        estimate: 180,
        due: "",
        label: "Thesis",
        status: "doing",
        subtasks: [
          { id: "s1", title: "Read methodology section", done: true },
          { id: "s2", title: "Extract evaluation metrics", done: false },
        ],
        created: today(),
      },
      {
        id: "t2",
        key: "GF-2",
        title: "Organize thesis research notes",
        description: "",
        priority: "Medium",
        estimate: 90,
        due: "",
        label: "Thesis",
        status: "todo",
        subtasks: [],
        created: today(),
      },
      {
        id: "t3",
        key: "GF-3",
        title: "Prepare weekly research plan",
        description:
          "Define the concrete research deliverables for the next week.",
        priority: "Medium",
        estimate: 45,
        due: "",
        label: "Planning",
        status: "backlog",
        subtasks: [],
        created: today(),
      },
    ],
    routines: [
      {
        id: "r1",
        title: "Walking",
        time: "18:00",
        days: ["شنبه", "دوشنبه", "چهارشنبه"],
        checks: {},
      },
    ],
    plans: [],
    logs: [],
    reminders: [],
    settings: {
      logMode: "week",
      focus: {
        minutes: 25,
        remaining: 1500,
        running: false,
        endAt: null,
        taskId: "",
        autoLog: true,
        startedAt: null,
      },
    },
  };
  function cloneDefault() {
    return typeof structuredClone === "function"
      ? structuredClone(defaultState)
      : JSON.parse(JSON.stringify(defaultState));
  }
  function normalizeState(x) {
    if (!x || !Array.isArray(x.tasks)) return null;
    const object = (value) =>
      value && typeof value === "object" && !Array.isArray(value);
    const date = (value) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      iso(fromISO(value)) === value;
    const time = (value) =>
      typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    x.routines = Array.isArray(x.routines) ? x.routines : [];
    x.plans = Array.isArray(x.plans) ? x.plans : [];
    x.logs = Array.isArray(x.logs) ? x.logs : [];
    x.reminders = Array.isArray(x.reminders) ? x.reminders : [];
    if (
      [x.tasks, x.routines, x.plans, x.logs, x.reminders].some((list) =>
        list.some(
          (value) =>
            !object(value) || typeof value.id !== "string" || !value.id,
        ),
      )
    )
      return null;
    if (
      [x.plans, x.logs, x.reminders].some((list) =>
        list.some((value) => !date(value.date)),
      )
    )
      return null;
    if (
      x.logs.some(
        (log) =>
          !Number.isFinite(Number(log.minutes)) || Number(log.minutes) <= 0,
      )
    )
      return null;
    for (const list of [x.tasks, x.routines, x.plans, x.logs, x.reminders]) {
      if (new Set(list.map((value) => value.id)).size !== list.length)
        return null;
    }
    x.tasks.forEach((task) => {
      task.title = String(task.title || "Untitled issue");
      task.description = String(task.description || "");
      task.label = String(task.label || "");
      task.priority = ["Highest", "High", "Medium", "Low"].includes(
        task.priority,
      )
        ? task.priority
        : "Medium";
      task.status = ["backlog", "todo", "doing", "done", "archived"].includes(
        task.status,
      )
        ? task.status
        : "backlog";
      task.estimate = Math.max(0, Number(task.estimate) || 0);
      task.due = date(task.due) ? task.due : "";
      task.subtasks = Array.isArray(task.subtasks)
        ? task.subtasks.filter(object)
        : [];
    });
    for (const list of [x.routines, x.plans, x.reminders]) {
      for (const value of list) {
        value.title = String(value.title || "Untitled");
        value.time = time(value.time) ? value.time : "";
      }
    }
    const highestKey = x.tasks.reduce(
      (max, task) =>
        Math.max(
          max,
          Number(String(task.key || "").match(/^GF-(\d+)$/)?.[1]) || 0,
        ),
      0,
    );
    x.seq = Math.max(Number.isSafeInteger(x.seq) ? x.seq : 1, highestKey + 1);
    x.settings = object(x.settings) ? x.settings : {};
    if (!["week", "month", "year"].includes(x.settings.logMode))
      x.settings.logMode = "week";
    if (!["week", "month", "year"].includes(x.settings.plannerMode))
      x.settings.plannerMode = "week";
    if (x.settings.dailyFocusTaskId == null) x.settings.dailyFocusTaskId = "";
    if (x.settings.theme == null) x.settings.theme = "light";
    if (x.settings.dailyGoalMinutes == null) x.settings.dailyGoalMinutes = 420;
    if (
      !Number.isFinite(Number(x.settings.dailyGoalMinutes)) ||
      Number(x.settings.dailyGoalMinutes) <= 0
    )
      x.settings.dailyGoalMinutes = 420;
    x.settings.focus = object(x.settings.focus)
      ? x.settings.focus
      : {
          minutes: 25,
          remaining: 1500,
          running: false,
          endAt: null,
          taskId: "",
          autoLog: true,
          startedAt: null,
        };
    x.routines.forEach((r) => {
      r.days = Array.isArray(r.days) ? r.days : [];
      r.checks = object(r.checks) ? r.checks : {};
      if (r.paused == null) r.paused = false;
      if (!date(r.startDate)) r.startDate = "";
      if (!date(r.endDate)) r.endDate = "";
    });
    return x;
  }
  function setSaveStatus(ok, msg) {
    let el = document.querySelector("#saveStatus");
    if (el) {
      el.textContent = msg || (ok ? "Saved locally" : "Storage error");
      el.classList.toggle("save-error", !ok);
    }
  }
  let storageWritable = true,
    storedRecovery = null;
  function load() {
    let raw;
    try {
      raw =
        localStorage.getItem(STORAGE) || localStorage.getItem(LEGACY_STORAGE);
      let x = raw ? normalizeState(JSON.parse(raw)) : null;
      if (x) {
        return x;
      }
      if (raw) {
        storageWritable = false;
        storedRecovery = raw;
      }
    } catch (e) {
      if (raw) {
        storageWritable = false;
        storedRecovery = raw;
      }
    }
    return normalizeState(cloneDefault());
  }
  const viewIds = [
    "today",
    "planner",
    "backlog",
    "active",
    "logged",
    "reminders",
    "archive",
    "routines",
  ];
  let currentView = "today",
    dirtyViews = new Set(viewIds),
    dataIndex = null;
  let state = load(),
    weekCursor = today(),
    logCursor = today(),
    dragged = null,
    currentDayKey = state.settings.dayKey || "";
  function save() {
    dataIndex = null;
    dirtyViews = new Set(viewIds);
    if (!storageWritable) {
      setSaveStatus(false, "Stored data needs recovery — export a backup");
      return;
    }
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
      setSaveStatus(true);
    } catch (e) {
      setSaveStatus(false, "Storage unavailable — export a backup");
      console.error("GreenFlow save failed", e);
    }
    renderNav();
  }
  function routineOccurs(r, d) {
    return (
      !r.paused &&
      (!r.startDate || d >= r.startDate) &&
      (!r.endDate || d <= r.endDate) &&
      (r.days || []).includes(weekdayFa(d))
    );
  }
  function toast(msg) {
    clearTimeout(toastTimer);
    $("#toastRoot").innerHTML = `<div class="toast">${esc(msg)}</div>`;
    toastTimer = setTimeout(() => ($("#toastRoot").innerHTML = ""), 1800);
  }
  let toastTimer;
  function nextKey() {
    return `GF-${state.seq++}`;
  }
  function taskLogs(id) {
    return indexData().logsByTask.get(id) || [];
  }
  function loggedMin(id) {
    return indexData().taskMinutes.get(id) || 0;
  }
  function renderNav() {
    for (const [id, statuses] of [
      ["navBacklog", ["backlog"]],
      ["navActive", ["todo", "doing"]],
      ["navArchive", ["archived"]],
    ])
      $("#" + id).textContent = state.tasks.filter((t) =>
        statuses.includes(t.status),
      ).length;
    $("#navReminders").textContent = state.reminders.filter(
      (r) => r.date >= today(),
    ).length;
  }
  function openView(id) {
    if (!viewIds.includes(id)) return;
    handleDayRollover();
    currentView = id;
    $$(".view").forEach((v) => v.classList.toggle("active-view", v.id === id));
    $$(".nav").forEach((n) =>
      n.classList.toggle("active", n.dataset.view === id),
    );
    if (dirtyViews.has(id)) renderView(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function empty(title, sub = "") {
    return `<div class="empty"><strong>${esc(title)}</strong>${esc(sub)}</div>`;
  }
  function applyTheme() {
    let dark = state.settings.theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    let l = $("#themeLabel");
    if (l) l.textContent = dark ? "Light mode" : "Dark mode";
    let m = $("#themeColor");
    if (m) m.content = dark ? "#172326" : "#dfecef";
  }
  function toggleTheme() {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    save();
    applyTheme();
  }
  let focusTick = null;
  function focusData() {
    let f =
      state.settings.focus ||
      (state.settings.focus = {
        minutes: 25,
        remaining: 1500,
        running: false,
        endAt: null,
        taskId: "",
        autoLog: true,
        startedAt: null,
      });
    if (!Number.isFinite(f.minutes) || f.minutes < 1 || f.minutes > 240)
      f.minutes = 25;
    if (!Number.isFinite(f.remaining) || f.remaining < 0)
      f.remaining = f.minutes * 60;
    if (f.running && (!Number.isFinite(f.endAt) || f.endAt <= 0)) {
      f.running = false;
      f.endAt = null;
    }
    return f;
  }
  function focusRemaining() {
    let f = focusData();
    return f.running && f.endAt
      ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000))
      : Math.max(0, f.remaining);
  }
  function renderFocus(clockOnly = false) {
    let f = focusData(),
      rem = focusRemaining(),
      total = Math.max(60, f.minutes * 60),
      pct = Math.max(0, Math.min(1, rem / total)),
      m = Math.floor(rem / 60),
      sec = rem % 60,
      txt = $("#focusTimerText");
    if (!txt) return;
    txt.textContent = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    $("#focusTimerState").textContent = f.running
      ? "Focusing"
      : rem === 0
        ? "Complete"
        : rem < total
          ? "Paused"
          : "Ready";
    if (!clockOnly) {
      $("#focusMinutes").value = f.minutes;
      $("#focusAutoLog").checked = f.autoLog !== false;
      let active = state.tasks.filter((t) =>
        ["todo", "doing"].includes(t.status),
      );
      $("#focusTask").innerHTML =
        '<option value="">No issue — focus only</option>' +
        active
          .map(
            (t) =>
              `<option value="${t.id}" ${f.taskId === t.id ? "selected" : ""}>${esc(t.key)} — ${esc(t.title)}</option>`,
          )
          .join("");
    }
    $("#focusArc").style.strokeDashoffset = String(326.73 * (1 - pct));
    $(".focus-card")?.classList.toggle("running", !!f.running);
    $("#focusStart").textContent = f.running
      ? "Running…"
      : rem < total && rem > 0
        ? "Resume"
        : "Start focus";
    $("#focusStart").disabled = !!f.running;
    $("#focusPause").disabled = !f.running;
    const activeSession = f.running || rem < total;
    $("#focusStop").disabled = !activeSession;
    $("#focusCancel").disabled = !activeSession;
    $$("[data-focus-preset]").forEach((b) =>
      b.classList.toggle(
        "active",
        Number(b.dataset.focusPreset) === f.minutes &&
          !f.running &&
          rem === total,
      ),
    );
  }
  function focusSetMinutes(n) {
    let f = focusData();
    if (f.running) return;
    n = Math.max(1, Math.min(240, Number(n) || 25));
    f.minutes = n;
    f.remaining = n * 60;
    f.endAt = null;
    f.startedAt = null;
    save();
    renderFocus();
  }
  function focusStart() {
    let f = focusData();
    if (f.running) return;
    if (f.remaining <= 0) f.remaining = f.minutes * 60;
    f.running = true;
    f.endAt = Date.now() + f.remaining * 1000;
    f.startedAt = f.startedAt || Date.now();
    save();
    renderFocus();
    startFocusTick();
  }
  function focusPause() {
    let f = focusData();
    if (!f.running) return;
    f.remaining = focusRemaining();
    f.running = false;
    f.endAt = null;
    save();
    renderFocus();
    stopFocusTick();
  }
  function focusReset() {
    let f = focusData();
    f.running = false;
    f.remaining = f.minutes * 60;
    f.endAt = null;
    f.startedAt = null;
    save();
    renderFocus();
    stopFocusTick();
  }
  function focusComplete() {
    let f = focusData();
    if (!f.running) return;
    f.running = false;
    f.remaining = 0;
    f.endAt = null;
    let mins = f.minutes;
    if (
      f.autoLog !== false &&
      f.taskId &&
      state.tasks.some((t) => t.id === f.taskId)
    ) {
      state.logs.push({
        id: uid(),
        taskId: f.taskId,
        date: today(),
        start: "",
        end: "",
        minutes: mins,
        note: "Focus session",
      });
    }
    f.startedAt = null;
    save();
    renderAll();
    renderFocus();
    stopFocusTick();
    toast(
      f.taskId && f.autoLog !== false
        ? `Focus complete · ${mins}m logged`
        : "Focus session complete",
    );
    try {
      if ("Notification" in window && Notification.permission === "granted")
        new Notification("GreenFlow", { body: "Focus session complete." });
    } catch {}
  }
  function startFocusTick() {
    stopFocusTick();
    focusTick = setInterval(() => {
      if (focusRemaining() <= 0) focusComplete();
      else if (currentView === "today") renderFocus(true);
    }, 500);
  }
  function stopFocusTick() {
    if (focusTick) {
      clearInterval(focusTick);
      focusTick = null;
    }
  }
  function renderBacklog() {
    let q = ($("#backlogSearch")?.value || "").toLowerCase(),
      pf = $("#priorityFilter")?.value || "all",
      ts = state.tasks.filter(
        (t) =>
          t.status === "backlog" &&
          (!q ||
            (t.title + " " + t.key + " " + (t.label || ""))
              .toLowerCase()
              .includes(q)) &&
          (pf === "all" || t.priority === pf),
      );
    $("#backlogList").innerHTML = ts.length
      ? ts
          .map(
            (t) =>
              `<div class="backlog-item issue-grid" data-open-task="${t.id}"><span class="typeicon">✓</span><span><span class="key">${esc(t.key)}</span><b>${esc(t.title)}</b></span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span>${t.estimate ? fmtMin(t.estimate) : "—"}</span><span>${t.due ? jalali(t.due) : "—"}</span><span><button class="movebtn" data-start="${t.id}">Add to Active</button></span></div>`,
          )
          .join("")
      : empty("Backlog is empty", "Create an issue or clear your filters.");
  }
  function taskCard(t) {
    let lm = loggedMin(t.id);
    return `<article class="task-card" draggable="true" data-task="${t.id}" data-open-task="${t.id}"><span class="key">${esc(t.key)}</span><h3>${esc(t.title)}</h3>${t.label ? `<div class="task-tags"><span class="tag">${esc(t.label)}</span></div>` : ""}<div class="task-meta"><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate">${lm ? fmtMin(lm) + " logged · " : ""}${t.estimate ? fmtMin(t.estimate) : "No estimate"}</span><span class="avatar">ME</span></div></article>`;
  }
  function renderBoard() {
    ["todo", "doing", "done"].forEach((s) => {
      let ts = state.tasks.filter((t) => t.status === s);
      $("#count-" + s).textContent = ts.length;
      $("#col-" + s).innerHTML = ts.length
        ? ts.map(taskCard).join("")
        : '<div class="empty">Drop issues here</div>';
    });
  }
  function renderRoutines() {
    let root = $("#routineCards");
    root.innerHTML = state.routines.length
      ? state.routines
          .map(
            (r) =>
              `<article class="routine-card"><div><h3>${esc(r.title)}</h3><div class="routine-time">${r.time ? faNum(r.time) : "No fixed time"}</div></div><div class="days">${weekFa.map((d) => `<span class="daypill ${(r.days || []).includes(d) ? "on" : ""}">${d}</span>`).join("")}</div><div class="routine-foot"><span>${r.paused ? "Paused" : r.endDate ? "Until " + jalali(r.endDate) : "Repeats forever"} · ${faNum(Object.values(r.checks || {}).filter(Boolean).length)} completions</span><span><button class="textbtn" data-edit-routine="${r.id}">Edit</button></span></div></article>`,
          )
          .join("")
      : empty(
          "No routines yet",
          "Create recurring habits without cluttering your Jira board.",
        );
  }
  function renderAll() {
    dirtyViews = new Set(viewIds);
    renderNav();
    renderView(currentView);
  }
  function modal(html) {
    $("#overlayRoot").innerHTML =
      `<div class="shade"><div class="modal"><button class="close" data-close>×</button>${html}</div></div>`;
  }
  function closeOverlay() {
    $("#overlayRoot").innerHTML = "";
    $(".picker-modal-layer")?.remove();
  }
  function taskForm(task = null, status = "backlog") {
    let edit = !!task;
    modal(
      `<h2>${edit ? "Edit issue" : "Create issue"}</h2><p class="sub">${edit ? esc(task.key) : "Project and study work uses the Jira-style workflow."}</p><form class="form" id="taskForm"><label>Summary<input name="title" required autofocus value="${esc(task?.title || "")}"></label><label>Description <span class="hint">optional</span><textarea name="description" placeholder="Add context, acceptance criteria, notes…">${esc(task?.description || "")}</textarea></label><div class="two"><label>Status<select name="status"><option value="backlog">Backlog</option><option value="todo">To Do</option><option value="doing">In Progress</option><option value="done">Done</option></select></label><label>Priority<select name="priority"><option>Highest</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div class="two"><label>Original estimate <span class="hint">minutes</span><input type="number" min="0" name="estimate" value="${task?.estimate || ""}"></label><label>Due date <span class="hint">optional</span><input type="date" name="due" value="${task?.due || ""}"></label></div><label>Label <span class="hint">optional</span><input name="label" value="${esc(task?.label || "")}" placeholder="e.g. Thesis"></label><div class="form-actions">${edit ? '<button type="button" class="danger" data-delete-task="' + task.id + '">Delete</button>' : ""}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit ? "Save changes" : "Create issue"}</button></div></form>`,
    );
    let f = $("#taskForm");
    f.status.value = task?.status || status;
    f.priority.value = task?.priority || "Medium";
    f.onsubmit = (e) => {
      e.preventDefault();
      let x = new FormData(f),
        obj = {
          title: x.get("title").trim(),
          description: x.get("description").trim(),
          status: x.get("status"),
          priority: x.get("priority"),
          estimate: Number(x.get("estimate")) || 0,
          due: x.get("due"),
          label: x.get("label").trim(),
        };
      if (!obj.title) {
        toast("Enter an issue title");
        return;
      }
      if (edit) Object.assign(task, obj);
      else
        state.tasks.push({
          id: uid(),
          key: nextKey(),
          subtasks: [],
          created: today(),
          ...obj,
        });
      save();
      closeOverlay();
      renderAll();
      toast(edit ? "Issue updated" : "Issue created");
    };
  }
  function routineForm(r = null) {
    let edit = !!r;
    modal(
      `<h2>${edit ? "Edit routine" : "New routine"}</h2><p class="sub">Repeats every week on the selected days. Leave End date empty to repeat forever.</p><form class="form" id="routineForm"><label>Name<input name="title" required autofocus value="${esc(r?.title || "")}"></label><div class="two"><label>Preferred time <span class="hint">optional</span><input type="time" name="time" value="${r?.time || ""}"></label><label>Start date<input type="date" name="startDate" value="${r?.startDate || today()}"><span class="hint">${jalali(r?.startDate || today())}</span></label></div><label>Repeat on</label><div class="days">${weekFa.map((d) => `<label class="daypill ${(r?.days || []).includes(d) ? "on" : ""}"><input type="checkbox" name="days" value="${d}" ${(r?.days || []).includes(d) ? "checked" : ""}> ${d}</label>`).join("")}</div><div class="two"><label>End date <span class="hint">optional — blank = forever</span><input type="date" name="endDate" value="${r?.endDate || ""}"></label><label class="toggle-label"><span>Routine status</span><span><input type="checkbox" name="paused" ${r?.paused ? "checked" : ""}> Paused</span></label></div><div class="form-actions">${edit ? '<button type="button" class="danger" data-delete-routine="' + r.id + '">Delete</button>' : ""}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save routine</button></div></form>`,
    );
    $("#routineForm").onsubmit = (e) => {
      e.preventDefault();
      let x = new FormData(e.currentTarget),
        days = x.getAll("days");
      if (!days.length) {
        toast("Choose at least one weekday");
        return;
      }
      let obj = {
        title: x.get("title").trim(),
        time: x.get("time"),
        days,
        startDate: x.get("startDate") || "",
        endDate: x.get("endDate") || "",
        paused: x.get("paused") === "on",
      };
      if (!obj.title) {
        toast("Enter a routine name");
        return;
      }
      if (obj.endDate && obj.startDate && obj.endDate < obj.startDate) {
        toast("End date must be after start date");
        return;
      }
      if (edit) Object.assign(r, obj);
      else state.routines.push({ id: uid(), ...obj, checks: {} });
      save();
      closeOverlay();
      renderAll();
      toast(
        obj.paused
          ? "Routine saved as paused"
          : obj.endDate
            ? "Routine saved"
            : "Routine saved · repeats forever",
      );
    };
  }
  function exportBackup() {
    let blob = new Blob(
        [
          storedRecovery ||
            JSON.stringify(
              {
                app: "GreenFlow Pro",
                version: 5,
                exportedAt: new Date().toISOString(),
                state,
              },
              null,
              2,
            ),
        ],
        { type: "application/json" },
      ),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `GreenFlow-${storedRecovery ? "recovery" : "backup"}-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    toast("Backup exported");
  }
  function logForm(taskId = "", date = today()) {
    let task = state.tasks.find((t) => t.id === taskId);
    modal(
      `<h2>Log work</h2><p class="sub">Track actual time against a Jira issue.</p><form class="form" id="logForm"><label>Issue<select name="taskId" required><option value="">Select issue…</option>${state.tasks.map((t) => `<option value="${t.id}" ${t.id === taskId ? "selected" : ""}>${esc(t.key)} — ${esc(t.title)}</option>`).join("")}</select></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required><span class="hint">${jalali(date)}</span></label><label>Duration <span class="hint">minutes</span><input type="number" name="minutes" min="1" placeholder="60"></label></div><div class="two"><label>From <span class="hint">optional</span><input type="time" name="start"></label><label>To <span class="hint">optional</span><input type="time" name="end"></label></div><label>Work description <span class="hint">optional</span><input name="note" placeholder="What did you work on?"></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Log work</button></div></form>`,
    );
    $("#logForm").onsubmit = (e) => {
      e.preventDefault();
      let x = new FormData(e.currentTarget),
        s = x.get("start"),
        en = x.get("end"),
        mins = Number(x.get("minutes")) || 0;
      if (!mins && s && en) {
        let [sh, sm] = s.split(":").map(Number),
          [eh, em] = en.split(":").map(Number);
        mins = (eh * 60 + em - sh * 60 - sm + 1440) % 1440;
      }
      if (mins <= 0) {
        toast("Enter duration or valid From / To");
        return;
      }
      state.logs.push({
        id: uid(),
        taskId: x.get("taskId"),
        date: x.get("date"),
        start: s,
        end: en,
        minutes: mins,
        note: x.get("note"),
      });
      save();
      closeOverlay();
      renderAll();
      toast("Work logged");
    };
  }
  document.addEventListener("click", (e) => {
    let fp = e.target.closest("[data-focus-preset]");
    if (fp) {
      focusSetMinutes(Number(fp.dataset.focusPreset));
      return;
    }
    let fa = e.target.closest("[data-focus-adjust]");
    if (fa) {
      focusSetMinutes(focusData().minutes + Number(fa.dataset.focusAdjust));
      return;
    }
    if (e.target.closest("#focusStart")) {
      focusStart();
      return;
    }
    if (e.target.closest("#focusPause")) {
      focusPause();
      return;
    }
    if (e.target.closest("#focusReset")) {
      focusReset();
      return;
    }
    let el = e.target.closest("[data-view]");
    if (el) {
      openView(el.dataset.view);
      return;
    }
    if (e.target.closest("[data-close]")) {
      closeOverlay();
      return;
    }
    el = e.target.closest("[data-action]");
    if (el) {
      let a = el.dataset.action;
      if (a === "new-task") taskForm();
      if (a === "new-task-active") taskForm(null, "todo");
      if (a === "quick-plan") quickPlan();
      if (a === "new-routine") routineForm();
      if (a === "new-log") logForm();
      if (a === "export-backup") exportBackup();
      if (a === "import-backup") $("#backupInput").click();
      if (a === "toggle-theme") toggleTheme();
      return;
    }
    el = e.target.closest("[data-open-task]");
    if (el && !e.target.closest("[data-start]")) {
      openTask(el.dataset.openTask);
      return;
    }
    el = e.target.closest("[data-edit-task]");
    if (el) {
      let t = state.tasks.find((x) => x.id === el.dataset.editTask);
      if (t) taskForm(t);
      return;
    }
    el = e.target.closest("[data-task-log]");
    if (el) {
      logForm(el.dataset.taskLog);
      return;
    }
    el = e.target.closest("[data-start]");
    if (el) {
      let t = state.tasks.find((x) => x.id === el.dataset.start);
      if (t) {
        t.status = "todo";
        save();
        renderAll();
        toast("Moved to Active");
      }
      return;
    }
    el = e.target.closest("[data-plancheck]");
    if (el) {
      let p = state.plans.find((x) => x.id === el.dataset.plancheck);
      if (p) {
        p.done = !p.done;
        save();
        renderAll();
      }
      return;
    }
    el = e.target.closest("[data-rcheck]");
    if (el) {
      let r = state.routines.find((x) => x.id === el.dataset.rcheck);
      if (r) {
        r.checks = r.checks || {};
        r.checks[el.dataset.date] = !r.checks[el.dataset.date];
        save();
        renderAll();
      }
      return;
    }
    el = e.target.closest("[data-adddate]");
    if (el) {
      quickPlan(el.dataset.adddate);
      return;
    }
    el = e.target.closest("[data-week]");
    if (el) {
      let n = Number(el.dataset.week);
      weekCursor = n === 0 ? today() : addDays(weekCursor, n * 7);
      renderPlanner();
      return;
    }
    el = e.target.closest("[data-logmode]");
    if (el) {
      state.settings.logMode = el.dataset.logmode;
      $$("[data-logmode]").forEach((b) =>
        b.classList.toggle("selected", b === el),
      );
      save();
      renderLogs();
      return;
    }
    el = e.target.closest("[data-logmove]");
    if (el) {
      let n = Number(el.dataset.logmove),
        m = state.settings.logMode,
        d = fromISO(logCursor);
      if (m === "week") logCursor = addDays(logCursor, n * 7);
      else if (m === "month") {
        logCursor = movePersianMonth(logCursor, n);
      } else {
        d.setUTCFullYear(d.getUTCFullYear() + n);
        logCursor = iso(d);
      }
      renderLogs();
      return;
    }
    if (e.target.closest("[data-logtoday]")) {
      logCursor = today();
      renderLogs();
      return;
    }
    el = e.target.closest("[data-logcell]");
    if (el) {
      let d = el.dataset.logdate;
      if (state.settings.logMode === "year")
        d =
          today().slice(0, 4) === d.slice(0, 4) &&
          today().slice(0, 7) === d.slice(0, 7)
            ? today()
            : d;
      logForm(el.dataset.logcell, d);
      return;
    }
    el = e.target.closest("[data-set-daily-focus]");
    if (el) {
      state.settings.dailyFocusTaskId =
        state.settings.dailyFocusTaskId === el.dataset.setDailyFocus
          ? ""
          : el.dataset.setDailyFocus;
      save();
      renderToday();
      openTask(el.dataset.setDailyFocus);
      toast(
        state.settings.dailyFocusTaskId
          ? "Daily focus set"
          : "Daily focus cleared",
      );
      return;
    }
    el = e.target.closest("[data-focus-issue]");
    if (el) {
      let f = focusData();
      f.taskId = el.dataset.focusIssue;
      save();
      openView("today");
      setTimeout(
        () =>
          document
            .querySelector(".focus-card")
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        50,
      );
      return;
    }
    if (e.target.closest("#dailyFocusChoose")) {
      let active = state.tasks.filter((t) =>
        ["todo", "doing"].includes(t.status),
      );
      if (!active.length) {
        toast("No active issues to choose from");
        return;
      }
      let cur = state.settings.dailyFocusTaskId,
        idx = Math.max(
          -1,
          active.findIndex((t) => t.id === cur),
        );
      state.settings.dailyFocusTaskId = active[(idx + 1) % active.length].id;
      save();
      renderToday();
      return;
    }
    el = e.target.closest("[data-delete-log]");
    if (el) {
      state.logs = state.logs.filter((x) => x.id !== el.dataset.deleteLog);
      save();
      renderAll();
      return;
    }
    el = e.target.closest("[data-edit-routine]");
    if (el) {
      let r = state.routines.find((x) => x.id === el.dataset.editRoutine);
      if (r) routineForm(r);
      return;
    }
    el = e.target.closest("[data-delete-task]");
    if (el && confirm("Delete this issue and its worklogs?")) {
      state.tasks = state.tasks.filter((x) => x.id !== el.dataset.deleteTask);
      state.logs = state.logs.filter((x) => x.taskId !== el.dataset.deleteTask);
      save();
      closeOverlay();
      renderAll();
      return;
    }
    el = e.target.closest("[data-delete-routine]");
    if (el && confirm("Delete this routine?")) {
      state.routines = state.routines.filter(
        (x) => x.id !== el.dataset.deleteRoutine,
      );
      state.logs = state.logs.filter(
        (l) => l.routineId !== el.dataset.deleteRoutine,
      );
      save();
      closeOverlay();
      renderAll();
      return;
    }
    el = e.target.closest("[data-subcheck]");
    if (el) {
      let t = state.tasks.find((x) => x.id === el.dataset.subcheck),
        s = t?.subtasks?.find((x) => x.id === el.dataset.subid);
      if (s) {
        s.done = !s.done;
        save();
        openTask(t.id);
        renderToday();
      }
      return;
    }
    el = e.target.closest("[data-add-sub]");
    if (el) {
      let t = state.tasks.find((x) => x.id === el.dataset.addSub),
        inp = $("#newSubInput");
      if (t && inp?.value.trim()) {
        t.subtasks = t.subtasks || [];
        t.subtasks.push({ id: uid(), title: inp.value.trim(), done: false });
        save();
        openTask(t.id);
      }
      return;
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "backlogSearch") renderBacklog();
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "priorityFilter") renderBacklog();
    if (e.target.id === "backupInput" && e.target.files?.[0]) {
      importBackup(e.target.files[0]);
      e.target.value = "";
    }
  });
  document.addEventListener("dragstart", (e) => {
    let c = e.target.closest("[data-task]");
    if (c) dragged = c.dataset.task;
  });
  $$(".column").forEach((c) => {
    c.addEventListener("dragover", (e) => {
      e.preventDefault();
      c.querySelector(".dropzone").classList.add("dragover");
    });
    c.addEventListener("dragleave", () =>
      c.querySelector(".dropzone").classList.remove("dragover"),
    );
    c.addEventListener("drop", (e) => {
      e.preventDefault();
      c.querySelector(".dropzone").classList.remove("dragover");
      let t = state.tasks.find((x) => x.id === dragged);
      if (t) {
        t.status = c.dataset.status;
        save();
        renderAll();
      }
    });
  });
  $("#focusMinutes")?.addEventListener("change", (e) =>
    focusSetMinutes(e.target.value),
  );
  $("#focusTask")?.addEventListener("change", (e) => {
    focusData().taskId = e.target.value;
    save();
  });
  $("#focusAutoLog")?.addEventListener("change", (e) => {
    focusData().autoLog = e.target.checked;
    save();
  });
  // Keep date-dependent UI in sync when the calendar day changes.
  function handleDayRollover(force = false) {
    const now = today();
    if (!force && now === currentDayKey) return false;
    const previous = currentDayKey;
    currentDayKey = now;

    // Today-oriented cursors follow the real current date after midnight.
    weekCursor = now;
    logCursor = now;

    // Daily Focus is intentionally day-scoped. Keep the issue itself/history,
    // but require choosing today's focus again on a new calendar day.
    if (previous !== now) {
      state.settings.dailyFocusTaskId = "";
    }

    state.settings.dayKey = now;
    save();
    renderAll();
    scheduleMidnight();
    return true;
  }

  function renderClockStatus() {
    const label = $("#clockStatus");
    if (!label) return;
    label.textContent =
      calendarClock.status === "verified"
        ? "Tehran time · Internet verified"
        : calendarClock.status === "estimated"
          ? "Tehran time · Using last synced time"
          : "Tehran time · Using computer clock";
    label.title =
      calendarClock.status === "device"
        ? "Internet time is unavailable. Enable automatic date and time in your computer settings if the date is wrong."
        : "Today follows Tehran midnight. Internet time is checked automatically.";
  }
  async function refreshCalendarClock() {
    handleDayRollover();
    await calendarClock.sync();
    handleDayRollover();
    scheduleMidnight();
    renderClockStatus();
    checkReminders();
  }
  // Resync after sleep, clock changes, and reconnecting; no fixed date or +1-day patch.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshCalendarClock();
  });
  window.addEventListener("focus", refreshCalendarClock);
  window.addEventListener("pageshow", refreshCalendarClock);
  window.addEventListener("online", refreshCalendarClock);
  setInterval(refreshCalendarClock, 30000);
  // The launcher may still be fetching its first time sample during startup.
  for (const delay of [2000, 8000]) setTimeout(refreshCalendarClock, delay);

  /* ===== GreenFlow v10: focus controls, goals, richer planner/logs ===== */
  function parseDurationHM(v) {
    v = enDigits(v).trim().replace(/\s/g, "");
    if (!v) return 0;
    if (/^\d+$/.test(v)) return Number.isSafeInteger(Number(v)) ? Number(v) : 0;
    let m = v.match(/^(\d+)[,:.](\d{1,2})$/);
    if (!m) return 0;
    let h = Number(m[1]),
      mm = Number(m[2]);
    const minutes = h * 60 + mm;
    return mm < 60 && Number.isSafeInteger(minutes) ? minutes : 0;
  }
  function todayLoggedMin(taskId) {
    return indexData().taskDayMinutes.get(taskId + ":" + today()) || 0;
  }

  function focusElapsedMin() {
    let f = focusData(),
      total = f.minutes * 60,
      rem = focusRemaining();
    return Math.max(0, Math.ceil((total - rem) / 60));
  }
  function focusStop(saveLog) {
    let f = focusData();
    if (!f.running && focusRemaining() === f.minutes * 60) return;
    let mins = focusElapsedMin();
    f.remaining = focusRemaining();
    f.running = false;
    f.endAt = null;
    if (
      saveLog &&
      mins > 0 &&
      f.taskId &&
      state.tasks.some((t) => t.id === f.taskId)
    ) {
      state.logs.push({
        id: uid(),
        taskId: f.taskId,
        date: today(),
        start: "",
        end: "",
        minutes: mins,
        note: "Stopped focus session",
        source: "focus",
      });
      toast(`Focus stopped · ${fmtMin(mins)} logged`);
    } else
      toast(
        saveLog ? "Focus stopped — no linked issue to log" : "Focus cancelled",
      );
    f.remaining = f.minutes * 60;
    f.startedAt = null;
    save();
    stopFocusTick();
    renderAll();
  }
  function focusStartDialog(taskId) {
    if (focusData().running) {
      toast("Pause or stop the current focus session first");
      return;
    }
    let t = state.tasks.find((x) => x.id === taskId);
    let f = focusData();
    modal(
      `<h2>Start focus</h2><p class="sub">${t ? `${esc(t.key)} — ${esc(t.title)}` : "Focus session"}</p><form class="form" id="focusLaunchForm"><label>Focus duration <span class="hint">minutes</span><input name="minutes" type="number" min="1" max="240" value="${f.minutes || 25}" required></label><div class="focus-presets"><button type="button" data-launch-min="25">25</button><button type="button" data-launch-min="45">45</button><button type="button" data-launch-min="60">60</button><button type="button" data-launch-min="90">90</button></div><label class="focus-log-toggle"><input name="autoLog" type="checkbox" checked> Log the session to this issue</label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Start focus</button></div></form>`,
    );
    $("#focusLaunchForm").onsubmit = (e) => {
      e.preventDefault();
      let x = new FormData(e.currentTarget),
        mins = Number(x.get("minutes")) || 25;
      f.minutes = mins;
      f.remaining = mins * 60;
      f.taskId = taskId || "";
      f.autoLog = x.get("autoLog") === "on";
      f.running = false;
      f.endAt = null;
      f.startedAt = null;
      save();
      closeOverlay();
      openView("today");
      focusStart();
      setTimeout(
        () =>
          document
            .querySelector(".focus-card")
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        30,
      );
    };
  }

  function renderWeeklyGoal() {
    state.settings.dailyGoalMinutes =
      Number(state.settings.dailyGoalMinutes) || 420;
    const d = today(),
      mins = state.logs
        .filter((l) => l.date === d)
        .reduce((a, l) => a + Number(l.minutes || 0), 0),
      goal = state.settings.dailyGoalMinutes,
      pct = goal ? Math.min(100, Math.round((mins / goal) * 100)) : 0;
    $("#weeklyGoalBar").style.width = pct + "%";
    $("#weeklyGoalValue").textContent =
      `${fmtMin(mins)} / ${fmtMin(goal)} · ${pct}%`;
    $("#weeklyGoalText").textContent =
      mins >= goal
        ? `Daily goal reached · ${fmtMin(mins - goal)} over target.`
        : `${fmtMin(Math.max(0, goal - mins))} remaining today.`;
    $("#weeklyGoalEdit").textContent = "Edit goal";
  }
  function weeklyGoalDialog() {
    let g = Number(state.settings.dailyGoalMinutes) || 420,
      h = Math.floor(g / 60),
      m = g % 60;
    modal(
      `<h2>Daily time goal</h2><p class="sub">Set your standard work target for each day. Task, focus, and routine logs from today all count.</p><form class="form" id="goalForm"><label>Daily target <span class="hint">H:MM — e.g. 7:00</span><input name="duration" value="${h}:${String(m).padStart(2, "0")}" placeholder="7:00" required></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save goal</button></div></form>`,
    );
    $("#goalForm").onsubmit = (e) => {
      e.preventDefault();
      let mins = parseDurationHM(new FormData(e.currentTarget).get("duration"));
      if (!mins) {
        toast("Use a duration like 7:00");
        return;
      }
      state.settings.dailyGoalMinutes = mins;
      save();
      closeOverlay();
      renderWeeklyGoal();
      toast("Daily goal saved");
    };
  }

  function pParts(d) {
    if (datePartsCache.has(d)) return datePartsCache.get(d);
    const out = {};
    dateFormats.parts.formatToParts(fromISO(d)).forEach((p) => {
      if (["year", "month", "day"].includes(p.type))
        out[p.type] = Number(p.value);
    });
    if (datePartsCache.size >= 2000) datePartsCache.clear();
    datePartsCache.set(d, out);
    return out;
  }
  function pMonthName(d) {
    return dateFormats.monthYear.format(fromISO(d));
  }
  function findPersianMonthStart(d) {
    const p = pParts(d);
    return jalaliToISO(`${p.year}/${p.month}/1`);
  }
  function findPersianMonthEnd(d) {
    return addDays(movePersianMonth(findPersianMonthStart(d), 1), -1);
  }
  function movePersianMonth(d, n) {
    const p = pParts(d),
      m = p.year * 12 + p.month - 1 + n;
    return jalaliToISO(`${Math.floor(m / 12)}/${(m % 12) + 1}/1`);
  }
  function persianYearMonths(d) {
    const p = pParts(d);
    return Array.from({ length: 12 }, (_, i) =>
      jalaliToISO(`${p.year}/${i + 1}/1`),
    );
  }
  function plannerItems(d) {
    let ps = indexData().plansByDate.get(d) || [],
      rs = state.routines.filter((r) => routineOccurs(r, d));
    return { ps, rs };
  }
  function renderPlannerWeek() {
    let start = weekStart(weekCursor),
      end = addDays(start, 6);
    $("#weekLabel").textContent = `${jalali(start)} — ${jalali(end)}`;
    $("#weekGrid").className = "weekgrid";
    $("#weekGrid").innerHTML = Array.from({ length: 7 }, (_, i) => {
      let d = addDays(start, i),
        { ps, rs } = plannerItems(d);
      return `<article class="day ${d === today() ? "today" : ""}"><div class="dayhead"><div><b>${weekdayFa(d)}</b><div class="jalali">${jalali(d)}</div></div><button class="dayadd" data-adddate="${d}">＋</button></div>${ps.map((p) => `<div class="mini-plan editable-plan" data-edit-plan="${p.id}" role="button" tabindex="0"><b>${p.time ? faNum(p.time) + " · " : ""}${esc(p.title)}</b></div>`).join("")}${rs.map((r) => `<label class="mini-routine"><input type="checkbox" data-rcheck="${r.id}" data-date="${d}" ${r.checks?.[d] ? "checked" : ""}> ${esc(r.title)}</label>`).join("")}${!ps.length && !rs.length ? '<div class="empty">No plans</div>' : ""}</article>`;
    }).join("");
  }
  function renderPlannerMonth() {
    let s = findPersianMonthStart(weekCursor),
      e = findPersianMonthEnd(weekCursor),
      gridStart = weekStart(s),
      days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    $("#weekLabel").textContent = pMonthName(s);
    $("#weekGrid").className = "month-calendar";
    let heads = weekFa
      .map((x) => `<div class="cal-weekday">${x}</div>`)
      .join("");
    $("#weekGrid").innerHTML =
      heads +
      days
        .map((d) => {
          let pp = pParts(d),
            cur = pParts(s),
            { ps, rs } = plannerItems(d),
            inside = pp.month === cur.month && pp.year === cur.year;
          return `<article class="month-day ${inside ? "" : "out"} ${d === today() ? "today" : ""}" data-caldate="${d}"><div class="num">${faNum(pp.day)} · ${weekdayFa(d)}</div>${ps
            .slice(0, 3)
            .map(
              (p) =>
                `<div class="cal-item editable-plan" data-edit-plan="${p.id}" role="button" tabindex="0">${p.time ? faNum(p.time) + " " : ""}${esc(p.title)}</div>`,
            )
            .join("")}${rs
            .slice(0, 2)
            .map((r) => `<div class="cal-item routine">${esc(r.title)}</div>`)
            .join("")}</article>`;
        })
        .join("");
  }
  function renderPlannerYear() {
    let months = persianYearMonths(weekCursor),
      py = pParts(weekCursor).year;
    $("#weekLabel").textContent = faNum(py);
    $("#weekGrid").className = "year-grid";
    $("#weekGrid").innerHTML = months
      .map((ms) => {
        let me = findPersianMonthEnd(ms),
          cnt = state.plans.filter((p) => p.date >= ms && p.date <= me).length,
          ds = [];
        for (let d = ms; d <= me; d = addDays(d, 1)) {
          let pp = pParts(d),
            has =
              indexData().plansByDate.has(d) ||
              state.routines.some((r) => routineOccurs(r, d));
          ds.push(`<span class="${has ? "has" : ""}">${faNum(pp.day)}</span>`);
        }
        return `<article class="year-month" data-open-month="${ms}"><h3>${dateFormats.month.format(fromISO(ms))}</h3><div class="month-stat">${faNum(cnt)} scheduled plans</div><div class="mini-month">${ds.join("")}</div></article>`;
      })
      .join("");
  }
  function renderPlanner() {
    state.settings.plannerMode = state.settings.plannerMode || "week";
    $$("[data-plannermode]").forEach((b) =>
      b.classList.toggle(
        "selected",
        b.dataset.plannermode === state.settings.plannerMode,
      ),
    );
    if (state.settings.plannerMode === "month") renderPlannerMonth();
    else if (state.settings.plannerMode === "year") renderPlannerYear();
    else renderPlannerWeek();
  }

  function reminderForm(rem = null) {
    const edit = !!rem,
      d = rem?.date || today();
    modal(
      `<h2>${edit ? "Edit reminder" : "New reminder"}</h2><p class="sub">A reminder is separate from Today plans and Jira issues.</p><form class="form" id="reminderForm"><label>Name<input name="title" required autofocus value="${esc(rem?.title || "")}" placeholder="e.g. Dentist appointment / Birthday"></label><label>Date<input type="date" name="date" required value="${d}"><span class="hint">${jalali(d)}</span></label><label>Time <span class="hint">optional</span><input type="time" name="time" value="${rem?.time || ""}"></label><div class="form-actions">${edit ? `<button type="button" class="danger" data-delete-reminder="${rem.id}">Delete</button>` : ""}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit ? "Save reminder" : "Add reminder"}</button></div></form>`,
    );
    $("#reminderForm").onsubmit = (e) => {
      e.preventDefault();
      let x = new FormData(e.currentTarget),
        obj = {
          title: x.get("title").trim(),
          date: x.get("date"),
          time: x.get("time"),
          notified: false,
        };
      if (!obj.title) {
        toast("Enter a reminder name");
        return;
      }
      if (edit) Object.assign(rem, obj);
      else state.reminders.push({ id: uid(), ...obj });
      if ("Notification" in window && Notification.permission === "default")
        Notification.requestPermission().catch(() => {});
      save();
      closeOverlay();
      renderAll();
      toast(edit ? "Reminder updated" : "Reminder added");
    };
  }
  function renderReminders() {
    const host = $("#reminderList");
    if (!host) return;
    const rows = [...state.reminders].sort((a, b) =>
      (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
    );
    host.innerHTML = rows.length
      ? rows
          .map(
            (r) =>
              `<div class="reminder-row"><div class="reminder-mark">♢</div><div class="grow"><b>${esc(r.title)}</b><p>${weekdayFa(r.date)} · ${jalali(r.date)}${r.time ? " · " + faNum(r.time) : " · No fixed time"}</p></div><button class="secondary small" data-edit-reminder="${r.id}">Edit</button></div>`,
          )
          .join("")
      : empty("No reminders", "Create simple date-based reminders here.");
    const n = $("#navReminders");
    if (n)
      n.textContent = state.reminders.filter((r) => r.date >= today()).length;
  }

  function routineCheckDialog(r, d) {
    let checked = !!r.checks?.[d];
    if (checked) {
      r.checks[d] = false;
      state.logs = state.logs.filter(
        (l) =>
          !(l.source === "routine" && l.routineId === r.id && l.date === d),
      );
      save();
      renderAll();
      toast("Routine unchecked and its log removed");
      return;
    }
    modal(
      `<h2>Complete routine</h2><p class="sub">${esc(r.title)} · ${weekdayFa(d)} ${jalali(d)}</p><form class="form" id="routineDoneForm"><label>Time spent <span class="hint">optional, H:MM — e.g. 0:45</span><input name="duration" placeholder="0:45"></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Complete</button></div></form>`,
    );
    $("#routineDoneForm").onsubmit = (e) => {
      e.preventDefault();
      const raw = new FormData(e.currentTarget).get("duration").trim();
      let mins = parseDurationHM(raw);
      if (raw && mins <= 0) {
        toast("Enter a valid duration");
        return;
      }
      r.checks = r.checks || {};
      r.checks[d] = true;
      if (mins > 0)
        state.logs.push({
          id: uid(),
          routineId: r.id,
          date: d,
          minutes: mins,
          note: r.title,
          source: "routine",
        });
      save();
      closeOverlay();
      renderAll();
      toast(
        mins ? `Routine complete · ${fmtMin(mins)} logged` : "Routine complete",
      );
    };
  }

  function checkReminders() {
    const p = clockParts();
    let d = `${p.year}-${p.month}-${p.day}`,
      hh = `${p.hour}:${p.minute}`,
      changed = false;
    state.reminders
      .filter((r) => r.date === d && !r.notified)
      .forEach((r) => {
        if (!r.time || hh >= r.time) {
          try {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            )
              new Notification("GreenFlow reminder", { body: r.title });
          } catch {}
          r.notified = true;
          changed = true;
          toast(`Reminder: ${r.title}`);
        }
      });
    if (changed) {
      save();
      renderReminders();
    }
  }
  setInterval(checkReminders, 30000);
  setTimeout(checkReminders, 1200);

  // Capture handlers override older generic handlers where behavior changed.
  document.addEventListener(
    "click",
    (e) => {
      let el = e.target.closest("#focusStop");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        focusStop(true);
        return;
      }
      el = e.target.closest("#focusCancel");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        focusStop(false);
        return;
      }
      el = e.target.closest("[data-focus-issue]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        focusStartDialog(el.dataset.focusIssue);
        return;
      }
      if (e.target.closest("#dailyFocusChoose")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        chooseDailyFocusV12();
        return;
      }
      el = e.target.closest("[data-pick-focus]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        state.settings.dailyFocusTaskId = el.dataset.pickFocus;
        save();
        closeOverlay();
        renderToday();
        toast("Daily focus set");
        return;
      }
      el = e.target.closest("[data-launch-min]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let i = $('#focusLaunchForm input[name="minutes"]');
        if (i) i.value = el.dataset.launchMin;
        return;
      }
      if (e.target.closest("#weeklyGoalEdit")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        weeklyGoalDialog();
        return;
      }
      el = e.target.closest("[data-rcheck]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let r = state.routines.find((x) => x.id === el.dataset.rcheck);
        if (r) routineCheckDialog(r, el.dataset.date);
        return;
      }
      el = e.target.closest("[data-plannermode]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        state.settings.plannerMode = el.dataset.plannermode;
        save();
        renderPlanner();
        return;
      }
      el = e.target.closest("[data-plannermove]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let n = Number(el.dataset.plannermove),
          m = state.settings.plannerMode || "week";
        if (m === "week") weekCursor = addDays(weekCursor, n * 7);
        else if (m === "month") weekCursor = movePersianMonth(weekCursor, n);
        else {
          let months = persianYearMonths(weekCursor);
          weekCursor =
            n > 0
              ? addDays(findPersianMonthEnd(months[11]), 1)
              : addDays(findPersianMonthStart(months[0]), -1);
        }
        renderPlanner();
        return;
      }
      if (e.target.closest("[data-plannercurrent]")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        weekCursor = today();
        renderPlanner();
        return;
      }
      el = e.target.closest("[data-open-month]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        weekCursor = el.dataset.openMonth;
        state.settings.plannerMode = "month";
        save();
        renderPlanner();
        return;
      }
      if (e.target.closest("[data-edit-plan],[data-plan-log]")) return;
      el = e.target.closest("[data-caldate]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        quickPlan(el.dataset.caldate);
        return;
      }
    },
    true,
  );

  // ===== v11: permanent archive + detailed work-log history =====
  function archiveTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.status === "archived") return;
    t.archivedFrom = t.status;
    t.status = "archived";
    t.archivedAt = today();
    if (state.settings.dailyFocusTaskId === id)
      state.settings.dailyFocusTaskId = "";
    const f = focusData();
    if (f.taskId === id && !f.running) f.taskId = "";
    save();
    closeOverlay();
    renderAll();
    toast("Issue archived · history preserved");
  }
  function restoreTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.status !== "archived") return;
    t.status = ["backlog", "todo", "doing", "done"].includes(t.archivedFrom)
      ? t.archivedFrom
      : "backlog";
    delete t.archivedAt;
    delete t.archivedFrom;
    save();
    renderAll();
    openTask(id);
    toast("Issue restored");
  }
  function renderArchive() {
    const host = $("#archiveList");
    if (!host) return;
    const q = ($("#archiveSearch")?.value || "").trim().toLowerCase(),
      sf = $("#archiveStatusFilter")?.value || "all";
    const rows = state.tasks.filter(
      (t) =>
        t.status === "archived" &&
        (!q ||
          (
            t.title +
            " " +
            t.key +
            " " +
            (t.label || "") +
            " " +
            (t.description || "")
          )
            .toLowerCase()
            .includes(q)) &&
        (sf === "all" || t.archivedFrom === sf),
    );
    host.innerHTML = rows.length
      ? rows
          .map(
            (t) =>
              `<div class="archive-item archive-grid" data-open-task="${t.id}"><span><span class="key">${esc(t.key)}</span><b>${esc(t.title)}</b><small>${esc(t.label || "No label")}</small></span><span class="status-chip ${t.archivedFrom || "done"}">${(t.archivedFrom || "done").toUpperCase()}</span><span>${fmtMin(loggedMin(t.id))}</span><span>${t.archivedAt ? jalali(t.archivedAt) : "—"}</span><span><button class="movebtn" data-restore-task="${t.id}">Restore</button></span></div>`,
          )
          .join("")
      : empty(
          "Archive is empty",
          "Archive any issue from its detail panel. Nothing is deleted.",
        );
  }

  function logSourceLabel(l) {
    return l.source === "routine"
      ? "Routine"
      : l.source === "focus" || l.note === "Focus session"
        ? "Focus session"
        : "Manual work";
  }
  function editLogForm(logId, returnTaskId = "") {
    const l = state.logs.find((x) => x.id === logId);
    if (!l) return;
    modal(
      `<h2>Edit work log</h2><p class="sub">Update the historical record without changing the issue itself.</p><form class="form" id="editLogForm"><label>Date<input type="date" name="date" value="${l.date}" required><span class="hint">${jalali(l.date)}</span></label><label>Duration <span class="hint">H:MM — e.g. 1:40</span><input name="duration" value="${Math.floor(Number(l.minutes || 0) / 60)}:${String(Number(l.minutes || 0) % 60).padStart(2, "0")}" required></label><div class="two"><label>From <span class="hint">optional</span><input type="time" name="start" value="${l.start || ""}"></label><label>To <span class="hint">optional</span><input type="time" name="end" value="${l.end || ""}"></label></div><label>Work description <span class="hint">optional</span><textarea name="note" placeholder="What exactly was done?">${esc(l.note || "")}</textarea></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save log</button></div></form>`,
    );
    $("#editLogForm").onsubmit = (e) => {
      e.preventDefault();
      const x = new FormData(e.currentTarget),
        mins = parseDurationHM(x.get("duration"));
      if (mins <= 0) {
        toast("Enter a valid duration");
        return;
      }
      const oldDate = l.date;
      Object.assign(l, {
        date: x.get("date"),
        minutes: mins,
        start: x.get("start"),
        end: x.get("end"),
        note: x.get("note").trim(),
      });
      if (l.routineId && oldDate !== l.date) {
        const routine = indexData().routines.get(l.routineId);
        if (routine) {
          routine.checks[l.date] = true;
          if (
            !state.logs.some(
              (other) =>
                other.id !== l.id &&
                other.routineId === l.routineId &&
                other.date === oldDate,
            )
          )
            routine.checks[oldDate] = false;
        }
      }
      save();
      closeOverlay();
      renderAll();
      if (returnTaskId) openTask(returnTaskId);
      toast("Work log updated");
    };
  }
  function openTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    const archived = t.status === "archived",
      logs = taskLogs(id).sort((a, b) =>
        (b.date + (b.start || "")).localeCompare(a.date + (a.start || "")),
      ),
      lm = loggedMin(id),
      sub = t.subtasks || [],
      displayStatus = archived ? t.archivedFrom || "done" : t.status;
    $("#overlayRoot").innerHTML =
      `<div class="drawer-shade"><aside class="drawer"><div class="drawer-head"><span class="typeicon">✓</span><span class="key">${esc(t.key)}</span>${archived ? '<span class="archive-badge">ARCHIVED</span>' : ""}<button class="drawer-close" data-close>×</button></div><div class="drawer-body"><div><h2>${esc(t.title)}</h2><div class="drawer-actions">${archived ? `<button class="primary" data-restore-task="${t.id}">↩ Restore</button>` : `<button class="primary" data-task-log="${t.id}">◷ Log work</button><button class="secondary" data-edit-task="${t.id}">Edit</button><button class="secondary ${state.settings.dailyFocusTaskId === t.id ? "focus-selected" : ""}" data-set-daily-focus="${t.id}">${state.settings.dailyFocusTaskId === t.id ? "✓ Daily focus" : "Set as Daily Focus"}</button><button class="secondary archive-action" data-archive-task="${t.id}">Archive</button>`}</div><div class="section-title">Description</div><div class="desc ${t.description ? "" : "emptydesc"}">${t.description ? esc(t.description) : "No description added."}</div><div class="section-title">Subtasks</div><div id="subtaskList">${sub.length ? sub.map((s) => `<label class="subtask"><input type="checkbox" data-subcheck="${t.id}" data-subid="${s.id}" ${s.done ? "checked" : ""} ${archived ? "disabled" : ""}><span>${esc(s.title)}</span></label>`).join("") : '<div class="empty">No subtasks</div>'}</div>${archived ? "" : `<div class="add-sub"><input id="newSubInput" placeholder="Add a subtask"><button data-add-sub="${t.id}">＋</button></div>`}<div class="section-title worklog-title"><span>Work log history</span><span>${logs.length} ${logs.length === 1 ? "entry" : "entries"} · ${fmtMin(lm)}</span></div><div class="worklog-history">${logs.length ? logs.map((l) => `<div class="worklog detailed"><div class="wl-icon">◷</div><div class="worklog-main"><div class="worklog-meta"><b>${weekdayFa(l.date)} · ${jalali(l.date)}</b><span class="log-source ${l.source === "routine" ? "routine-source" : ""}">${logSourceLabel(l)}</span></div><p>${l.start ? `From ${faNum(l.start)}${l.end ? " to " + faNum(l.end) : ""}` : "No clock time"} · <strong>${fmtMin(l.minutes)}</strong></p><div class="worklog-comment ${l.note ? "" : "muted"}">${l.note ? esc(l.note) : "No work description / comment."}</div></div><div class="worklog-tools"><strong>${fmtMin(l.minutes)}</strong>${l.source === "routine" ? "" : `<button title="Edit log" data-edit-log="${l.id}" data-return-task="${t.id}">Edit</button>`}<button title="Delete log" class="log-delete" data-task-delete-log="${l.id}" data-return-task="${t.id}">Delete</button></div></div>`).join("") : empty("No work logged yet", "Future logs and comments will appear here as a permanent history.")}</div></div><aside><div class="side-field"><span>Status</span><b class="status-chip ${displayStatus}">${archived ? "ARCHIVED · " + displayStatus.toUpperCase() : displayStatus === "doing" ? "IN PROGRESS" : displayStatus === "todo" ? "TO DO" : displayStatus === "backlog" ? "BACKLOG" : "DONE"}</b></div><div class="side-field"><span>Priority</span><b class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</b></div><div class="side-field"><span>Label</span><b>${esc(t.label || "None")}</b></div><div class="side-field"><span>Original estimate</span><b>${t.estimate ? fmtMin(t.estimate) : "Not set"}</b></div><div class="side-field"><span>Time logged</span><b>${fmtMin(lm)}</b></div><div class="side-field"><span>Remaining</span><b>${t.estimate ? fmtMin(Math.max(0, t.estimate - lm)) : "—"}</b></div><div class="side-field"><span>Due date</span><b>${t.due ? jalali(t.due) : "Not set"}</b></div>${archived ? `<div class="side-field"><span>Archived on</span><b>${t.archivedAt ? jalali(t.archivedAt) : "—"}</b></div>` : ""}</aside></div></aside></div>`;
  }

  document.addEventListener("input", (e) => {
    if (e.target.id === "archiveSearch") renderArchive();
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "archiveStatusFilter") renderArchive();
  });
  document.addEventListener(
    "click",
    (e) => {
      let el = e.target.closest("[data-archive-task]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (
          confirm(
            "Archive this issue? Its description, subtasks and all work logs will be preserved.",
          )
        )
          archiveTask(el.dataset.archiveTask);
        return;
      }
      el = e.target.closest("[data-restore-task]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        restoreTask(el.dataset.restoreTask);
        return;
      }
      el = e.target.closest("[data-edit-log]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        editLogForm(el.dataset.editLog, el.dataset.returnTask || "");
        return;
      }
      el = e.target.closest("[data-task-delete-log]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (confirm("Delete this work-log entry?")) {
          const ret = el.dataset.returnTask;
          state.logs = state.logs.filter(
            (x) => x.id !== el.dataset.taskDeleteLog,
          );
          save();
          renderAll();
          openTask(ret);
          toast("Work log deleted");
        }
        return;
      }
    },
    true,
  );

  // ===== v12: separate reminders + daily goal + robust Daily Focus chooser =====
  function chooseDailyFocusV12() {
    const active = state.tasks.filter((t) =>
      ["todo", "doing"].includes(t.status),
    );
    modal(
      `<h2>Change Daily Focus</h2><p class="sub">Choose one active issue as today’s primary focus.</p><div class="focus-picker">${active.length ? active.map((t) => `<button type="button" class="focus-pick-card ${state.settings.dailyFocusTaskId === t.id ? "selected" : ""}" data-pick-focus-v12="${t.id}"><span class="key">${esc(t.key)}</span><span><b>${esc(t.title)}</b><small>${esc(t.priority)}${t.label ? " · " + esc(t.label) : ""}</small></span>${state.settings.dailyFocusTaskId === t.id ? "<i>Current</i>" : ""}</button>`).join("") : empty("No active issues", "Move an issue to To Do or In Progress first.")}</div><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button></div>`,
    );
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#dailyFocusChoose")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        chooseDailyFocusV12();
        return;
      }
      let el = e.target.closest("[data-pick-focus-v12]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        state.settings.dailyFocusTaskId = el.dataset.pickFocusV12;
        save();
        closeOverlay();
        renderAll();
        toast("Daily focus changed");
        return;
      }
      el = e.target.closest('[data-action="new-reminder"]');
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        reminderForm();
        return;
      }
      el = e.target.closest("[data-edit-reminder]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let r = state.reminders.find((x) => x.id === el.dataset.editReminder);
        if (r) reminderForm(r);
        return;
      }
      el = e.target.closest("[data-delete-reminder]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (confirm("Delete this reminder?")) {
          state.reminders = state.reminders.filter(
            (x) => x.id !== el.dataset.deleteReminder,
          );
          save();
          closeOverlay();
          renderAll();
          toast("Reminder deleted");
        }
        return;
      }
    },
    true,
  );

  // ===== v13: Persian-only date UI, robust Daily Focus actions, safe backup migration =====
  function enDigits(v) {
    return String(v ?? "")
      .replace(/[۰-۹]/g, (c) => "۰۱۲۳۴۵۶۷۸۹".indexOf(c))
      .replace(/[٠-٩]/g, (c) => "٠١٢٣٤٥٦٧٨٩".indexOf(c));
  }
  function jalaliToISO(value) {
    const m = enDigits(value)
      .trim()
      .replace(/[.\-]/g, "/")
      .match(/^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return "";
    const y = Number(m[1]);
    return calendarYear(y).get(`${Number(m[2])}/${Number(m[3])}`) || "";
  }

  // Restore old GreenFlow backups without replacing user content with demo/default content.
  function importBackup(file) {
    let reader = new FileReader();
    reader.onload = () => {
      try {
        let data = JSON.parse(reader.result),
          raw = data && data.state ? data.state : data;
        if (!raw || !Array.isArray(raw.tasks))
          throw new Error("Invalid backup");
        let incoming = JSON.parse(JSON.stringify(raw));
        incoming = normalizeState(incoming);
        if (!incoming) throw new Error("Invalid backup");
        // Newer fields are defaults only when absent; user data from the backup is preserved verbatim.
        incoming.reminders = Array.isArray(incoming.reminders)
          ? incoming.reminders
          : [];
        incoming.settings = incoming.settings || {};
        if (incoming.settings.dailyGoalMinutes == null)
          incoming.settings.dailyGoalMinutes = 420;
        stopFocusTick();
        storageWritable = true;
        storedRecovery = null;
        state = incoming;
        currentDayKey = state.settings.dayKey || "";
        weekCursor = today();
        logCursor = today();
        save();
        applyTheme();
        handleDayRollover();
        renderAll();
        openView("today");
        if (focusData().running) startFocusTick();
        toast(
          `Backup restored · ${state.tasks.length} issues · ${state.routines.length} routines · ${state.logs.length} logs`,
        );
      } catch (err) {
        console.error(err);
        toast("Invalid or unsupported backup file");
      }
    };
    reader.readAsText(file);
  }

  // ===== v15 final audit fixes =====
  // Today Active Tasks must show only work logged today, not historical totals.
  function todayIssueRow(t) {
    const lm = todayLoggedMin(t.id);
    return `<div class="issue-row" data-open-task="${t.id}"><span class="typeicon">✓</span><div class="issue-summary"><b>${esc(t.title)}</b><small>${esc(t.key)} · ${esc(t.label || "Personal")}</small></div><span class="status-chip ${t.status}">${t.status === "doing" ? "IN PROGRESS" : "TO DO"}</span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate today-log">${lm ? fmtMin(lm) : "0m"} today</span></div>`;
  }
  // Logged Month/Year navigation and aggregation use Persian calendar boundaries.
  function persianYearBounds(d) {
    const months = persianYearMonths(d);
    return { start: months[0], end: findPersianMonthEnd(months[11]), months };
  }

  document.addEventListener(
    "click",
    (e) => {
      let el = e.target.closest("[data-log-open-month]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        logCursor = el.dataset.logOpenMonth;
        state.settings.logMode = "month";
        save();
        $$("[data-logmode]").forEach((b) =>
          b.classList.toggle("selected", b.dataset.logmode === "month"),
        );
        renderLogs();
        return;
      }
      el = e.target.closest("[data-logmove]");
      if (el && (state.settings.logMode || "week") === "year") {
        e.preventDefault();
        e.stopImmediatePropagation();
        let n = Number(el.dataset.logmove),
          b = persianYearBounds(logCursor);
        logCursor = n > 0 ? addDays(b.end, 1) : addDays(b.start, -1);
        renderLogs();
        return;
      }
    },
    true,
  );

  // Re-render once after final overrides are installed.
  // ===== v19 final visual Persian date + time picker =====
  (function () {
    const pMonths = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];
    const pWeek = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
    let layer = null;
    function closePicker() {
      if (layer) {
        layer.remove();
        layer = null;
      }
    }
    function fmtJ(iso) {
      if (!iso) return "";
      const p = pParts(iso);
      return `${faNum(p.day)} ${pMonths[p.month - 1]} ${faNum(p.year)}`;
    }
    function monthDays(y, m) {
      const out = [];
      for (let d = 1; d <= 31; d++) {
        const iso = jalaliToISO(`${y}/${m}/${d}`);
        if (iso) out.push({ d, iso });
      }
      return out;
    }
    function monthOffset(firstIso) {
      return [
        "شنبه",
        "یکشنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنجشنبه",
        "جمعه",
      ].indexOf(weekdayFa(firstIso));
    }
    function shell(kind) {
      closePicker();
      layer = document.createElement("div");
      layer.className = "picker-modal-layer";
      layer.innerHTML = `<div class="picker-dialog ${kind}" role="dialog" aria-modal="true"></div>`;
      document.body.appendChild(layer);
      layer.addEventListener("mousedown", (e) => {
        if (e.target === layer) closePicker();
      });
      return layer.firstElementChild;
    }
    function updateDateBox(box) {
      const h = box.querySelector('input[type="hidden"]'),
        v = box.querySelector(".vp-value");
      v.textContent = h.value ? fmtJ(h.value) : "Select date";
      v.classList.toggle("vp-placeholder", !h.value);
    }
    function openCalendar(box) {
      const hidden = box.querySelector('input[type="hidden"]');
      let pending = hidden.value || today(),
        pp = pParts(pending),
        cy = pp.year,
        cm = pp.month;
      const dlg = shell("date-picker-dialog");
      function draw() {
        const ds = monthDays(cy, cm),
          off = monthOffset(ds[0].iso),
          t = today();
        dlg.innerHTML = `<div class="picker-head"><div><small>Select date</small><strong>${pending ? fmtJ(pending) : "No date selected"}</strong></div><button type="button" class="picker-x" data-picker-cancel aria-label="Close">×</button></div>
      <div class="cal-nav"><button type="button" data-cal-prev aria-label="Previous month">‹</button><div class="cal-title">${pMonths[cm - 1]} ${faNum(cy)}</div><button type="button" data-cal-next aria-label="Next month">›</button></div>
      <div class="cal-week">${pWeek.map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="cal-grid">${Array.from({ length: off }, () => '<span class="cal-day blank"></span>').join("")}${ds.map((x) => `<button type="button" class="cal-day ${x.iso === pending ? "selected" : ""} ${x.iso === t ? "today" : ""}" data-cal-day="${x.iso}">${faNum(x.d)}</button>`).join("")}</div>
      <div class="picker-actions"><div class="picker-actions-left"><button type="button" class="picker-link" data-cal-today>Today</button>${box.dataset.required === "1" ? "" : `<button type="button" class="picker-link danger-lite" data-cal-clear>Clear</button>`}</div><div class="picker-actions-right"><button type="button" class="secondary" data-picker-cancel>Cancel</button><button type="button" class="primary" data-cal-select>Select</button></div></div>`;
        dlg.querySelector("[data-cal-prev]").onclick = () => {
          cm--;
          if (cm < 1) {
            cm = 12;
            cy--;
          }
          draw();
        };
        dlg.querySelector("[data-cal-next]").onclick = () => {
          cm++;
          if (cm > 12) {
            cm = 1;
            cy++;
          }
          draw();
        };
        dlg.querySelectorAll("[data-cal-day]").forEach(
          (b) =>
            (b.onclick = () => {
              pending = b.dataset.calDay;
              const q = pParts(pending);
              cy = q.year;
              cm = q.month;
              draw();
            }),
        );
        dlg.querySelector("[data-cal-today]").onclick = () => {
          pending = today();
          const q = pParts(pending);
          cy = q.year;
          cm = q.month;
          draw();
        };
        dlg.querySelector("[data-cal-clear]")?.addEventListener("click", () => {
          pending = "";
          draw();
        });
        dlg
          .querySelectorAll("[data-picker-cancel]")
          .forEach((b) => (b.onclick = closePicker));
        dlg.querySelector("[data-cal-select]").onclick = () => {
          if (box.dataset.required === "1" && !pending) {
            toast("Please select a date");
            return;
          }
          hidden.value = pending;
          updateDateBox(box);
          closePicker();
        };
      }
      draw();
    }
    function visualDate(old) {
      const hidden = old;
      const box = document.createElement("div");
      box.className = "visual-picker visual-date-picker";
      box.dataset.required = old.required ? "1" : "0";
      box.innerHTML = `<input type="hidden" name="${esc(hidden.name)}" value="${esc(hidden.value)}"><button type="button" class="visual-picker-trigger"><span class="vp-value"></span><span class="vp-icon">▣</span></button>`;
      old.replaceWith(box);
      updateDateBox(box);
      box.querySelector(".visual-picker-trigger").onclick = () =>
        openCalendar(box);
    }
    function updateTimeBox(box) {
      const h = box.querySelector('input[type="hidden"]'),
        v = box.querySelector(".vp-value");
      v.textContent = h.value ? faNum(h.value) : "Select time";
      v.classList.toggle("vp-placeholder", !h.value);
    }
    function openTime(box) {
      const hidden = box.querySelector('input[type="hidden"]'),
        parts = (hidden.value || "09:00").split(":");
      let hour = Number(parts[0] || 9),
        minute = Number(parts[1] || 0),
        cleared = false;
      const dlg = shell("time-picker-dialog");
      dlg.innerHTML = `<div class="picker-head"><div><small>Select time</small><strong data-time-preview>${faNum(String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"))}</strong></div><button type="button" class="picker-x" data-picker-cancel>×</button></div>
      <div class="wheel-time"><div class="wheel-col" data-wheel-h>${Array.from({ length: 24 }, (_, i) => `<button type="button" class="wheel-item ${i === hour ? "active" : ""}" data-v="${i}">${faNum(String(i).padStart(2, "0"))}</button>`).join("")}</div><div class="wheel-sep">:</div><div class="wheel-col" data-wheel-m>${Array.from({ length: 60 }, (_, i) => `<button type="button" class="wheel-item ${i === minute ? "active" : ""}" data-v="${i}">${faNum(String(i).padStart(2, "0"))}</button>`).join("")}</div></div>
      <div class="picker-actions"><div>${box.dataset.required === "1" ? "" : `<button type="button" class="picker-link danger-lite" data-time-clear>Clear</button>`}</div><div class="picker-actions-right"><button type="button" class="secondary" data-picker-cancel>Cancel</button><button type="button" class="primary" data-time-select>Select</button></div></div>`;
      const preview = () => {
        dlg.querySelector("[data-time-preview]").textContent = cleared
          ? "No time selected"
          : faNum(
              `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
            );
      };
      const bind = (col, type) => {
        const items = [...col.querySelectorAll(".wheel-item")];
        const set = (v) => {
          cleared = false;
          if (type === "h") hour = v;
          else minute = v;
          items.forEach((x) =>
            x.classList.toggle("active", Number(x.dataset.v) === v),
          );
          preview();
        };
        items.forEach(
          (x) =>
            (x.onclick = () => {
              set(Number(x.dataset.v));
              x.scrollIntoView({ block: "center", behavior: "smooth" });
            }),
        );
        setTimeout(
          () =>
            items
              .find((x) => x.classList.contains("active"))
              ?.scrollIntoView({ block: "center" }),
          0,
        );
      };
      bind(dlg.querySelector("[data-wheel-h]"), "h");
      bind(dlg.querySelector("[data-wheel-m]"), "m");
      dlg.querySelector("[data-time-clear]")?.addEventListener("click", () => {
        cleared = true;
        preview();
      });
      dlg
        .querySelectorAll("[data-picker-cancel]")
        .forEach((b) => (b.onclick = closePicker));
      dlg.querySelector("[data-time-select]").onclick = () => {
        if (box.dataset.required === "1" && cleared) {
          toast("Please select a time");
          return;
        }
        hidden.value = cleared
          ? ""
          : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        updateTimeBox(box);
        closePicker();
      };
    }
    function visualTime(old) {
      const hidden = old;
      const box = document.createElement("div");
      box.className = "visual-picker visual-time-picker";
      box.dataset.required = old.required ? "1" : "0";
      box.innerHTML = `<input type="hidden" name="${esc(hidden.name)}" value="${esc(hidden.value)}"><button type="button" class="visual-picker-trigger"><span class="vp-value"></span><span class="vp-icon">◷</span></button>`;
      old.replaceWith(box);
      updateTimeBox(box);
      box.querySelector(".visual-picker-trigger").onclick = () => openTime(box);
    }
    function upgrade(root) {
      root.querySelectorAll('input[type="date"]').forEach(visualDate);
      root.querySelectorAll('input[type="time"]').forEach(visualTime);
    }
    const modalV15 = modal;
    modal = function (html) {
      modalV15(html);
      upgrade($("#overlayRoot"));
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (layer) closePicker();
        else closeOverlay();
      }
    });
    document.addEventListener(
      "submit",
      (e) => {
        const invalid = [
          ...e.target.querySelectorAll('.visual-picker[data-required="1"]'),
        ].some((box) => !box.querySelector("input").value);
        if (invalid) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toast("Please select the required date/time");
        }
      },
      true,
    );
  })();

  // ===== v17 interaction hardening =====
  // The decorative hero layer must never intercept pointer events (CSS also enforces this).
  document.addEventListener(
    "click",
    function (e) {
      const choose = e.target.closest("#dailyFocusChoose");
      if (choose) {
        e.preventDefault();
        e.stopImmediatePropagation();
        chooseDailyFocusV12();
        return;
      }
      const open = e.target.closest("#dailyFocusOpen");
      if (open) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const id = state.settings.dailyFocusTaskId;
        if (id) openTask(id);
        return;
      }
      const start = e.target.closest("#dailyFocusStart");
      if (start) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const id = state.settings.dailyFocusTaskId;
        if (id) focusStartDialog(id);
        return;
      }
    },
    true,
  );

  // Shared indexes are rebuilt only when data changes, not for each rendered row.
  function indexData() {
    if (dataIndex) return dataIndex;
    const tasks = new Map(state.tasks.map((t) => [t.id, t])),
      routines = new Map(state.routines.map((r) => [r.id, r])),
      plans = new Map(state.plans.map((p) => [p.id, p]));
    const logsByTask = new Map(),
      taskMinutes = new Map(),
      taskDayMinutes = new Map(),
      plansByDate = new Map(),
      planMinutes = new Map();
    for (const p of state.plans) {
      if (!plansByDate.has(p.date)) plansByDate.set(p.date, []);
      plansByDate.get(p.date).push(p);
    }
    for (const ps of plansByDate.values())
      ps.sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    for (const l of state.logs) {
      if (l.planId)
        planMinutes.set(
          l.planId,
          (planMinutes.get(l.planId) || 0) + Number(l.minutes || 0),
        );
      if (!l.taskId) continue;
      if (!logsByTask.has(l.taskId)) logsByTask.set(l.taskId, []);
      logsByTask.get(l.taskId).push(l);
      taskMinutes.set(
        l.taskId,
        (taskMinutes.get(l.taskId) || 0) + Number(l.minutes || 0),
      );
      const key = l.taskId + ":" + l.date;
      taskDayMinutes.set(
        key,
        (taskDayMinutes.get(key) || 0) + Number(l.minutes || 0),
      );
    }
    return (dataIndex = {
      tasks,
      routines,
      plans,
      logsByTask,
      taskMinutes,
      taskDayMinutes,
      plansByDate,
      planMinutes,
    });
  }
  function renderView(id) {
    const renderers = {
      today: renderToday,
      planner: renderPlanner,
      backlog: renderBacklog,
      active: renderBoard,
      logged: renderLogs,
      reminders: renderReminders,
      archive: renderArchive,
      routines: renderRoutines,
    };
    dirtyViews.delete(id);
    renderers[id]?.();
  }
  function calendarYear(y) {
    if (calendarYears.has(y)) return calendarYears.get(y);
    const map = new Map();
    let d = new Date(Date.UTC(y + 621, 2, 15, 12));
    for (let i = 0; i < 375; i++) {
      const is = iso(d),
        p = pParts(is);
      if (p.year === y) map.set(`${p.month}/${p.day}`, is);
      else if (p.year > y && map.size) break;
      d.setUTCDate(d.getUTCDate() + 1);
    }
    if (calendarYears.size >= 6) calendarYears.clear();
    calendarYears.set(y, map);
    return map;
  }
  let midnightTimer;
  function scheduleMidnight() {
    clearTimeout(midnightTimer);
    const now = calendarClock.now();
    const p = clockParts(now);
    const elapsed =
      (Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second)) *
        1000 +
      now.getUTCMilliseconds();
    const untilMidnight = 86400000 - elapsed;
    midnightTimer = setTimeout(
      () => handleDayRollover(),
      Math.max(1, untilMidnight + 25),
    );
  }

  function renderToday() {
    const d = today(),
      idx = indexData(),
      active = state.tasks.filter((t) => ["todo", "doing"].includes(t.status));
    $("#todayDate").textContent = longJ(d);
    $("#todayActive").innerHTML = active.length
      ? active.map(todayIssueRow).join("")
      : empty(
          "No active issues",
          "Move a backlog issue to Active when you are ready.",
        );
    const plans = idx.plansByDate.get(d) || [];
    $("#todayPlans").innerHTML = plans.length
      ? plans
          .map((p) => {
            const logged = idx.planMinutes.get(p.id) || 0;
            return `<div class="plan-row editable-plan" data-edit-plan="${p.id}" role="button" tabindex="0" aria-label="Edit plan: ${esc(p.title)}"><button class="check ${p.done ? "done" : ""}" data-plancheck="${p.id}" aria-label="${p.done ? "Mark incomplete" : "Complete plan"}">${p.done ? "✓" : ""}</button><div class="plan-time">${p.time ? faNum(p.time) : "Anytime"}<small>${p.duration ? fmtMin(p.duration) + " planned" : ""}</small></div><div class="grow"><b>${esc(p.title)}</b><p>${esc(p.note || "")}${logged ? " · " + fmtMin(logged) + " logged" : ""}</p></div><button class="secondary small" data-plan-log="${p.id}">Log time</button></div>`;
          })
          .join("")
      : empty("Nothing scheduled", "Use Quick plan for one-off events.");
    const routines = state.routines.filter((r) => routineOccurs(r, d));
    $("#todayRoutines").innerHTML = routines.length
      ? routines
          .map((r) => {
            const log = state.logs.find(
              (l) => l.routineId === r.id && l.date === d,
            );
            return `<div class="routine-check"><button class="check ${r.checks?.[d] ? "done" : ""}" data-rcheck="${r.id}" data-date="${d}" aria-label="Complete routine">${r.checks?.[d] ? "✓" : ""}</button><div class="grow"><b>${esc(r.title)}</b><p>${r.time ? faNum(r.time) : "No fixed time"}</p></div>${log ? `<span class="routine-duration-badge">${fmtMin(log.minutes)} logged</span>` : ""}</div>`;
          })
          .join("")
      : empty("No routines today");
    const focus = idx.tasks.get(state.settings.dailyFocusTaskId),
      valid = focus && ["todo", "doing"].includes(focus.status);
    const open = $("#dailyFocusOpen"),
      start = $("#dailyFocusStart");
    open.hidden = start.hidden = !valid;
    $("#dailyFocusChoose").textContent = valid ? "Change" : "Choose issue";
    if (valid) {
      const logged = loggedMin(focus.id);
      $("#dailyFocusContent").innerHTML =
        `<div class="focus-issue-key">${esc(focus.key)} · ${esc(focus.priority)}</div><strong>${esc(focus.title)}</strong><small>${fmtMin(logged)} logged${focus.estimate ? " · " + fmtMin(Math.max(0, focus.estimate - logged)) + " remaining" : ""}${focus.due ? " · Due " + jalali(focus.due) : ""}</small>`;
      open.dataset.openTask = focus.id;
      start.dataset.focusIssue = focus.id;
    } else {
      $("#dailyFocusContent").innerHTML =
        "<strong>No focus issue selected</strong><small>Choose one active issue to make today’s priority.</small>";
      if (state.settings.dailyFocusTaskId) {
        state.settings.dailyFocusTaskId = "";
        save();
      }
    }
    renderWeeklyGoal();
    renderFocus();
  }

  function quickPlan(value = today()) {
    const edit = typeof value === "object",
      plan = edit ? value : null,
      date = edit ? plan.date : value;
    const duration = plan?.duration
      ? `${Math.floor(plan.duration / 60)}:${String(plan.duration % 60).padStart(2, "0")}`
      : "";
    modal(
      `<h2>${edit ? "Edit plan" : "Quick plan"}</h2><p class="sub">Schedule an activity and log the time you actually spend.</p><form class="form" id="planForm"><label>Plan<input name="title" required autofocus value="${esc(plan?.title || "")}"></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required></label><label>Start time <span class="hint">optional</span><input type="time" name="time" value="${esc(plan?.time || "")}"></label></div><div class="two"><label>Planned duration <span class="hint">optional, H:MM</span><input name="duration" value="${duration}" placeholder="1:00"></label><label>Note <span class="hint">optional</span><input name="note" value="${esc(plan?.note || "")}"></label></div><div class="form-actions">${edit ? `<button type="button" class="danger" data-delete-plan="${plan.id}">Delete</button><button type="button" class="secondary" data-plan-log="${plan.id}">Log time</button>` : ""}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit ? "Save changes" : "Add plan"}</button></div></form>`,
    );
    $("#planForm").onsubmit = (e) => {
      e.preventDefault();
      const x = new FormData(e.currentTarget),
        raw = x.get("duration").trim(),
        duration = parseDurationHM(raw),
        title = x.get("title").trim();
      if (!title) {
        toast("Enter a plan title");
        return;
      }
      if (raw && duration <= 0) {
        toast("Use a duration like 1:00");
        return;
      }
      const obj = {
        title,
        date: x.get("date"),
        time: x.get("time"),
        duration,
        note: x.get("note").trim(),
      };
      if (edit) Object.assign(plan, obj);
      else state.plans.push({ id: uid(), ...obj, done: false });
      save();
      closeOverlay();
      renderAll();
      toast(edit ? "Plan updated" : "Plan added");
    };
  }
  function planLogForm(planId) {
    const plan = indexData().plans.get(planId);
    if (!plan) return;
    modal(
      `<h2>Log plan time</h2><p class="sub">${esc(plan.title)} · ${jalali(plan.date)}</p><form class="form" id="planLogForm"><label>Date<input type="date" name="date" value="${plan.date}" required></label><label>Actual duration <span class="hint">H:MM, e.g. 0:45</span><input name="duration" required placeholder="0:45"></label><label>Note <span class="hint">optional</span><textarea name="note"></textarea></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Log time</button></div></form>`,
    );
    $("#planLogForm").onsubmit = (e) => {
      e.preventDefault();
      const x = new FormData(e.currentTarget),
        minutes = parseDurationHM(x.get("duration"));
      if (minutes <= 0) {
        toast("Enter a valid duration");
        return;
      }
      state.logs.push({
        id: uid(),
        planId: plan.id,
        title: plan.title,
        date: x.get("date"),
        minutes,
        note: x.get("note").trim(),
        source: "plan",
      });
      save();
      closeOverlay();
      renderAll();
      toast("Plan time logged");
    };
  }
  function logEntity(l) {
    const idx = indexData();
    if (l.planId)
      return {
        key: "plan:" + l.planId,
        title: idx.plans.get(l.planId)?.title || l.title || "Plan",
        kind: "Plan",
      };
    if (l.routineId)
      return {
        key: "routine:" + l.routineId,
        title: idx.routines.get(l.routineId)?.title || l.note || "Routine",
        kind: "Routine",
      };
    return {
      key: "task:" + l.taskId,
      title: idx.tasks.get(l.taskId)?.title || l.title || "Work",
      kind: "Task",
      taskId: l.taskId,
    };
  }
  function renderLogs() {
    const mode = state.settings.logMode || "week";
    let start, end, months;
    if (mode === "year")
      ({ start, end, months } = persianYearBounds(logCursor));
    else if (mode === "month") {
      start = findPersianMonthStart(logCursor);
      end = findPersianMonthEnd(logCursor);
    } else {
      start = weekStart(logCursor);
      end = addDays(start, 6);
    }
    const logs = state.logs.filter((l) => l.date >= start && l.date <= end),
      byDate = new Map(),
      rows = new Map();
    for (const l of logs) {
      byDate.set(l.date, (byDate.get(l.date) || 0) + Number(l.minutes || 0));
      const entity = logEntity(l);
      if (!rows.has(entity.key))
        rows.set(entity.key, { ...entity, days: new Map(), total: 0 });
      const row = rows.get(entity.key);
      row.total += Number(l.minutes || 0);
      row.days.set(
        l.date,
        (row.days.get(l.date) || 0) + Number(l.minutes || 0),
      );
    }
    const total = logs.reduce((sum, l) => sum + Number(l.minutes || 0), 0);
    $("#totalLogged").textContent = fmtMin(total);
    $("#entryCount").textContent = faNum(logs.length);
    $("#issueCount").textContent = faNum(rows.size);
    $("#dailyAvg").textContent = byDate.size
      ? fmtMin(Math.round(total / byDate.size))
      : "0m";
    $$("[data-logmode]").forEach((b) =>
      b.classList.toggle("selected", b.dataset.logmode === mode),
    );
    if (mode === "year") {
      $("#logLabel").textContent = faNum(pParts(start).year);
      $("#timesheet").innerHTML = `<div class="log-year-grid">${months
        .map((ms) => {
          const me = findPersianMonthEnd(ms),
            ml = logs.filter((l) => l.date >= ms && l.date <= me);
          return `<article class="log-year-month" data-log-open-month="${ms}"><span>${dateFormats.month.format(fromISO(ms))}</span><strong>${fmtMin(ml.reduce((a, l) => a + Number(l.minutes || 0), 0))}</strong><small>${faNum(new Set(ml.map((l) => l.date)).size)} active days · ${faNum(ml.length)} logs</small></article>`;
        })
        .join("")}</div>`;
    } else if (mode === "month") {
      $("#logLabel").textContent = pMonthName(start);
      const gridStart = weekStart(start);
      $("#timesheet").innerHTML =
        `<div class="log-month-calendar">${weekFa.map((w) => `<div class="log-month-head">${w}</div>`).join("")}${Array.from(
          { length: 42 },
          (_, i) => {
            const d = addDays(gridStart, i),
              inside = d >= start && d <= end,
              minutes = byDate.get(d) || 0;
            return `<div class="log-day ${d === today() ? "today" : ""}" style="${inside ? "" : "opacity:.3"}"><b>${faNum(pParts(d).day)}</b><div class="daytotal">${minutes ? fmtMin(minutes) : "—"}</div></div>`;
          },
        ).join("")}</div>`;
    } else {
      const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      $("#logLabel").textContent = `${jalali(start)} — ${jalali(end)}`;
      if (!rows.size)
        for (const t of state.tasks
          .filter((t) => ["todo", "doing"].includes(t.status))
          .slice(0, 6))
          rows.set("task:" + t.id, {
            key: "task:" + t.id,
            title: t.title,
            kind: "Task",
            taskId: t.id,
            days: new Map(),
            total: 0,
          });
      const cells = (values) =>
        values
          .map(
            (value) =>
              `<div class="ts-cell">${value ? fmtMin(value) : "—"}</div>`,
          )
          .join("");
      $("#timesheet").innerHTML =
        `<div class="timesheet"><div class="ts-row header" style="--cols:7"><div class="ts-cell issue"><b>Activity</b></div>${dates.map((d) => `<div class="ts-cell ${d === today() ? "todaycol" : ""}"><div class="ts-day"><b>${weekdayFa(d)}</b><small>${jalali(d)}</small></div></div>`).join("")}<div class="ts-cell total">Total</div></div>${[...rows.values()].map((row) => `<div class="ts-row" style="--cols:7"><div class="ts-cell issue" ${row.taskId ? `data-open-task="${row.taskId}"` : ""}><span><b>${esc(row.title)}</b><br><span class="key">${row.kind}</span></span></div>${dates.map((d) => `<div class="ts-cell ${row.taskId ? "daycell" : ""} ${d === today() ? "todaycol" : ""}" ${row.taskId ? `data-logcell="${row.taskId}" data-logdate="${d}"` : ""}>${row.days.has(d) ? fmtMin(row.days.get(d)) : row.taskId ? "＋" : "—"}</div>`).join("")}<div class="ts-cell total">${fmtMin(row.total)}</div></div>`).join("")}<div class="ts-row daily-total" style="--cols:7"><div class="ts-cell issue">Daily total</div>${cells(dates.map((d) => byDate.get(d)))}<div class="ts-cell total">${fmtMin(total)}</div></div></div>`;
    }
    renderLogActivity(logs);
  }
  function renderLogActivity(logs) {
    $("#logActivity").innerHTML = logs.length
      ? [...logs]
          .sort((a, b) =>
            (b.date + (b.start || "")).localeCompare(a.date + (a.start || "")),
          )
          .slice(0, 30)
          .map((l) => {
            const entity = logEntity(l);
            return `<div class="activity-row"><div><span class="${l.routineId ? "routine-log-dot" : "task-log-dot"}"></span></div><div class="grow"><b>${esc(entity.title)}</b><p>${entity.kind} · ${weekdayFa(l.date)} · ${jalali(l.date)}${l.note ? " · " + esc(l.note) : ""}</p></div><span class="log-duration">${fmtMin(l.minutes)}</span><button class="textbtn" data-edit-log="${l.id}">Edit</button><button data-delete-log="${l.id}" aria-label="Delete log">×</button></div>`;
          })
          .join("")
      : empty("No work logged in this period");
  }

  document.addEventListener(
    "click",
    (e) => {
      let el = e.target.closest("[data-plan-log]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        planLogForm(el.dataset.planLog);
        return;
      }
      el = e.target.closest("[data-edit-plan]");
      if (el && !e.target.closest("[data-plancheck]")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const plan = indexData().plans.get(el.dataset.editPlan);
        if (plan) quickPlan(plan);
        return;
      }
      el = e.target.closest("[data-delete-plan]");
      if (el) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (confirm("Delete this plan and its time logs?")) {
          state.plans = state.plans.filter(
            (p) => p.id !== el.dataset.deletePlan,
          );
          state.logs = state.logs.filter(
            (l) => l.planId !== el.dataset.deletePlan,
          );
          save();
          closeOverlay();
          renderAll();
          toast("Plan deleted");
        }
        return;
      }
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("[data-edit-plan]")
    ) {
      e.preventDefault();
      e.target.click();
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE || !e.newValue) return;
    try {
      const incoming = normalizeState(JSON.parse(e.newValue));
      if (!incoming) return;
      stopFocusTick();
      state = incoming;
      dataIndex = null;
      currentDayKey = state.settings.dayKey || "";
      applyTheme();
      handleDayRollover();
      renderAll();
      if (focusData().running) startFocusTick();
    } catch (error) {
      console.error("Could not sync planner data", error);
    }
  });

  applyTheme();
  handleDayRollover(true);
  renderClockStatus();
  openView("today");
  const initialFocus = focusData();
  if (initialFocus.running) {
    if (focusRemaining() <= 0) focusComplete();
    else startFocusTick();
  }
})();

// PWA shell registration. App data remains in localStorage for this browser/origin.
if (
  "serviceWorker" in navigator &&
  (location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1")
) {
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("./sw.js?v=24", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {}),
  );
}
