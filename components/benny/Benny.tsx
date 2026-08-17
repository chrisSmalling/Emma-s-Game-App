import React, { useEffect, useRef } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import THEME from '../../constants/theme';

// Benny — the character-first slice's whole reason for being. A simple,
// warm, code-drawn bear (react-native-svg geometry, no image assets — same
// "code not assets" approach ForestBackground/Fish/Shape already use) built
// on "baby schema" proportions (oversized head, large low-set eyes, round
// soft everything, no sharp angles) — the cues that read as instantly cute
// to a toddler. His scarf is the one fixed-color signature detail.
//
// Six emotional states, driven purely by the `state` prop plus two small
// counters for per-event reactions that shouldn't themselves change what
// Benny is "doing": `countPulse` (one warm bounce per fish counted) and
// `bump` (a tiny reaction to any tap, independent of state). Every motion
// is a Reanimated spring/timing running on the UI thread — no re-render
// churn, no snapping between poses.
export type BennyState = 'idle' | 'curious' | 'counting' | 'celebrating' | 'waiting' | 'proud';

type Props = {
  state: BennyState;
  size?: number;
  // Increment once per fish counted (Benny's own performance, her tap, or
  // his warm fallback) to fire a single small bounce in sync with the
  // count — see hooks/useBennyPond.ts. Independent of `state` so it can
  // fire repeatedly during a single 'counting' stretch.
  countPulse?: number;
  // Increment for a tiny extra pop reaction to a tap that doesn't itself
  // change what Benny is doing (BennyPondScreen's "whole-screen life").
  bump?: number;
};

// One place to tune the geometry — every shape below reads its numbers
// from here. Proportions follow "baby schema": the head is ~1.3x the
// body's width, eyes are large and sit low on the head (lots of forehead
// above them), everything is round.
const LAYOUT = {
  viewBox: { width: 200, height: 232 },
  head: { cx: 100, cy: 92, r: 56 }, // diameter 112 vs body width 84 → 1.33x
  ears: { dx: 46, cy: 40, r: 22, innerR: 11 },
  muzzle: { cx: 100, cy: 112, rx: 30, ry: 24 },
  nose: { cx: 100, cy: 98, rx: 7, ry: 5 },
  eyes: { dx: 22, cy: 90, r: 10, highlight: 3 },
  body: { cx: 100, cy: 180, rx: 42, ry: 40 },
  chest: { cx: 100, cy: 188, rx: 25, ry: 21 },
  arm: { width: 20, height: 52, rx: 10, y: 148, leftX: 42, rightX: 138, pivot: { left: 52, right: 148, y: 150 } },
  legs: { dx: 27, cy: 222, rx: 16, ry: 10 },
  scarf: {
    band: 'M 48 132 Q 100 154 152 132 L 152 116 Q 100 136 48 116 Z',
    tail: 'M 90 138 L 82 176 L 106 160 Z',
  },
} as const;

