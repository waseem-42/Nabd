// src/motion/engine.ts
var ace = "https://www.acefitness.org/resources/everyone/exercise-library/";
var definition = (id, exerciseId, ar, en, yaw, action, returning, sources) => ({ id, exerciseId, title: { ar, en }, yaw, view: yaw > 65 ? { ar: "\u0623\u0645\u0627\u0645\u064A", en: "Front" } : yaw > 30 ? { ar: "\u0623\u0645\u0627\u0645\u064A \u0645\u0627\u0626\u0644", en: "Three-quarter" } : { ar: "\u062C\u0627\u0646\u0628\u064A", en: "Side" }, action: { ar: action[0], en: action[1] }, returning: { ar: returning[0], en: returning[1] }, sources: sources.map((path) => ace + path) });
var RIGS = [
  definition("squat", "6YUfHPL", "\u0633\u0643\u0648\u0627\u062A \u0628\u0648\u0632\u0646 \u0627\u0644\u062C\u0633\u0645", "Bodyweight squat", 15, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u0635\u0639\u0648\u062F", "Rise"], ["135/bodyweight-squat/"]),
  definition("pushup", "I4hDWkc", "\u0627\u0644\u0636\u063A\u0637", "Push-up", 15, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u062F\u0641\u0639", "Press"], ["41/push-up/"]),
  definition("split", "9E25EOx", "\u0633\u0628\u0644\u064A\u062A \u0633\u0643\u0648\u0627\u062A", "Split squat", 18, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u0635\u0639\u0648\u062F", "Rise"], ["94/forward-lunge/"]),
  definition("bridge", "glute-bridge", "\u062C\u0633\u0631 \u0627\u0644\u0623\u0631\u062F\u0627\u0641", "Glute bridge", 15, ["\u0631\u0641\u0639 \u0627\u0644\u062D\u0648\u0636", "Lift hips"], ["\u0646\u0632\u0648\u0644", "Lower"], ["49/glute-bridge/"]),
  definition("calf", "bJYHBIN", "\u0631\u0641\u0639 \u0627\u0644\u0633\u0645\u0627\u0646\u0629", "Standing calf raise", 18, ["\u0631\u0641\u0639 \u0627\u0644\u0643\u0639\u0628", "Raise heels"], ["\u0646\u0632\u0648\u0644", "Lower"], ["73/standing-calf-raises-wall/"]),
  definition("curl", "NbVPDMW", "\u0643\u064A\u0631\u0644 \u062F\u0645\u0628\u0644", "Dumbbell biceps curl", 32, ["\u062B\u0646\u064A \u0627\u0644\u0645\u0631\u0641\u0642", "Curl"], ["\u0641\u0631\u062F \u0627\u0644\u0645\u0631\u0641\u0642", "Extend"], ["44/seated-biceps-curl/"]),
  definition("pulldown", "RVwzP10", "\u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u0639\u0644\u0648\u064A", "Cable pulldown", 75, ["\u0633\u062D\u0628", "Pull"], ["\u0639\u0648\u062F\u0629", "Return"], ["158/seated-lat-pulldown/"]),
  definition("row", "fUBheHs", "\u062A\u062C\u062F\u064A\u0641 \u0627\u0644\u0643\u064A\u0628\u0644", "Cable seated row", 22, ["\u0633\u062D\u0628", "Pull"], ["\u0639\u0648\u062F\u0629", "Return"], ["168/seated-row/"]),
  definition("shoulder", "3d7wHyd", "\u0636\u063A\u0637 \u0643\u062A\u0641 \u0628\u0627\u0644\u062F\u0645\u0628\u0644", "Seated dumbbell press", 85, ["\u062F\u0641\u0639", "Press"], ["\u0646\u0632\u0648\u0644", "Lower"], ["186/seated-shoulder-press/"]),
  definition("bench", "SpYC0Kp", "\u0628\u0646\u0634 \u0628\u0627\u0644\u062F\u0645\u0628\u0644", "Dumbbell bench press", 38, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u062F\u0641\u0639", "Press"], ["19/chest-press/"])
];
var RIG_DURATION = 6;
var findRig = (exerciseId) => RIGS.find((rig) => rig.exerciseId === exerciseId);
var add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var length = (a) => Math.hypot(...a);
var unit = (a) => scale(a, 1 / length(a));
var mix = (a, b, p) => a + (b - a) * p;
var deg = (angle) => angle * Math.PI / 180;
var vertical = (angle) => [Math.sin(angle), Math.cos(angle), 0];
var horizontal = (angle) => [Math.cos(angle), Math.sin(angle), 0];
function solveLimb(start, end, upper, lower, bend) {
  const delta = sub(end, start), distance = length(delta);
  if (distance < 1e-3 || distance > upper + lower + 1e-6 || distance < Math.abs(upper - lower) - 1e-6) throw new Error(`Unreachable limb: ${distance.toFixed(3)} / ${upper}+${lower}`);
  const axis = unit(delta);
  let perpendicular = sub(bend, scale(axis, dot(bend, axis)));
  if (length(perpendicular) < 1e-3) perpendicular = sub([0, 0, 1], scale(axis, axis[2]));
  perpendicular = unit(perpendicular);
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  return add(start, add(scale(axis, along), scale(perpendicular, height)));
}
function movementClock(time) {
  const t = (time % RIG_DURATION + RIG_DURATION) % RIG_DURATION;
  const smooth = (value) => {
    const s = Math.max(0, Math.min(1, value));
    return s * s * s * (s * (s * 6 - 15) + 10);
  };
  const phase = t < 0.45 || t >= 5.55 ? 0 : t < 2.55 ? 1 : t < 3.05 ? 2 : 3;
  const progress = t < 0.45 ? 0 : t < 2.55 ? smooth((t - 0.45) / 2.1) : t < 3.05 ? 1 : t < 5.55 ? 1 - smooth((t - 3.05) / 2.5) : 0;
  return { phase, progress };
}
function sampleRig(id, time) {
  const clock = movementClock(time), p = clock.progress;
  const result = { points: {}, bones: [], equipment: [], ...clock };
  const set = (name, point) => {
    result.points[name] = point;
    return point;
  };
  const get = (name) => {
    const point = result.points[name];
    if (!point) throw new Error(`Missing joint ${name}`);
    return point;
  };
  const bone = (a, b, layer = "core") => result.bones.push({ a, b, layer });
  const equipment = (points, accent = false, width = 2) => result.equipment.push({ points, accent, width });
  function body(hip, axis, headAxis = axis) {
    set("hip", hip);
    set("shoulder", add(hip, scale(axis, 118)));
    set("neck", add(get("shoulder"), scale(headAxis, 25)));
    set("head", add(get("neck"), scale(headAxis, 25)));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      set("hip" + side, add(hip, [0, 0, sign * 26]));
      set("shoulder" + side, add(get("shoulder"), [0, 0, sign * 42.5]));
    }
    bone("hip", "shoulder");
    bone("shoulder", "neck");
    bone("neck", "head");
    bone("hipL", "hipR");
    bone("shoulderL", "shoulderR");
  }
  function leg(side, ankle, bend = [1, 0, 0], toe, heel) {
    set("ankle" + side, ankle);
    set("knee" + side, solveLimb(get("hip" + side), ankle, 100, 100, bend));
    set("heel" + side, heel ?? add(ankle, [-25, -20, 0]));
    set("toe" + side, toe ?? add(ankle, [35, -20, 0]));
    const layer = side === "L" ? "far" : "near";
    bone("hip" + side, "knee" + side, layer);
    bone("knee" + side, "ankle" + side, layer);
    bone("ankle" + side, "heel" + side, layer);
    bone("heel" + side, "toe" + side, layer);
    bone("toe" + side, "ankle" + side, layer);
  }
  function arm(side, wrist, bend, elbow) {
    set("wrist" + side, wrist);
    set("elbow" + side, elbow ?? solveLimb(get("shoulder" + side), wrist, 70, 65, bend));
    const layer = side === "L" ? "far" : "near";
    bone("shoulder" + side, "elbow" + side, layer);
    bone("elbow" + side, "wrist" + side, layer);
  }
  function dumbbell(wrist) {
    equipment([add(wrist, [0, 0, -20]), add(wrist, [0, 0, 20])], true, 3);
    for (const z of [-15, 15]) equipment([add(wrist, [-8, -10, z]), add(wrist, [8, -10, z]), add(wrist, [8, 10, z]), add(wrist, [-8, 10, z]), add(wrist, [-8, -10, z])], true, 2);
  }
  function bench(back = false) {
    for (const z of [-43, 43]) {
      equipment([[-42, 115, z], [50, 115, z]], false, 5);
      equipment([[-30, 115, z], [-30, 0, z]]);
      equipment([[40, 115, z], [40, 0, z]]);
    }
    if (back) for (const z of [-43, 43]) equipment([[-32, 115, z], [-32, 290, z]], false, 4);
  }
  if (id === "squat") {
    body([mix(-6, -80, p), mix(219, 130, p), 0], vertical(mix(0.05, 0.5, p)));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      arm(side, add(get("shoulder" + side), [mix(17, 123, p), mix(-130, -5, p), 0]), [0, -1, 0]);
    }
  } else if (id === "pushup") {
    const axis = horizontal(deg(mix(20.9, 4, p))), ankle = [-160, 20, 0];
    body(add(ankle, scale(axis, 200)), axis);
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [-160, 20, sign * 26], [0, 1, 0], [-125, 0, sign * 26], [-185, 40, sign * 26]);
      arm(side, [140, 0, sign * 42.5], [-1, 0, 0]);
      equipment([[127, 0, sign * 42.5], [156, 0, sign * 42.5]], false, 4);
    }
  } else if (id === "split") {
    body([-10, mix(180, 115, p), 0], vertical(0.06));
    leg("R", [95, 20, 26], [1, 0, 0]);
    leg("L", [-125, 35, -26], [1, -1, 0], [-90, 0, -26], [-146, 17, -26]);
    for (const side of ["L", "R"]) arm(side, add(get("shoulder" + side), [15, -130, 0]), [-1, 0, 0]);
  } else if (id === "bridge") {
    const shoulder = [-130, 22, 0], ankle = [125, 20, 0];
    const kneeAtTop = solveLimb(shoulder, ankle, 218, 100, [0, 1, 0]);
    const topAngle = Math.atan2(kneeAtTop[1] - shoulder[1], kneeAtTop[0] - shoulder[0]);
    const axis = horizontal(mix(0.03, topAngle, p)), hip = add(shoulder, scale(axis, 118));
    body(hip, scale(axis, -1), [-1, 0, 0]);
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [125, 20, sign * 26], [0, 1, 0]);
      arm(side, add(get("shoulder" + side), [130, -8, 0]), [0, 0, sign]);
    }
  } else if (id === "calf") {
    const angle = 0.4 * p;
    const ankle = [35 - 35 * Math.cos(angle) + 20 * Math.sin(angle), 35 * Math.sin(angle) + 20 * Math.cos(angle), 0];
    body(add(ankle, [0, 199.6, 0]), vertical(0));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, add(ankle, [0, 0, sign * 26]), [1, 0, 0], [35, 0, sign * 26], [35 - 60 * Math.cos(angle), 60 * Math.sin(angle), sign * 26]);
      arm(side, [110, 280, sign * 42.5], [0, -1, 0]);
    }
    equipment([[110, 0, -65], [110, 370, -65]]);
    equipment([[110, 370, -65], [110, 370, 65], [110, 0, 65]]);
  } else if (id === "curl") {
    body([0, 219.6, 0], vertical(0));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      const elbow = add(get("shoulder" + side), [0, -70, 0]);
      const angle = deg(mix(15, 140, p));
      const wrist = add(elbow, [65 * Math.sin(angle), -65 * Math.cos(angle), 0]);
      arm(side, wrist, [1, 0, 0], elbow);
      dumbbell(wrist);
    }
  } else if (id === "pulldown" || id === "shoulder") {
    body([0, 125, 0], vertical(id === "pulldown" ? -0.08 : 0));
    bench(id === "shoulder");
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [99, 20, sign * 26], [1, 1, 0]);
      const wrist = id === "pulldown" ? [30, mix(365, 251, p), sign * 75] : [15, mix(248, 370, p), sign * mix(105, 55, p)];
      arm(side, wrist, [0, -1, sign * 0.5]);
      if (id === "shoulder") dumbbell(wrist);
    }
    if (id === "pulldown") {
      const barY = mix(365, 251, p);
      equipment([[30, barY, -95], [30, barY, 95]], true, 4);
      equipment([[30, barY, 0], [30, 410, 0]], true, 1.5);
      equipment([[-75, 0, -95], [-75, 410, -95], [30, 410, -95], [30, 410, 0]]);
      equipment([[-75, 0, 95], [-75, 410, 95], [30, 410, 95]]);
      equipment([[70, 145, -50], [70, 145, 50]], false, 6);
    }
  } else if (id === "row") {
    body([0, 125, 0], vertical(0));
    bench();
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [165, 20, sign * 26], [0, 1, 0]);
      arm(side, [mix(125, 30, p), mix(230, 215, p), sign * 42.5], [-1, 0, 0]);
    }
    const handle = [mix(125, 30, p), mix(230, 215, p), 0];
    equipment([[230, 60, 0], handle], true, 1.5);
    equipment([add(handle, [0, 0, -50]), add(handle, [0, 0, 50])], true, 3);
    equipment([[178, 0, -60], [178, 70, -60], [178, 70, 60], [178, 0, 60]]);
  } else if (id === "bench") {
    body([0, 110, 0], [-1, 0, 0]);
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [120, 20, sign * 26], [1, 1, 0]);
      const wrist = [-118, mix(240, 180, p), sign * mix(44.5, 100, p)];
      arm(side, wrist, [0, -1, sign]);
      dumbbell(wrist);
    }
    for (const z of [-48, 48]) {
      equipment([[-205, 88, z], [25, 88, z]], false, 6);
      equipment([[-170, 88, z], [-170, 0, z]]);
      equipment([[5, 88, z], [5, 0, z]]);
    }
  }
  return result;
}
function projectPoint(point, yaw) {
  const angle = deg(yaw);
  return [point[0] * Math.cos(angle) + point[2] * Math.sin(angle), -point[1]];
}
var fits = /* @__PURE__ */ new Map();
function rigFit(definition2) {
  const cached = fits.get(definition2.id);
  if (cached) return cached;
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const pose = sampleRig(definition2.id, i / 10);
    for (const point of [...Object.values(pose.points), ...pose.equipment.flatMap((item) => item.points)]) points.push(projectPoint(point, definition2.yaw));
  }
  const minX = Math.min(...points.map((p) => p[0])) - 20, maxX = Math.max(...points.map((p) => p[0])) + 20;
  const minY = Math.min(...points.map((p) => p[1])) - 25, maxY = Math.max(...points.map((p) => p[1])) + 20;
  const scale2 = Math.min(760 / (maxX - minX), 620 / (maxY - minY));
  const fit = { scale: scale2, x: 450 - (minX + maxX) * scale2 / 2, y: 445 - (minY + maxY) * scale2 / 2 };
  fits.set(definition2.id, fit);
  return fit;
}

