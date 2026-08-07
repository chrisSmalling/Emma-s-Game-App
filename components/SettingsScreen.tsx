import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';
import { LevelId } from '../constants/levels';
import LevelPicker from './LevelPicker';

type Props = {
  visible: boolean;
  highestCountReached: number;
  levelId: LevelId;
  onSelectLevel: (id: LevelId) => void;
  onClose: () => void;
};

export default function SettingsScreen({ visible, highestCountReached, levelId, onSelectLevel, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Grown-up Settings</Text>
            <Text style={styles.body}>Highest count reached: {highestCountReached || '—'}</Text>

            <LevelPicker currentLevelId={levelId} onSelect={onSelectLevel} />

            <Text style={styles.note}>
              This app collects nothing — no accounts, no network calls, no analytics,
              no microphone. The only things saved are the highest count reached and the
              chosen level, stored on this device only.
            </Text>
            <Text style={styles.comingSoon}>More settings (themes, subjects) are coming in a future update.</Text>
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
  note: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#555', lineHeight: 20, marginTop: 4, marginBottom: 12 },
  comingSoon: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#888', marginBottom: 4 },
  closeButton: { backgroundColor: THEME.COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  closeText: { color: '#fff', fontSize: 16, fontFamily: THEME.TYPE.fontFamilyBold },
});
