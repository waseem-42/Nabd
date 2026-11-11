// src/motion/engine.ts
var viewOf = (yaw) => yaw > 65 ? { ar: "\u0623\u0645\u0627\u0645\u064A", en: "Front" } : yaw > 30 ? { ar: "\u0623\u0645\u0627\u0645\u064A \u0645\u0627\u0626\u0644", en: "Three-quarter" } : { ar: "\u062C\u0627\u0646\u0628\u064A", en: "Side" };
var ace = "https://www.acefitness.org/resources/everyone/exercise-library/";
var definition = (id, exerciseId, ar, en, yaw, action, returning, sources) => ({ id, exerciseId, title: { ar, en }, yaw, view: viewOf(yaw), action: { ar: action[0], en: action[1] }, returning: { ar: returning[0], en: returning[1] }, sources: sources.map((path) => ace + path) });
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
  definition("bench", "SpYC0Kp", "\u0628\u0646\u0634 \u0628\u0627\u0644\u062F\u0645\u0628\u0644", "Dumbbell bench press", 38, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u062F\u0641\u0639", "Press"], ["19/chest-press/"]),
  // Batch two.
  definition("backsquat", "qXTaZnJ", "\u0633\u0643\u0648\u0627\u062A \u0628\u0627\u0644\u0628\u0627\u0631", "Barbell back squat", 15, ["\u0646\u0632\u0648\u0644", "Lower"], ["\u0635\u0639\u0648\u062F", "Rise"], ["11/back-squat/"]),
  definition("rdl", "wQ2c4XD", "\u062F\u064A\u062F\u0644\u0641\u062A \u0631\u0648\u0645\u0627\u0646\u064A", "Romanian deadlift", 15, ["\u0627\u0646\u062D\u0646\u0627\u0621 \u0645\u0646 \u0627\u0644\u0648\u0631\u0643", "Hinge"], ["\u0648\u0642\u0648\u0641", "Stand"], ["317/romanian-deadlift/"]),
  definition("lateral", "DsgkuIt", "\u0631\u0641\u0639 \u062C\u0627\u0646\u0628\u064A", "Dumbbell lateral raise", 85, ["\u0631\u0641\u0639", "Raise"], ["\u0646\u0632\u0648\u0644", "Lower"], ["26/lateral-raise/"]),
  definition("chinup", "T2mxWqc", "\u0639\u0642\u0644\u0629 \u0628\u0642\u0628\u0636\u0629 \u0645\u0639\u0643\u0648\u0633\u0629", "Chin-up", 70, ["\u0633\u062D\u0628", "Pull"], ["\u0646\u0632\u0648\u0644", "Lower"], ["190/chin-ups/"]),
  definition("pushdown", "3ZflifB", "\u0628\u0648\u0634 \u062F\u0627\u0648\u0646 \u0628\u0627\u0644\u0643\u064A\u0628\u0644", "Cable pushdown", 20, ["\u062F\u0641\u0639 \u0644\u0644\u0623\u0633\u0641\u0644", "Press down"], ["\u0639\u0648\u062F\u0629", "Return"], ["333/tricep-pressdown/"])
];
var RIG_DURATION = 6;
var RIG_PHASES = { actionStart: 0.45, holdStart: 2.55, returnStart: 3.05, returnEnd: 5.55 };
var legs = [["hipR", "kneeR"], ["hipL", "kneeL"]];
var upperArms = [["shoulderR", "elbowR"], ["shoulderL", "elbowL"]];
var RIG_GUIDES = {
  squat: { track: "hip", work: legs, exhaleOnAction: false, altYaw: 60 },
  pushup: { track: "shoulder", work: [...upperArms, ["shoulderL", "shoulderR"]], exhaleOnAction: false, altYaw: 55 },
  split: { track: "hip", work: legs, exhaleOnAction: false, altYaw: 60 },
  bridge: { track: "hip", work: [...legs, ["hipL", "hipR"]], exhaleOnAction: true, altYaw: 55 },
  calf: { track: "heelR", work: [["kneeR", "ankleR"], ["kneeL", "ankleL"]], exhaleOnAction: true, altYaw: 60 },
  curl: { track: "wristR", work: upperArms, exhaleOnAction: true, altYaw: 80 },
  pulldown: { track: "wristR", work: [...upperArms, ["hip", "shoulder"]], exhaleOnAction: true, altYaw: 15 },
  row: { track: "wristR", work: [...upperArms, ["hip", "shoulder"]], exhaleOnAction: true, altYaw: 60 },
  shoulder: { track: "wristR", work: [...upperArms, ["shoulderL", "shoulderR"]], exhaleOnAction: true, altYaw: 20 },
  bench: { track: "wristR", work: [...upperArms, ["shoulderL", "shoulderR"]], exhaleOnAction: false, altYaw: 80 },
  backsquat: { track: "hip", work: legs, exhaleOnAction: false, altYaw: 60 },
  rdl: { track: "wristR", work: [...legs, ["hip", "shoulder"]], exhaleOnAction: false, altYaw: 60 },
  lateral: { track: "wristR", work: [["shoulderR", "elbowR"], ["shoulderL", "elbowL"], ["shoulderL", "shoulderR"]], exhaleOnAction: true, altYaw: 30 },
  chinup: { track: "head", work: [...upperArms, ["hip", "shoulder"]], exhaleOnAction: true, altYaw: 15 },
  pushdown: { track: "wristR", work: upperArms, exhaleOnAction: true, altYaw: 70 }
};
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
  function dumbbellAlongX(wrist) {
    equipment([add(wrist, [-20, 0, 0]), add(wrist, [20, 0, 0])], true, 3);
    for (const x of [-15, 15]) equipment([add(wrist, [x, -10, -8]), add(wrist, [x, 10, -8]), add(wrist, [x, 10, 8]), add(wrist, [x, -10, 8]), add(wrist, [x, -10, -8])], true, 2);
  }
  function barbell(center) {
    equipment([add(center, [0, 0, -125]), add(center, [0, 0, 125])], true, 4);
    for (const z of [-100, 100]) equipment([add(center, [0, -26, z]), add(center, [0, 26, z])], true, 9);
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
  } else if (id === "backsquat") {
    const lean = mix(0.05, 0.5, p), axis = vertical(lean), back = [-Math.cos(lean), Math.sin(lean), 0];
    body([mix(-6, -80, p), mix(219, 130, p), 0], axis);
    const bar = add(add(get("shoulder"), scale(axis, 4)), scale(back, 13));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      arm(side, add(bar, [0, 0, sign * 62]), [0, -1, 0]);
    }
    barbell(bar);
  } else if (id === "rdl") {
    const axis = vertical(mix(0.02, 1.15, p));
    body([mix(0, -70, p), mix(215, 195, p), 0], axis);
    const shoulder = get("shoulder"), bar = [shoulder[0] * 0.5, shoulder[1] - 130, 0];
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      arm(side, add(bar, [0, 0, sign * 48]), [-1, 0, 0]);
    }
    barbell(bar);
  } else if (id === "lateral") {
    body([0, 219.6, 0], vertical(0));
    const angle = deg(mix(8, 82, p));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      const wrist = add(get("shoulder" + side), [4, -130 * Math.cos(angle), sign * 130 * Math.sin(angle)]);
      arm(side, wrist, [-1, 0, 0]);
      dumbbellAlongX(wrist);
    }
  } else if (id === "chinup") {
    const barY = 470;
    body([mix(0, 6, p), mix(220, 312, p), 0], vertical(mix(0, -0.12, p)));
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, add(get("hip" + side), [-18, -195, 0]), [1, 0, 0]);
      arm(side, [12, barY, sign * 40], [1, 0, sign * 0.4]);
    }
    equipment([[12, barY, -115], [12, barY, 115]], true, 5);
    for (const z of [-115, 115]) equipment([[12, barY, z], [12, 0, z]]);
  } else if (id === "pushdown") {
    const axis = vertical(0.12);
    body([-4, 215, 0], axis);
    const angle = deg(mix(100, 8, p));
    let handle = [0, 0, 0];
    for (const side of ["L", "R"]) {
      const sign = side === "L" ? -1 : 1;
      leg(side, [0, 20, sign * 26]);
      const dz = -sign * 7.5, dx = 8, elbow = add(get("shoulder" + side), [dx, -Math.sqrt(70 * 70 - dx * dx - dz * dz), dz]);
      const wrist = add(elbow, [65 * Math.sin(angle), -65 * Math.cos(angle), 0]);
      arm(side, wrist, [-1, 0, 0], elbow);
      handle = [wrist[0], wrist[1], 0];
    }
    const pulley = [95, 430, 0];
    equipment([pulley, handle], true, 1.5);
    equipment([add(handle, [0, 0, -48]), add(handle, [0, 0, 48])], true, 4);
    equipment([[125, 0, -30], [125, 445, -30], [95, 445, -30], [95, 430, 0]]);
    equipment([[125, 0, 30], [125, 445, 30], [95, 445, 30]]);
  }
  return result;
}
function projectPoint(point, yaw) {
  const angle = deg(yaw);
  return [point[0] * Math.cos(angle) + point[2] * Math.sin(angle), -point[1]];
}
var fits = /* @__PURE__ */ new Map();
function rigFit(definition2, yaw = definition2.yaw) {
  const key = `${definition2.id}:${yaw}`;
  const cached = fits.get(key);
  if (cached) return cached;
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const pose = sampleRig(definition2.id, i / 10);
    for (const point of [...Object.values(pose.points), ...pose.equipment.flatMap((item) => item.points)]) points.push(projectPoint(point, yaw));
  }
  const minX = Math.min(...points.map((p) => p[0])) - 20, maxX = Math.max(...points.map((p) => p[0])) + 20;
  const minY = Math.min(...points.map((p) => p[1])) - 25, maxY = Math.max(...points.map((p) => p[1])) + 20;
  const scale2 = Math.min(760 / (maxX - minX), 620 / (maxY - minY));
  const fit = { scale: scale2, x: 450 - (minX + maxX) * scale2 / 2, y: 445 - (minY + maxY) * scale2 / 2 };
  fits.set(key, fit);
  return fit;
}

