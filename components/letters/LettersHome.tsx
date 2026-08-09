import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import THEME from '../../constants/theme';
import { ActivityId } from '../../constants/activities';
import { DEFAULT_LETTER_STAGE_ID, LETTER_STAGES, LetterStageId } from '../../constants/letterStages';
import ParentGate from '../ParentGate';
import SettingsScreen from '../SettingsScreen';
import PracticeScreen from './PracticeScreen';
import SoundMatchScreen from './SoundMatchScreen';
import WordBuildScreen from './WordBuildScreen';

const STORAGE_KEY_STAGE = 'littleLearner.letters.en.stageId';

type Props = {
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
};

// Root of the Letters activity: owns which internal stage is active
// (LETTERS-VERTICAL-BRIEF.md §2 — Stage A "Practice" is built as L1, Stage B
// "Sound Match" as L2, Stage C "Word Building" as L3) and the
// chrome shared across all of them (title, parent gate, settings). Each
// stage is a fully self-contained screen (its own OceanBackground, scene,
// bottom band) — this component only switches between them.
export default function LettersHome({ activityId, onSelectActivity }: Props) {
  const [stageId, setStageId] = useState<LetterStageId>(DEFAULT_LETTER_STAGE_ID);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_STAGE)
      .then(value => {
        if (value && LETTER_STAGES.some(s => s.id === value)) {
          setStageId(value as LetterStageId);
        }
      })
      .catch(() => {
        // no persisted stage yet, or storage unavailable — start on the default
      });
  }, []);

  function selectStage(id: LetterStageId) {
    setStageId(id);
    AsyncStorage.setItem(STORAGE_KEY_STAGE, id).catch(() => {});
  }

  const stageLabel = LETTER_STAGES.find(s => s.id === stageId)?.label ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBand}>
        <View style={styles.topBandLeft}>
          <Text style={styles.title}>Letters</Text>
          <Text style={styles.stageLabel}>{stageLabel}</Text>
        </View>
        <ParentGate onUnlock={() => setSettingsVisible(true)} />
      </View>

      {stageId === 'soundMatch' ? <SoundMatchScreen /> : stageId === 'wordBuild' ? <WordBuildScreen /> : <PracticeScreen />}

      <SettingsScreen
        visible={settingsVisible}
        activityId={activityId}
        onSelectActivity={onSelectActivity}
        letterStageId={stageId}
        onSelectLetterStage={selectStage}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.surfaceWater },
  topBand: {
    height: 72,
    paddingHorizontal: THEME.SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.midWater,
  },
  topBandLeft: { flexShrink: 1 },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, color: '#fff' },
  stageLabel: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: 'rgba(255,255,255,0.85)' },
});
