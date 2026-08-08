import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';
import { LevelId } from '../constants/levels';
import { SubjectId } from '../constants/subjects';
import { ActivityId } from '../constants/activities';
import { LetterStageId } from '../constants/letterStages';
import LevelPicker from './LevelPicker';
import SubjectPicker from './SubjectPicker';
import ActivityPicker from './ActivityPicker';
import LetterStagePicker from './LetterStagePicker';

type Props = {
  visible: boolean;
  activityId: ActivityId;
  onSelectActivity: (id: ActivityId) => void;
  // Counting-specific — omitted entirely when settings are opened from an
  // activity (like Letters) that has no level/subject of its own.
  highestCountReached?: number;
  levelId?: LevelId;
  onSelectLevel?: (id: LevelId) => void;
  subjectId?: SubjectId;
  onSelectSubject?: (id: SubjectId) => void;
  // Letters-specific — omitted when settings are opened from Counting.
  letterStageId?: LetterStageId;
  onSelectLetterStage?: (id: LetterStageId) => void;
  onClose: () => void;
};

export default function SettingsScreen({
  visible,
  activityId,
  onSelectActivity,
  highestCountReached,
  levelId,
  onSelectLevel,
  subjectId,
  onSelectSubject,
  letterStageId,
  onSelectLetterStage,
  onClose,
}: Props) {
  const showCountingOptions = levelId != null && onSelectLevel != null && subjectId != null && onSelectSubject != null;
  const showLetterStageOptions = letterStageId != null && onSelectLetterStage != null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Grown-up Settings</Text>
            {highestCountReached != null && (
              <Text style={styles.body}>Highest count reached: {highestCountReached || '—'}</Text>
            )}

            <ActivityPicker currentActivityId={activityId} onSelect={onSelectActivity} />

            {showCountingOptions && (
              <>
                <View style={styles.spacer} />
                <SubjectPicker currentSubjectId={subjectId} onSelect={onSelectSubject} />
                <View style={styles.spacer} />
                <LevelPicker currentLevelId={levelId} onSelect={onSelectLevel} />
              </>
            )}

            {showLetterStageOptions && (
              <>
                <View style={styles.spacer} />
                <LetterStagePicker currentStageId={letterStageId} onSelect={onSelectLetterStage} />
              </>
            )}

            <Text style={styles.note}>
              This app collects nothing — no accounts, no network calls, no analytics,
              no microphone. Progress is stored on this device only.
            </Text>
            <Text style={styles.comingSoon}>More settings (themes) are coming in a future update.</Text>
          </ScrollView>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: THEME.withOpacity(THEME.COLORS.deepWater, 0.85), alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, maxHeight: '85%' },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, marginBottom: 16, color: THEME.COLORS.deepWater },
  body: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamily, marginBottom: 16 },
  spacer: { height: THEME.SPACING.l },
  note: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#555', lineHeight: 20, marginTop: 4, marginBottom: 12 },
  comingSoon: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#888', marginBottom: 4 },
  closeButton: { backgroundColor: THEME.COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  closeText: { color: '#fff', fontSize: 16, fontFamily: THEME.TYPE.fontFamilyBold },
});
