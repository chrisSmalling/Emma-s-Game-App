import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useBennyPond from '../../hooks/useBennyPond';
import { LoopComponentId } from '../../hooks/useBennyChoreography';
import THEME from '../../constants/theme';
import { ActivityId } from '../../constants/activities';
import ForestBackground from '../ForestBackground';
import Fish from '../Fish';
import Shape from '../Shape';
import ColorBlob from '../ColorBlob';
import { CountableObjectProps } from '../TappableObject';
import ParentGate from '../ParentGate';
import SettingsScreen from '../SettingsScreen';
import Benny from './Benny';

type Props = {
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
};

// Which countable-object visual fills the pond for a given loop's
// variation (hooks/useBennyChoreography.ts) — Shape/ColorBlob are already-
// built, already CountableObjectProps-shaped, so "something new floated
// into the pond" costs nothing beyond swapping which component renders.
const POND_COMPONENTS: Record<LoopComponentId, React.ComponentType<CountableObjectProps>> = {
  fish: Fish,
  shapes: Shape,
  colors: ColorBlob,
};

// Benny's Pond — the PERFORMANCE-first redesign (see "Emma's App — Benny's
// Pond: from task to performance"). Benny performs the count himself first
// (she watches), invites her in, waits warmly, and either counts along
// with her taps or cheerfully finishes it himself — always ending on
// shared delight, then a varied next loop. All the state lives in
// useBennyPond/useBennyChoreography; this component is presentation only.
//
// Deliberately no top chrome band (unlike Game/LettersHome) — a colored bar
// across a "cozy forest" would immediately undercut the immersive, whole-
// screen world the brief asks for. The parent gate floats over the scene
// instead, same control, no chrome.
export default function BennyPondScreen({ activityId, onSelectActivity }: Props) {
  const { childName, greeted, bennyState, beat, variation, items, performCounted, fishInteractive, advanceFromGreeting, handleFishTap } =
    useBennyPond();
  const [bump, setBump] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // "Whole-screen life": a tap anywhere gentle-reacts — Benny gives a tiny
  // extra pop — even on empty background, directly answering "she tapped
  // the empty screen and drifted" from the very first test. A tap that
  // lands on a fish handles itself (TappableObject's own reaction); RN's
  // touch responder system means this only fires for taps that don't hit a
  // nested Pressable, so it never double-fires on a fish tap.
  function handleScenePress() {
    if (!greeted) {
      advanceFromGreeting();
      return;
    }
    setBump(b => b + 1);
  }

  const CountableComponent = POND_COMPONENTS[variation.component];
  // During 'perform', Benny is demonstrating — fish glow/pop as HE counts
  // them (performCounted), not the real round, so it stays fresh for her.
  // Every other beat shows the real round.
  const usingPerformOverlay = beat === 'perform';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable style={styles.scene} onPress={handleScenePress} accessibilityRole="none">
        <ForestBackground />

        <View style={styles.pond} pointerEvents="none" />

        <View style={styles.pondRow}>
          {items.map((it, i) => {
            const counted = usingPerformOverlay ? performCounted.includes(i) : it.counted;
            const order = usingPerformOverlay ? (performCounted.includes(i) ? performCounted.indexOf(i) + 1 : null) : it.order;
            return (
              <CountableComponent
                key={it.id}
                index={i}
                counted={counted}
                order={order}
                onPress={() => handleFishTap(i)}
                interactive={fishInteractive}
              />
            );
          })}
        </View>

        <View style={styles.bennySpot} pointerEvents="none">
          <Benny state={bennyState} bump={bump} size={150} />
        </View>

        {!greeted && (
          <View style={styles.speechCard} pointerEvents="none">
            <Text style={styles.speechTitle}>Hi, {childName}! 🐻</Text>
            <Text style={styles.speechBody}>Let&rsquo;s count the fish in my pond!</Text>
          </View>
        )}

        {greeted && (beat === 'invite' || beat === 'wait') && (
          <View style={styles.speechCard} pointerEvents="none">
            <Text style={styles.speechTitle}>Can YOU count them? 🐻</Text>
            <Text style={styles.speechBody}>You try!</Text>
          </View>
        )}

        {beat === 'delight' && (
          <View style={styles.celebrationBubble} pointerEvents="none">
            <Text style={styles.celebrationText}>We did it, {childName}! 🎉</Text>
          </View>
        )}

        <View style={styles.gateSpot}>
          <ParentGate onUnlock={() => setSettingsVisible(true)} />
        </View>
      </Pressable>

      <SettingsScreen
        visible={settingsVisible}
        activityId={activityId}
        onSelectActivity={onSelectActivity}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.forestDeep },
  scene: { flex: 1, alignItems: 'center', overflow: 'hidden' },
  // Stacked bottom-up with a deliberate gap so Benny never overlaps his own
  // pond: his feet sit at the very bottom, the pond (and the fish inside
  // it) sits well above his head.
  pond: {
    position: 'absolute',
    bottom: 185,
    left: '10%',
    right: '10%',
    height: 140,
    borderRadius: 100,
    backgroundColor: 'rgba(127, 216, 247, 0.35)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pondRow: {
    position: 'absolute',
    bottom: 207,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.l,
  },
  bennySpot: { position: 'absolute', bottom: 0, alignSelf: 'center' },
  gateSpot: { position: 'absolute', top: THEME.SPACING.m, right: THEME.SPACING.m },
  speechCard: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.xxl,
    alignItems: 'center',
    maxWidth: '84%',
  },
  speechTitle: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.forestDeep, textAlign: 'center' },
  speechBody: {
    fontSize: THEME.TYPE.body,
    fontFamily: THEME.TYPE.fontFamily,
    color: THEME.COLORS.forestDeep,
    textAlign: 'center',
    marginTop: THEME.SPACING.s,
  },
  celebrationBubble: {
    position: 'absolute',
    top: '16%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: THEME.SPACING.l,
    paddingHorizontal: THEME.SPACING.xl,
  },
  celebrationText: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.forestDeep },
});
