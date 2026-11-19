"use client";

import { motion, useReducedMotion, type Easing } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { playKnifeSequence } from "@/lib/sounds";

// The celebration after logging a cook:
//   a dark curtain drops → three knife slashes (↙, ↘, →) cut it →
//   it splits open along the middle cut, revealing your new page underneath.
// Sits above everything, never blocks clicks, and removes itself when done.

// ── Timeline (seconds) ──
const HOLD_TIME = 0.18; // the held breath before the big slash
const CURTAIN_IN = 0.45; // the veil eases in gently…
const LEAD = 0.2; // …and everything after it waits this much longer, so the first slash still lands on a dark veil
// One continuous flight. [start, travel] for each slash:
//   1. top-right → bottom-left
//      (swoops back up the left side, flipping, to the top-left)
//   2. top-left → bottom-right
//      (arcs up and over the top of the screen, spinning faster and faster the whole
//       way, comes down at the middle-left; stops dead and cocks back)
//   3. left → right, straight across the middle: the big one
const SLASHES: [number, number][] = [
  [LEAD + 0.25, 0.26],
  [LEAD + 0.92, 0.26],
  [LEAD + 2.6, 0.34],
];
const SPIN = SLASHES[2][0] - HOLD_TIME - (SLASHES[1][0] + SLASHES[1][1]); // the spinning arc over the top, from the end of slash 2
const HOLD = HOLD_TIME; // …then stops dead and cocks back for a split second
const SPIN_AT = SLASHES[2][0] - HOLD - SPIN; // when the spin starts
const IMPACT = SLASHES[2][0] + SLASHES[2][1] * 0.6; // when slash 3 bites through the middle
const OPEN_AT = LEAD + 3.2; // the curtain splits along the middle cut
const OPEN_FOR = 0.6;
const DONE_AFTER = LEAD * 1000 + 4250; // ms: everything has faded

const EASE_IN: Easing = [0.55, 0, 0.9, 0.4]; // a slash starts fast and keeps accelerating
const SPIN_EASE: Easing = [0.6, 0, 0.95, 0.5]; // the spin starts lazy and winds up faster and faster
const SPLIT_EASE: Easing = [0.7, 0, 0.2, 1];
const CURTAIN = "rgb(38 24 15 / .9)"; // warm, dark espresso veil