const FUR = THEME.COLORS.bennyFur;
const FUR_LIGHT = THEME.COLORS.bennyFurLight;
const SCARF = THEME.COLORS.bennyScarf;
const INK = THEME.COLORS.bennyInk;
const OUTLINE = THEME.COLORS.bennyOutline;
const BLUSH = THEME.COLORS.bennyBlush;
const OUTLINE_WIDTH = 2.5;
const SPRING = THEME.MOTION.gentleSpring;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Eyes/mouth/blush are simple discrete swaps per state (re-rendered, not
// animated) — expression content changes with `state`, while the shared
// values below handle all the actual motion. Keeps the face iconic and
// legible at small size rather than trying to morph shapes smoothly.
function Face({ state }: { state: BennyState }) {
  const happyEyes = state === 'celebrating' || state === 'proud';
  const { cx: hx, cy: hy } = LAYOUT.head;
  const { dx, cy: ey, r, highlight } = LAYOUT.eyes;
  const leftX = hx - dx;
  const rightX = hx + dx;

  return (
    <>
      {/* muzzle/nose first — a base "face plate" that the eyes sit above,
          never painted over them regardless of exact overlap */}
      <Ellipse cx={LAYOUT.muzzle.cx} cy={LAYOUT.muzzle.cy} rx={LAYOUT.muzzle.rx} ry={LAYOUT.muzzle.ry} fill={FUR_LIGHT} />
      <Ellipse cx={LAYOUT.nose.cx} cy={LAYOUT.nose.cy} rx={LAYOUT.nose.rx} ry={LAYOUT.nose.ry} fill={INK} />

      {happyEyes ? (
        <>
          <Path d={`M ${leftX - 12} ${ey + 2} Q ${leftX} ${ey - 10} ${leftX + 12} ${ey + 2}`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d={`M ${rightX - 12} ${ey + 2} Q ${rightX} ${ey - 10} ${rightX + 12} ${ey + 2}`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={leftX} cy={ey} r={r} fill={INK} />
          <Circle cx={leftX + highlight - 1} cy={ey - highlight} r={highlight} fill="#fff" />
          <Circle cx={rightX} cy={ey} r={r} fill={INK} />
          <Circle cx={rightX + highlight - 1} cy={ey - highlight} r={highlight} fill="#fff" />
        </>
      )}

      {(state === 'celebrating' || state === 'proud') && (
        <>
          <Circle cx={leftX - 8} cy={LAYOUT.muzzle.cy - 6} r={9} fill={BLUSH} opacity={0.55} />
          <Circle cx={rightX + 8} cy={LAYOUT.muzzle.cy - 6} r={9} fill={BLUSH} opacity={0.55} />
        </>
      )}

      {state === 'celebrating' && (
        <Path d="M 84 116 Q 100 134 116 116" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {state === 'curious' && <Ellipse cx={100} cy={122} rx={5} ry={6} fill={INK} />}
      {state === 'counting' && <Ellipse cx={100} cy={122} rx={7} ry={7} fill={INK} />}
      {state === 'proud' && <Path d="M 82 116 Q 100 137 118 116 Q 100 127 82 116 Z" fill={INK} />}
      {(state === 'idle' || state === 'waiting') && (
        <Path d="M 90 119 Q 100 124 110 119" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
    </>
  );
}

export default function Benny({ state, size = 200, countPulse = 0, bump = 0 }: Props) {
  // Continuous "always alive" motion — runs regardless of state.
  const breathe = useSharedValue(0);
  const blink = useSharedValue(0);

  // State-driven poses.
  const headTilt = useSharedValue(0); // curious
  const earLift = useSharedValue(0); // curious
  const sway = useSharedValue(0); // waiting
  const chestPuff = useSharedValue(1); // proud
  const leftArm = useSharedValue(-12);
  const rightArm = useSharedValue(12);

  // One-shot / repeatable bounces, independent of `state`.
  const bounceY = useSharedValue(0); // per-count pulse + celebrate's one beat
  const popScale = useSharedValue(1); // whole-screen-life `bump` reaction
  const lean = useSharedValue(0); // curious's small forward lean

  const mountedOnceRef = useRef(false);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [breathe]);

  useEffect(() => {
    // Occasional blink on an irregular cadence — scheduled from JS, but the
    // blink itself is a tiny Reanimated sequence on the UI thread.
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    function scheduleBlink() {
      const delay = 2600 + Math.random() * 2600;
      timer = setTimeout(() => {
        if (cancelled) return;
        blink.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 140 }));
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    headTilt.value = withSpring(state === 'curious' ? -8 : 0, SPRING);
    earLift.value = withSpring(state === 'curious' ? 1 : 0, SPRING);
    lean.value = withSpring(state === 'curious' ? 1 : 0, SPRING);
    chestPuff.value = withSpring(state === 'proud' ? 1.06 : 1, SPRING);

    // Rotation is around each arm's shoulder pivot; positive/negative here
    // is *outward* vs *inward* per arm, not a shared sign — swinging both
    // arms to the same-signed angle would raise them up and INWARD, behind
    // the head (which draws on top), hiding them completely. +150/-150
    // swings each arm up and OUTWARD to the side instead — clear of the
    // head, reading as a triumphant little "cheer" V.
    const armsUp = state === 'celebrating';
    leftArm.value = withSpring(armsUp ? 150 : -12, SPRING);
    rightArm.value = withSpring(armsUp ? -150 : 12, SPRING);

    if (state === 'celebrating') {
      // One warm beat, then settle — never explosive.
      bounceY.value = withSequence(withSpring(-10, SPRING), withSpring(0, SPRING));
    }

    sway.value =
      state === 'waiting'
        ? withRepeat(
            withSequence(
              withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
              withTiming(-1, { duration: 1400, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
          )
        : withSpring(0, SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!mountedOnceRef.current) {
      // Skip the initial mount — countPulse/bump start at 0, not a real event.
      mountedOnceRef.current = true;
      return;
    }
    if (countPulse === 0) return;
    bounceY.value = withSequence(withSpring(-8, SPRING), withSpring(0, SPRING));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countPulse]);

  useEffect(() => {
    if (bump === 0) return;
    popScale.value = withSequence(withSpring(1.06, SPRING), withSpring(1, SPRING));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value - lean.value * 2 }, { scale: popScale.value }, { rotate: `${sway.value * 3}deg` }],
  }));

  const headProps = useAnimatedProps(() => ({
    transform: `rotate(${headTilt.value} ${LAYOUT.head.cx} ${LAYOUT.head.cy})`,
  }));

  const earsProps = useAnimatedProps(() => ({
    transform: `translate(0 ${-earLift.value * 3})`,
  }));

  const bodyProps = useAnimatedProps(() => {
    const s = 1 + breathe.value * 0.018;
    const { cx, cy } = LAYOUT.body;
    return { transform: `translate(${cx} ${cy}) scale(1 ${s}) translate(${-cx} ${-cy})` };
  });

  const chestProps = useAnimatedProps(() => {
    const { cx, cy } = LAYOUT.chest;
    return { transform: `translate(${cx} ${cy}) scale(${chestPuff.value}) translate(${-cx} ${-cy})` };
  });

  const leftArmProps = useAnimatedProps(() => ({
    transform: `rotate(${leftArm.value} ${LAYOUT.arm.pivot.left} ${LAYOUT.arm.pivot.y})`,
  }));
  const rightArmProps = useAnimatedProps(() => ({
    transform: `rotate(${rightArm.value} ${LAYOUT.arm.pivot.right} ${LAYOUT.arm.pivot.y})`,
  }));

  const leftBlinkProps = useAnimatedProps(() => ({ ry: blink.value * (LAYOUT.eyes.r + 1) }));
  const rightBlinkProps = useAnimatedProps(() => ({ ry: blink.value * (LAYOUT.eyes.r + 1) }));

  const showRoundEyes = state !== 'celebrating' && state !== 'proud';
  const { width: vbW, height: vbH } = LAYOUT.viewBox;

  return (
    <Animated.View style={[{ width: size, height: (size * vbH) / vbW }, containerStyle]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`}>
        {/* feet */}
        <Ellipse cx={LAYOUT.body.cx - LAYOUT.legs.dx} cy={LAYOUT.legs.cy} rx={LAYOUT.legs.rx} ry={LAYOUT.legs.ry} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        <Ellipse cx={LAYOUT.body.cx + LAYOUT.legs.dx} cy={LAYOUT.legs.cy} rx={LAYOUT.legs.rx} ry={LAYOUT.legs.ry} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />

        {/* body — breathing scale lives on this group */}
        <AnimatedG animatedProps={bodyProps}>
          <Ellipse cx={LAYOUT.body.cx} cy={LAYOUT.body.cy} rx={LAYOUT.body.rx} ry={LAYOUT.body.ry} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        </AnimatedG>

        {/* arms — rotate around the shoulder. A raw SVG transform string via
            animatedProps (not react-native-svg's rotation/origin convenience
            props, which trigger a spurious "transform-origin" React DOM
            warning on web). */}
        <AnimatedRect
          x={LAYOUT.arm.leftX}
          y={LAYOUT.arm.y}
          width={LAYOUT.arm.width}
          height={LAYOUT.arm.height}
          rx={LAYOUT.arm.rx}
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          animatedProps={leftArmProps}
        />
        <AnimatedRect
          x={LAYOUT.arm.rightX}
          y={LAYOUT.arm.y}
          width={LAYOUT.arm.width}
          height={LAYOUT.arm.height}
          rx={LAYOUT.arm.rx}
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          animatedProps={rightArmProps}
        />

        {/* chest/belly — proud's slight puff lives on this group */}
        <AnimatedG animatedProps={chestProps}>
          <Ellipse cx={LAYOUT.chest.cx} cy={LAYOUT.chest.cy} rx={LAYOUT.chest.rx} ry={LAYOUT.chest.ry} fill={FUR_LIGHT} />
        </AnimatedG>

        {/* scarf — Benny's signature detail, always this color */}
        <Path d={LAYOUT.scarf.band} fill={SCARF} stroke={OUTLINE} strokeWidth={1.5} />
        <Path d={LAYOUT.scarf.tail} fill={SCARF} stroke={OUTLINE} strokeWidth={1.5} />

        {/* head (with ears + face) — tilts as one group for 'curious' */}
        <AnimatedG animatedProps={headProps}>
          <AnimatedG animatedProps={earsProps}>
            <Circle cx={LAYOUT.head.cx - LAYOUT.ears.dx} cy={LAYOUT.ears.cy} r={LAYOUT.ears.r} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
            <Circle cx={LAYOUT.head.cx + LAYOUT.ears.dx} cy={LAYOUT.ears.cy} r={LAYOUT.ears.r} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
            <Circle cx={LAYOUT.head.cx - LAYOUT.ears.dx} cy={LAYOUT.ears.cy + 2} r={LAYOUT.ears.innerR} fill={FUR_LIGHT} />
            <Circle cx={LAYOUT.head.cx + LAYOUT.ears.dx} cy={LAYOUT.ears.cy + 2} r={LAYOUT.ears.innerR} fill={FUR_LIGHT} />
          </AnimatedG>

          <Circle cx={LAYOUT.head.cx} cy={LAYOUT.head.cy} r={LAYOUT.head.r} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />

          <Face state={state} />

          {showRoundEyes && (
            <>
              <AnimatedEllipse
                cx={LAYOUT.head.cx - LAYOUT.eyes.dx}
                cy={LAYOUT.eyes.cy}
                rx={LAYOUT.eyes.r + 1}
                fill={FUR}
                animatedProps={leftBlinkProps}
              />
              <AnimatedEllipse
                cx={LAYOUT.head.cx + LAYOUT.eyes.dx}
                cy={LAYOUT.eyes.cy}
                rx={LAYOUT.eyes.r + 1}
                fill={FUR}
                animatedProps={rightBlinkProps}
              />
            </>
          )}
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
