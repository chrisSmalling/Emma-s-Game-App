import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useBennyPond from '../../hooks/useBennyPond';
import THEME from '../../constants/theme';
import { ActivityId } from '../../constants/activities';
import ForestBackground from '../ForestBackground';
import Fish from '../Fish';
import ParentGate from '../ParentGate';
import SettingsScreen from '../SettingsScreen';
import Benny from './Benny';

type Props = {
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
};

// Benny's Pond — the character-first slice (see the redesign brief:
// "Emma's App — Benny's First Magical Slice"). One small activity —
// counting the fish in Benny's pond — carrying everything the flat version
// lacked: a friend who knows her name, a living world, a warm voice,
// whole-screen response. All the state lives in useBennyPond; this
// component is presentation only.
//
// Deliberately no top chrome band (unlike Game/LettersHome) — a colored bar
// across a "cozy forest" would immediately undercut the immersive, whole-
// screen world the brief asks for. The parent gate floats over the scene
// instead, same control, no chrome.
export default function BennyPondScreen({ activityId, onSelectActivity }: Props) {
  const { childName, stage, bennyState, items, advanceFromGreeting, handleFishTap } = useBennyPond();
  const [bump, setBump] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // "Whole-screen life": a tap anywhere gentle-reacts — Benny gives a tiny
  // extra pop — even on empty background, directly answering "she tapped
  // the empty screen and drifted" from the very first test. A tap that
  // lands on a fish handles itself (TappableObject's own reaction); RN's
  // touch responder system means this only fires for taps that don't hit a
  // nested Pressable, so it never double-fires on a fish tap.
  function handleScenePress() {
    if (stage === 'greeting') {
      advanceFromGreeting();
      return;
    }
    setBump(b => b + 1);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable style={styles.scene} onPress={handleScenePress} accessibilityRole="none">
        <ForestBackground />

        <View style={styles.pond} pointerEvents="none" />

        <View style={styles.pondRow}>
          {items.map((it, i) => (
            <Fish key={it.id} index={i} counted={it.counted} order={it.order} onPress={() => handleFishTap(i)} interactive={stage === 'counting'} />
          ))}
        </View>

        <View style={styles.bennySpot} pointerEvents="none">
          <Benny state={bennyState} bump={bump} size={150} />
        </View>

        {stage === 'greeting' && (
          <View style={styles.greetingCard} pointerEvents="none">
            <Text style={styles.greetingTitle}>Hi, {childName}! 🐻</Text>
            <Text style={styles.greetingBody}>Let&rsquo;s count the fish in my pond!</Text>
          </View>
        )}

        {stage === 'celebrating' && (
          <View style={styles.celebrationBubble} pointerEvents="none">
            <Text style={styles.celebrationText}>Yay, {childName}! 🎉</Text>
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
  greetingCard: {
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
  greetingTitle: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.forestDeep, textAlign: 'center' },
  greetingBody: {
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