export function KnifeCelebration({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();

  // The screen's size decides the diagonals' angle, so they run corner to corner
  const [screen] = useState(() =>
    typeof window === "undefined"
      ? { w: 1200, h: 800 }
      : { w: window.innerWidth, h: window.innerHeight },
  );
  const diagonal = (Math.atan2(screen.h, screen.w) * 180) / Math.PI; // e.g. ~34° on a laptop
  const diagonalLength = Math.hypot(screen.w, screen.h) + 200;

  // Play once, when it appears. In development React runs effects twice (Strict Mode)
  // and a sound can't be undone, so a ref remembers it already played. onDone lives in
  // a ref too: the parent passes a new function every render (it re-renders while the
  // entries refetch), and depending on it would restart the timer each time.
  const played = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!played.current) {
      played.current = true;
      if (reduceMotion) playKnifeSequence([[0, 0.25]]);
      else playKnifeSequence(SLASHES, OPEN_AT, [SPIN_AT, SPIN]);
    }
    const timer = setTimeout(
      () => onDoneRef.current(),
      reduceMotion ? 1300 : DONE_AFTER,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  if (reduceMotion) {
    return (
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-0 z-[60]"
      >
        <PageAdded delay={0} />
      </div>
    );
  }

  const knife = knifeFlight(screen, diagonal);
  const total = OPEN_AT + OPEN_FOR;
  // Filled in by <Slipstream>: called with the knife's position on every frame
  const track = useRef<((x: number, y: number) => void) | null>(null);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {/* Everything that should feel the big slash's impact: a quick, small shake */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, -7, 6, -4, 2, 0], y: [0, 3, -3, 2, -1, 0] }}
        transition={{ delay: IMPACT, duration: 0.28, ease: "easeOut" }}
      >
        {/* The curtain, as two halves that split apart along the middle cut */}
        {(["top", "bottom"] as const).map((half) => (
          <motion.div
            key={half}
            className={`absolute inset-x-0 h-1/2 ${half === "top" ? "top-0" : "bottom-0"}`}
            style={{ background: CURTAIN }}
            initial={{ opacity: 0, y: "0%" }}
            animate={{
              opacity: [0, 1, 1, 1],
              y: ["0%", "0%", "0%", half === "top" ? "-100%" : "100%"],
            }}
            transition={{
              duration: total,
              times: [0, CURTAIN_IN / total, OPEN_AT / total, 1],
              ease: ["easeInOut", "linear", SPLIT_EASE],
            }}
          />
        ))}

        {/* The three cuts. Each draws itself behind the blade, starting where the knife enters */}
        <Cut
          angle={-diagonal}
          from="right"
          slash={SLASHES[0]}
          length={diagonalLength}
          fadeAt={OPEN_AT}
        />
        <Cut
          angle={diagonal}
          from="left"
          slash={SLASHES[1]}
          length={diagonalLength}
          fadeAt={OPEN_AT}
        />
        <Cut
          angle={0}
          from="left"
          slash={SLASHES[2]}
          heavy
          length={screen.w + 200}
          fadeAt={OPEN_AT + 0.15}
          seam
        />
      </motion.div>

      {/* Sparks off the middle cut */}
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 h-1.5 w-1.5 rounded-full bg-amber-400"
          style={{
            left: `${s.at}%`,
            boxShadow: "0 0 6px 2px rgb(255 200 120 / .8)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, s.dx],
            y: [0, s.dy],
            scale: [1, 0.4],
          }}
          transition={{
            delay: SLASHES[2][0] + Math.sqrt(s.at / 100) * SLASHES[2][1], // left → right, and the blade accelerates
            duration: 0.55,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Wind: the knife's slipstream, a trail of air along its exact path */}
      <Slipstream track={track} screen={screen} />

      {/* The big slash splits the air: a pressure wave bursting up and down from the cut */}
      {(["up", "down"] as const).map((dir) => (
        <motion.div
          key={dir}
          className="absolute inset-x-0 h-24"
          style={{
            top: "50%",
            marginTop: dir === "up" ? -96 : 0,
            transformOrigin: dir === "up" ? "50% 100%" : "50% 0%",
            background: `linear-gradient(${dir === "up" ? "0deg" : "180deg"}, rgb(255 238 210 / .22), transparent 80%)`,
            filter: "blur(8px)",
          }}
          initial={{ opacity: 0, scaleY: 0.3, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scaleY: [0.3, 1.6],
            y: dir === "up" ? -50 : 50,
          }}
          // Once the blade has gone all the way through, the split air rushes outward
          transition={{
            delay: SLASHES[2][0] + SLASHES[2][1] * 0.95,
            duration: 0.6,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Dust kicked up where the knife lands or strikes (positions in % of the screen) */}
      <Dust x={5} y={93} at={SLASHES[0][0] + SLASHES[0][1]} />
      <Dust x={95} y={93} at={SLASHES[1][0] + SLASHES[1][1]} />
      <Dust x={9} y={50} at={SLASHES[2][0] - HOLD} size={1.3} />
      {[20, 40, 60, 80].map((x) => (
        // along the big cut, as the blade passes each point
        <Dust
          key={x}
          x={x}
          y={50}
          at={SLASHES[2][0] + Math.sqrt(x / 100) * SLASHES[2][1]}
          size={1.5}
        />
      ))}

      {/* The knife, with a motion trail: faint copies following a split-second behind */}
      {TRAIL.map(({ lag, fade }) => (
        <motion.div
          key={lag}
          className={`absolute top-1/2 left-1/2 -mt-6 -ml-[90px] ${lag === 0 ? "drop-shadow-xl" : "blur-[1px]"}`}
          initial={{
            x: knife.x[0],
            y: knife.y[0],
            rotate: knife.rotate[0],
            opacity: 0,
          }}
          animate={{
            x: knife.x,
            y: knife.y,
            rotate: knife.rotate,
            opacity: knife.opacity.map((o) => o * fade),
            scale: knife.scale,
          }}
          transition={{
            delay: lag,
            duration: knife.duration,
            times: knife.times,
            ease: knife.ease,
          }}
          // The real knife reports where it is every frame; the slipstream draws from that
          onUpdate={
            lag === 0
              ? (v) => track.current?.(Number(v.x), Number(v.y))
              : undefined
          }
        >
          <ChefsKnife />
        </motion.div>
      ))}

      <PageAdded delay={OPEN_AT + OPEN_FOR * 0.6} />
    </div>
  );
}

// The knife's whole flight, as one list of keyframes. It never disappears between
// strikes: after each slash it flies back up from where it ended to line up the next.
// Positions are measured from the screen's center (px); the slash points sit on the
// same lines the cuts are drawn on, so the blade always runs along its cut.
function knifeFlight(screen: { w: number; h: number }, diagonal: number) {
  const W = screen.w / 2;
  const H = screen.h / 2;
  const keys: {
    t: number; // seconds
    x: number;
    y: number;
    rotate: number;
    scale?: number;
    opacity?: number;
    ease?: Easing; // easing INTO this keyframe
  }[] = [];
  const at = (k: (typeof keys)[number]) => keys.push(k);

  const [s1, t1] = SLASHES[0];
  const [s2, t2] = SLASHES[1];
  const [s3, t3] = SLASHES[2];
  const swing = 14; // the blade rotates a little through each slash, like an arc

  // ── Slash 1: top-right (just off-screen) → bottom-left corner. Tip leads: down-left.
  const a1 = 180 - diagonal;
  at({ t: 0, x: W * 1.2, y: -H * 1.2, rotate: a1 - swing, opacity: 0 });
  at({ t: s1, x: W * 1.2, y: -H * 1.2, rotate: a1 - swing, opacity: 1 });
  at({
    t: s1 + t1,
    x: -W * 1.02,
    y: H * 1.02,
    rotate: a1 + swing,
    ease: EASE_IN,
  });

  // A thrown knife: x moves at a steady speed while y follows gravity, a parabola
  // through `apexY` (it slows as it rises, hangs at the top, and speeds up as it falls).
  // Sampled into many small linear steps, so the curve is smooth.
  const toss = (o: {
    from: [number, number];
    to: [number, number];
    apexY: number; // highest point (screen y grows downward, so "high" = smaller)
    t0: number;
    dur: number;
    rotFrom: number;
    rotTo: number;
    spin?: (u: number) => number; // how the turning is spread over the flight (0..1 → 0..1)
    scaleTo?: number;
  }) => {
    const [x0, y0] = o.from;
    const [x1, y1] = o.to;
    // y(u) = y0 + b·u + a·u², with its peak at apexY and ending at y1
    const rise = y0 - o.apexY; // > 0
    const b = -2 * rise - 2 * Math.sqrt(Math.max(0, rise * (y1 - o.apexY)));
    const a = y1 - y0 - b;
    const spin = o.spin ?? ((u: number) => u);
    const steps = 16;
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      at({
        t: o.t0 + o.dur * u,
        x: x0 + (x1 - x0) * u,
        y: y0 + b * u + a * u * u,
        rotate: o.rotFrom + (o.rotTo - o.rotFrom) * spin(u),
        scale: 1 + ((o.scaleTo ?? 1) - 1) * u,
        ease: "linear",
      });
    }
  };

  // ── Recover 1: tossed back up the left side, about 1½ turns, rising and slowing
  //    until it hangs at the top-left (its peak), right where slash 2 begins
  const a2 = diagonal; // slash 2's direction: down-right
  const after1 = a1 + swing;
  const flip1 =
    a2 - swing + 360 * Math.round((after1 + 900 - (a2 - swing)) / 360); // ≈ 2½ turns on
  toss({
    from: [-W * 1.02, H * 1.02],
    to: [-W * 0.95, -H * 0.95],
    apexY: -H * 0.95, // peaks exactly at the start of slash 2
    t0: s1 + t1,
    dur: s2 - (s1 + t1),
    rotFrom: after1,
    rotTo: flip1,
  });

  // ── Slash 2: top-left → bottom-right corner
  at({
    t: s2 + t2,
    x: W * 1.02,
    y: H * 1.02,
    rotate: flip1 + 2 * swing,
    ease: EASE_IN,
  });

  // ── Recover 2: thrown high, up and over the top of the screen, 5 turns, spinning
  //    faster and faster as it falls, landing at the middle-left tip-right (0°)
  const startSpin = flip1 + 2 * swing;
  const turns = 8;
  const landed = 360 * Math.round((startSpin + turns * 360) / 360); // ≡ 0°: tip right
  const holdAt = s3 - HOLD;
  toss({
    from: [W * 1.02, H * 1.02],
    to: [-W * 0.82, -12],
    apexY: -H * 0.82,
    t0: s2 + t2,
    dur: holdAt - (s2 + t2),
    rotFrom: startSpin,
    rotTo: landed,
    spin: (u) => Math.pow(u, 2.4), // a lazy start, then winding up hard as it falls
    scaleTo: 1.15,
  });

  // ── The held breath: stop dead, draw back toward the edge and cock the blade
  at({
    t: s3,
    x: -W * 0.9,
    y: -4,
    rotate: landed - 26,
    scale: 1.1,
    ease: "easeOut",
  });

  // ── Slash 3: left → right, straight across the middle, off the far side
  at({
    t: s3 + t3,
    x: W * 1.25,
    y: 0,
    rotate: landed + 14,
    scale: 1,
    ease: EASE_IN,
  });
  at({
    t: s3 + t3 + 0.03,
    x: W * 1.25,
    y: 0,
    rotate: landed + 14,
    scale: 1,
    opacity: 0,
  });

  const duration = keys[keys.length - 1].t;
  return {
    x: keys.map((k) => k.x),
    y: keys.map((k) => k.y),
    rotate: keys.map((k) => k.rotate),
    scale: keys.map((k) => k.scale ?? 1),
    opacity: keys.map((k) => k.opacity ?? 1),
    times: keys.map((k) => k.t / duration),
    ease: keys.slice(1).map((k) => k.ease ?? "linear"),
    duration,
  };
}

// One glowing cut through the screen's center at `angle`, drawn from `from` during its slash
function Cut({
  angle,
  from,
  slash: [start, travel],
  length,
  fadeAt,
  seam = false,
  heavy = false,
}: {
  angle: number;
  from: "left" | "right";
  slash: [number, number];
  length: number;
  fadeAt: number;
  seam?: boolean; // the middle cut: brighter, it's where the curtain opens
  heavy?: boolean; // the big slash: a thicker cut
}) {
  const end = fadeAt + 0.35;
  // Two layers on purpose: the OUTER one rotates around its center, so the cut always
  // passes through the middle of the screen; the INNER one grows from the end where the
  // blade enters. (One element can't do both: transform-origin applies to rotate AND
  // scale, so growing from an end would also make it pivot around that end.)
  return (
    <div
      className={`absolute top-1/2 left-1/2 ${heavy ? "h-1.5" : "h-1"}`}
      style={{
        width: length,
        marginLeft: -length / 2,
        marginTop: heavy ? -3 : -2,
        rotate: `${angle}deg`, // around the center (the default origin)
      }}
    >
      <motion.div
        className="h-full w-full"
        style={{
          transformOrigin: from === "left" ? "0% 50%" : "100% 50%",
          // Warm gold with a bright core
          background:
            "linear-gradient(90deg, transparent, #e9a23b 10%, #fff3d6 50%, #e9a23b 90%, transparent)",
          boxShadow: seam
            ? "0 0 14px 4px rgb(233 162 59 / .9), 0 0 40px 12px rgb(233 162 59 / .4)"
            : "0 0 10px 2px rgb(233 162 59 / .8), 0 0 26px 8px rgb(233 162 59 / .3)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 0, 1, 1, 1], opacity: [0, 1, 1, 1, 0] }}
        transition={{
          duration: end,
          times: [0, start / end, (start + travel) / end, fadeAt / end, 1],
          ease: ["linear", EASE_IN, "linear", "easeOut"],
        }}
      />
    </div>
  );
}

function PageAdded({ delay }: { delay: number }) {
  return (
    <motion.p
      className="bg-base-100/95 text-base-content absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-5 py-2 font-serif text-lg font-semibold whitespace-nowrap shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.98] }}
      transition={{ delay, duration: 1.1, times: [0, 0.2, 0.75, 1] }}
    >
      ✦ Page added
    </motion.p>
  );
}

// The motion trail: the real knife (lag 0) plus ghosts trailing behind, each fainter
const TRAIL = [
  { lag: 0.09, fade: 0.12 },
  { lag: 0.06, fade: 0.2 },
  { lag: 0.03, fade: 0.35 },
  { lag: 0, fade: 1 },
];

// The knife's slipstream: one streak trailing the blade, like a light trail. It's
// drawn through the knife's last LINGER seconds of positions: thick and bright right
// behind the knife, tapering thinner and fading out toward the tail. It records where the
// knife actually is each frame (so it can't drift), stretches long when the knife moves
// fast, and shrinks away when it stops.
const LINGER = 0.18;
const STREAK_WIDTH = 7; // px at the head; tapers to nothing at the tail

function Slipstream({
  track,
  screen,
}: {
  track: React.MutableRefObject<((x: number, y: number) => void) | null>;
  screen: { w: number; h: number };
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    // Sharp on high-density (retina) screens: draw at the device's pixel ratio
    const ratio = window.devicePixelRatio || 1;
    el.width = screen.w * ratio;
    el.height = screen.h * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";

    const points: { x: number; y: number; t: number }[] = [];
    track.current = (x, y) => {
      // keyframes are center-relative; the canvas uses screen pixels
      points.push({
        x: screen.w / 2 + x,
        y: screen.h / 2 + y,
        t: performance.now(),
      });
    };

    // Every frame: drop positions older than LINGER, then paint the streak segment by
    // segment, each one wider and brighter the newer it is.
    let frame = 0;
    const draw = () => {
      const now = performance.now();
      while (points.length && now - points[0].t > LINGER * 1000) points.shift();
      ctx.clearRect(0, 0, screen.w, screen.h);

      ctx.shadowColor = "rgb(255 236 205 / .9)"; // a soft glow around the streak
      ctx.shadowBlur = 10;
      for (let i = 1; i < points.length; i++) {
        const age = i / (points.length - 1); // 0 = the tail (oldest) … 1 = right behind the knife
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineWidth = Math.max(0.5, STREAK_WIDTH * age);
        ctx.strokeStyle = `rgb(255 248 236 / ${(0.75 * age * age).toFixed(3)})`; // fades fast toward the tail
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      track.current = null;
    };
  }, [track, screen]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="absolute inset-0"
      style={{ width: screen.w, height: screen.h }}
    />
  );
}

// A puff of dust: warm specks bursting outward from a point, then settling and fading
function Dust({
  x,
  y,
  at,
  size = 1,
}: {
  x: number;
  y: number;
  at: number;
  size?: number;
}) {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + i; // spread around, a little irregular
        const reach = (28 + ((i * 37) % 30)) * size;
        const px = (3 + ((i * 13) % 6)) * size;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: px,
              height: px,
              background: "rgb(222 190 150 / .75)",
              filter: "blur(0.5px)",
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.9, 0],
              x: Math.cos(angle) * reach,
              y: Math.sin(angle) * reach * 0.6 - 6 * size, // drifts up a little, like real dust
              scale: [0.6, 1.4, 1.8],
            }}
            transition={{ delay: at, duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

// Where sparks start along the middle cut (% across the screen) and where they fly
const SPARKS = [
  { at: 18, dx: -14, dy: -26 },
  { at: 30, dx: 10, dy: 22 },
  { at: 42, dx: -8, dy: -34 },
  { at: 50, dx: 16, dy: -20 },
  { at: 58, dx: -12, dy: 28 },
  { at: 70, dx: 12, dy: -30 },
  { at: 82, dx: -6, dy: 24 },
];

// A chef's knife, drawn in SVG: steel blade with a shine, wooden handle, rivets.
// Pointing right, edge down, so rotate 0 = blade level and moving right.
function ChefsKnife() {
  return (
    <svg width="180" height="48" viewBox="0 0 180 48" aria-hidden>
      <defs>
        <linearGradient id="knife-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="0.45" stopColor="#c9ced4" />
          <stop offset="1" stopColor="#8d949c" />
        </linearGradient>
        <linearGradient id="knife-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4a2c" />
          <stop offset="1" stopColor="#4a2b18" />
        </linearGradient>
      </defs>
      {/* blade: straight spine on top, curved edge sweeping up to the tip */}
      <path
        d="M62 12 L168 14 Q176 15 178 18 Q150 40 70 38 L62 36 Z"
        fill="url(#knife-steel)"
        stroke="#7d848c"
        strokeWidth="0.8"
      />
      {/* the sharpened edge: a thin bright line */}
      <path
        d="M70 37.4 Q150 39 177 18.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.1"
        opacity="0.9"
      />
      {/* bolster */}
      <rect x="56" y="11" width="9" height="27" rx="2" fill="#a7adb4" />
      {/* handle */}
      <rect
        x="4"
        y="15"
        width="54"
        height="19"
        rx="8"
        fill="url(#knife-wood)"
      />
      {/* rivets */}
      {[16, 30, 44].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy="24.5"
          r="2.2"
          fill="#d9dde1"
          stroke="#8d949c"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}
