import React, { useEffect } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, Easing } from 'react-native-reanimated';
import THEME from '../../constants/theme';

// Benny — the character-first slice's whole reason for being. A simple,
// warm, code-drawn bear (no image assets, same "code not assets" approach
// OceanBackground/ShapeGraphic already use) with a scarf and four clear
// emotional states. Deliberately simple geometry — round shapes, no fine
// detail — so it reads instantly and stays cheap to animate.
export type BennyState = 'happy' | 'curious' | 'countingAlong' | 'proud';

type Props = {
  state: BennyState;
  size?: number;
  // Increment to trigger a small extra pop independent of `state` — the
  // "whole-screen life" reaction (brief: "taps anywhere get a gentle
  // response; Benny reacts to her") for a tap that doesn't itself change
  // what Benny is doing.
  bump?: number;
};

const FUR = THEME.COLORS.bennyFur;
const FUR_LIGHT = THEME.COLORS.bennyFurLight;
const SCARF = THEME.COLORS.bennyScarf;
const INK = '#4A3323'; // warm dark brown for eyes/nose/mouth — never pure black, stays soft
const OUTLINE = '#7A5636'; // soft cartoon outline so same-color shapes (arms on body, ears on head) read as distinct parts
const OUTLINE_WIDTH = 2.5;

function Face({ state }: { state: BennyState }) {
  const eyesClosed = state === 'happy' || state === 'proud';
  return (
    <>
      {eyesClosed ? (
        <>
          <Path d="M 66 80 Q 78 70 90 80" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d="M 110 80 Q 122 70 134 80" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={78} cy={80} r={8} fill={INK} />
          <Circle cx={80.5} cy={77.5} r={2.5} fill="#fff" />
          <Circle cx={122} cy={80} r={8} fill={INK} />
          <Circle cx={124.5} cy={77.5} r={2.5} fill="#fff" />
        </>
      )}

      {state === 'proud' && (
        <>
          <Circle cx={60} cy={100} r={9} fill="#F49A82" opacity={0.55} />
          <Circle cx={140} cy={100} r={9} fill="#F49A82" opacity={0.55} />
        </>
      )}

      <Ellipse cx={100} cy={104} rx={28} ry={21} fill={FUR_LIGHT} />
      <Ellipse cx={100} cy={95} rx={7} ry={5} fill={INK} />

      {state === 'happy' && <Path d="M 85 113 Q 100 123 115 113" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />}
      {state === 'curious' && <Ellipse cx={100} cy={115} rx={6} ry={7} fill={INK} />}
      {state === 'countingAlong' && <Ellipse cx={100} cy={115} rx={9} ry={8} fill={INK} />}
      {state === 'proud' && <Path d="M 82 111 Q 100 132 118 111 Q 100 122 82 111 Z" fill={INK} />}
    </>
  );
}

export default function Benny({ state, size = 200, bump = 0 }: Props) {
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const tilt = useSharedValue(0);

  useEffect(() => {
    // A slow, continuous breathing bob — always alive, never static, even
    // between taps.
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, [bob]);

  useEffect(() => {
    // A little spring "pop" on every state change — the reaction itself.
    // Arm position is driven directly by `state` on the shapes below
    // (react-native-svg's `rotation`/`origin` props, not Reanimated) since
    // it's a discrete per-state pose, not a continuous value.
    pop.value = withSequence(withSpring(state === 'proud' ? 1.18 : 1.1, THEME.MOTION.spring), withSpring(1, THEME.MOTION.spring));
    tilt.value = withSpring(state === 'curious' ? -6 : 0, THEME.MOTION.spring);
  }, [state, pop, tilt]);

  useEffect(() => {
    if (bump === 0) return; // initial mount — not a real bump yet
    pop.value = withSequence(withSpring(1.06, THEME.MOTION.spring), withSpring(1, THEME.MOTION.spring));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -4 }, { scale: pop.value }, { rotate: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size * 1.1 }, containerStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 220">
        {/* feet */}
        <Ellipse cx={72} cy={205} rx={16} ry={9} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        <Ellipse cx={128} cy={205} rx={16} ry={9} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />

        {/* body */}
        <Ellipse cx={100} cy={175} rx={56} ry={46} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />

        {/* arms — rotate around the shoulder point for rest / gesture / raised-cheer.
            A raw SVG transform string rather than react-native-svg's
            rotation/origin convenience props — those trigger a spurious
            "transform-origin" React DOM warning on web. */}
        <Rect
          x={34}
          y={148}
          width={22}
          height={54}
          rx={11}
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          transform={`rotate(${state === 'proud' ? -70 : -12} 45 150)`}
        />
        <Rect
          x={144}
          y={148}
          width={22}
          height={54}
          rx={11}
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          transform={`rotate(${state === 'proud' ? 70 : state === 'countingAlong' ? 40 : 12} 155 150)`}
        />

        <Ellipse cx={100} cy={182} rx={30} ry={26} fill={FUR_LIGHT} />

        {/* scarf */}
        <Path d="M 54 132 Q 100 152 146 132 L 146 118 Q 100 136 54 118 Z" fill={SCARF} stroke={OUTLINE} strokeWidth={1.5} />
        <Path d="M 92 138 L 84 172 L 106 158 Z" fill={SCARF} stroke={OUTLINE} strokeWidth={1.5} />

        {/* head */}
        <Circle cx={58} cy={48} r={19} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        <Circle cx={142} cy={48} r={19} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        <Circle cx={58} cy={50} r={9} fill={FUR_LIGHT} />
        <Circle cx={142} cy={50} r={9} fill={FUR_LIGHT} />
        <Circle cx={100} cy={90} r={52} fill={FUR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />

        <Face state={state} />
      </Svg>
    </Animated.View>
  );
}