// src/motion/svgRenderer.ts
var NS = "http://www.w3.org/2000/svg";
var serial = 0;
function createRigRenderer(svg2, definition2, showTitle = false, options = {}) {
  const document2 = svg2.ownerDocument;
  const yaw = options.yaw ?? definition2.yaw;
  const guide = RIG_GUIDES[definition2.id];
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
  svg2.dataset.yaw = String(yaw);
  const defs = element("defs", {}), pattern = element("pattern", { id, width: 45, height: 45, patternUnits: "userSpaceOnUse" });
  pattern.append(element("path", { d: "M45 0H0V45", fill: "none", stroke: text, "stroke-width": 1, opacity: 0.04 }));
  defs.append(pattern);
  svg2.append(defs, element("rect", { width: 900, height: 900, fill: panel }), element("rect", { width: 900, height: 900, fill: `url(#${id})` }));
  const guidesLayer = group(), equipment = group(), body = group(), hud = group();
  svg2.append(guidesLayer, equipment, body, hud);
  guidesLayer.dataset.layer = "guides";
  const fit = rigFit(definition2, yaw);
  const project = (point) => {
    const p = projectPoint(point, yaw);
    return [p[0] * fit.scale + fit.x, p[1] * fit.scale + fit.y];
  };
  const line = (parent, a, b, color, width, opacity = 1, extra = {}) => parent.append(element("path", { d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", opacity, ...extra }));
  const circle = (parent, p, r, fill, stroke, width, opacity = 1) => parent.append(element("circle", { cx: p[0], cy: p[1], r, fill, stroke, "stroke-width": width, opacity }));
  const label = (x, y, value, size, color, anchor = "middle", opacity = 1) => {
    const node = element("text", { x, y, "font-size": size, fill: color, "text-anchor": anchor, direction: "ltr", opacity });
    node.textContent = value;
    hud.append(node);
  };
  if (options.guides) {
    const end = sampleRig(definition2.id, (RIG_PHASES.holdStart + RIG_PHASES.returnStart) / 2);
    const at = (name) => {
      const value = end.points[name];
      return value ? project(value) : null;
    };
    for (const bone of end.bones) {
      const a = at(bone.a), b = at(bone.b);
      if (a && b) line(guidesLayer, a, b, text, 4, 0.13, { "stroke-dasharray": "2 12" });
    }
    const head = at("head");
    if (head) guidesLayer.append(element("circle", { cx: head[0], cy: head[1], r: 16 * fit.scale, fill: "none", stroke: text, "stroke-width": 3, opacity: 0.13, "stroke-dasharray": "2 10" }));
    const path = [];
    for (let t = RIG_PHASES.actionStart; t <= RIG_PHASES.holdStart + 1e-6; t += 0.05) {
      const p = sampleRig(definition2.id, t).points[guide.track];
      if (p) path.push(project(p));
    }
    if (path.length > 1) {
      guidesLayer.append(element("path", { d: path.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(""), fill: "none", stroke: accent, "stroke-width": 3, "stroke-dasharray": "1 11", "stroke-linecap": "round", opacity: 0.75 }));
      circle(guidesLayer, path[0], 7, "none", accent, 2.5, 0.7);
      circle(guidesLayer, path.at(-1), 7, accent, "none", 0, 0.7);
    }
  }
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
    if (options.guides) {
      const effort = pose.phase === 1 || pose.phase === 2 ? 0.3 : 0.16;
      for (const [a, b] of guide.work) line(body, point(a), point(b), accent, 34, effort, { "data-work": "1" });
    }
    for (const layer of ["far", "core", "near"]) for (const bone of pose.bones.filter((b) => b.layer === layer)) {
      const a = point(bone.a), b = point(bone.b), far = layer === "far";
      if (!bone.a.startsWith("heel") && !bone.a.startsWith("toe")) line(body, a, b, text, far ? 29 : 40, far ? 0.025 : 0.045);
      line(body, a, b, text, far ? 4 : 6.5, far ? 0.35 : 0.95);
    }
    const head = point("head");
    circle(body, head, 16 * fit.scale, panel, text, 5);
    if (yaw < 60 && !["bridge", "bench"].includes(definition2.id)) line(body, [head[0] + 16 * fit.scale, head[1]], [head[0] + 20 * fit.scale, head[1] + 3], text, 3);
    for (const name of ["hipR", "kneeR", "ankleR", "shoulderR", "elbowR", "wristR"]) {
      circle(body, point(name), 8, panel, accent, 3);
      circle(body, point(name), 2, text, "none", 0);
    }
    for (const name of ["hipL", "kneeL", "ankleL", "shoulderL", "elbowL", "wristL"]) circle(body, point(name), 4, panel, text, 2, 0.4);
    if (options.guides) {
      const p = pose.points[guide.track];
      if (p) circle(body, project(p), 11, "none", accent, 3, 0.9);
    }
    if (showTitle) label(450, 66, definition2.title[lang], 30, text);
    if (!options.guides) label(65, 105, "NABD / TECHNICAL", 15, text, "start");
    label(options.guides ? 65 : 835, 105, viewOf(yaw)[lang], 22, text, options.guides ? "start" : "end");
    const phase = pose.phase === 0 ? lang === "ar" ? "\u0627\u0633\u062A\u0639\u062F\u0627\u062F" : "Ready" : pose.phase === 1 ? definition2.action[lang] : pose.phase === 2 ? lang === "ar" ? "\u0648\u0642\u0641\u0629 \u0642\u0635\u064A\u0631\u0629" : "Brief hold" : definition2.returning[lang];
    circle(hud, [450, 810], 4, accent, "none", 0);
    label(450, 860, phase, 32, text);
    if (options.guides && (pose.phase === 1 || pose.phase === 3)) {
      const exhale = pose.phase === 1 === guide.exhaleOnAction;
      const breath = exhale ? lang === "ar" ? "\u0632\u0641\u064A\u0631" : "Breathe out" : lang === "ar" ? "\u0634\u0647\u064A\u0642" : "Breathe in";
      label(65, 860, breath, 28, exhale ? accent : text, "start", 0.9);
      svg2.dataset.breath = exhale ? "out" : "in";
    } else delete svg2.dataset.breath;
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