// src/motion/svgRenderer.ts
var NS = "http://www.w3.org/2000/svg";
var serial = 0;
function createRigRenderer(svg2, definition2, showTitle = false) {
  const document2 = svg2.ownerDocument;
  const element = (tag, attributes) => {
    const node = document2.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    return node;
  };
  const group = () => element("g", {});
  const panel = "var(--panel,var(--color-surface,#171b16))";
  const text = "var(--text,var(--color-text,#f5f2e9))";
  const accent = "var(--accent,var(--color-accent,#ff785c))";
  const id = `rig-grid-${++serial}`;
  svg2.replaceChildren();
  svg2.setAttribute("viewBox", "0 0 900 900");
  svg2.setAttribute("font-family", "var(--font,var(--font-sans,'IBM Plex Sans Arabic',sans-serif))");
  svg2.dataset.rig = definition2.id;
  svg2.dataset.exercise = definition2.exerciseId;
  const defs = element("defs", {}), pattern = element("pattern", { id, width: 45, height: 45, patternUnits: "userSpaceOnUse" });
  pattern.append(element("path", { d: "M45 0H0V45", fill: "none", stroke: text, "stroke-width": 1, opacity: 0.04 }));
  defs.append(pattern);
  svg2.append(defs, element("rect", { width: 900, height: 900, fill: panel }), element("rect", { width: 900, height: 900, fill: `url(#${id})` }));
  const equipment = group(), body = group(), hud = group();
  svg2.append(equipment, body, hud);
  const fit = rigFit(definition2);
  const project = (point) => {
    const p = projectPoint(point, definition2.yaw);
    return [p[0] * fit.scale + fit.x, p[1] * fit.scale + fit.y];
  };
  const line = (parent, a, b, color, width, opacity = 1) => parent.append(element("path", { d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", opacity }));
  const circle = (parent, p, r, fill, stroke, width, opacity = 1) => parent.append(element("circle", { cx: p[0], cy: p[1], r, fill, stroke, "stroke-width": width, opacity }));
  const label = (x, y, value, size, color, anchor = "middle") => {
    const node = element("text", { x, y, "font-size": size, fill: color, "text-anchor": anchor, direction: "ltr" });
    node.textContent = value;
    hud.append(node);
  };
  function render(time, lang = "ar") {
    const pose = sampleRig(definition2.id, time);
    equipment.replaceChildren();
    body.replaceChildren();
    hud.replaceChildren();
    svg2.dataset.time = time.toFixed(3);
    svg2.dataset.phase = String(pose.phase);
    line(equipment, [80, fit.y], [820, fit.y], text, 1, 0.12);
    for (const item of pose.equipment) {
      const points = item.points.map(project);
      const d = points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
      equipment.append(element("path", { d, fill: "none", stroke: item.accent ? accent : text, "stroke-width": item.width ?? 2, opacity: item.accent ? 0.9 : 0.3, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }
    const point = (name) => {
      const value = pose.points[name];
      if (!value) throw new Error(`Missing point ${name}`);
      return project(value);
    };
    const shoulders = [point("shoulderL"), point("shoulderR")], hips = [point("hipL"), point("hipR")];
    body.append(element("path", { d: `M${shoulders[0].join(" ")}L${shoulders[1].join(" ")}L${hips[1].join(" ")}L${hips[0].join(" ")}Z`, fill: text, opacity: 0.055 }));
    for (const layer of ["far", "core", "near"]) for (const bone of pose.bones.filter((b) => b.layer === layer)) {
      const a = point(bone.a), b = point(bone.b), far = layer === "far";
      if (!bone.a.startsWith("heel") && !bone.a.startsWith("toe")) line(body, a, b, text, far ? 29 : 40, far ? 0.025 : 0.045);
      line(body, a, b, text, far ? 4 : 6.5, far ? 0.35 : 0.95);
    }
    const head = point("head");
    circle(body, head, 16 * fit.scale, panel, text, 5);
    if (definition2.yaw < 60 && !["bridge", "bench"].includes(definition2.id)) line(body, [head[0] + 16 * fit.scale, head[1]], [head[0] + 20 * fit.scale, head[1] + 3], text, 3);
    for (const name of ["hipR", "kneeR", "ankleR", "shoulderR", "elbowR", "wristR"]) {
      circle(body, point(name), 8, panel, accent, 3);
      circle(body, point(name), 2, text, "none", 0);
    }
    for (const name of ["hipL", "kneeL", "ankleL", "shoulderL", "elbowL", "wristL"]) circle(body, point(name), 4, panel, text, 2, 0.4);
    if (showTitle) label(450, 66, definition2.title[lang], 30, text);
    label(65, 105, "NABD / TECHNICAL", 15, text, "start");
    label(835, 105, definition2.view[lang], 22, text, "end");
    const phase = pose.phase === 0 ? lang === "ar" ? "\u0627\u0633\u062A\u0639\u062F\u0627\u062F" : "Ready" : pose.phase === 1 ? definition2.action[lang] : pose.phase === 2 ? lang === "ar" ? "\u0648\u0642\u0641\u0629 \u0642\u0635\u064A\u0631\u0629" : "Brief hold" : definition2.returning[lang];
    circle(hud, [450, 810], 4, accent, "none", 0);
    label(450, 860, phase, 32, text);
  }
  return { render };
}

// src/motion/standalone.ts
var svg = document.querySelector("#rig-stage");
var query = new URLSearchParams(location.search);
var current;
var renderer;
window.renderFrame = (time, graphic) => {
  const exercise = graphic?.data?.exercise ?? query.get("exercise") ?? RIGS[0].exerciseId;
  const definition2 = findRig(exercise);
  if (!definition2) throw new Error(`No continuous rig for exercise ${exercise}`);
  if (current?.id !== definition2.id) {
    current = definition2;
    renderer = createRigRenderer(svg, definition2, true);
  }
  renderer.render(time, graphic?.data?.lang ?? (query.get("lang") === "en" ? "en" : "ar"));
};
window.renderFrame(0, window.GRAPHIC);
