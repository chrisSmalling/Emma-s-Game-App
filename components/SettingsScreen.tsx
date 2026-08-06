import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';

type Props = {
  visible: boolean;
  highestCountReached: number;
  onClose: () => void;
};

export default function SettingsScreen({ visible, highestCountReached, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Grown-up Settings</Text>
          <Text style={styles.body}>
            Highest count reached: {highestCountReached || '—'}
          </Text>
          <Text style={styles.note}>
            This app collects nothing — no accounts, no network calls, no analytics,
            no microphone. The only thing saved is the highest count reached, stored
            on this device only.
          </Text>
          <Text style={styles.comingSoon}>More settings (levels, themes) are coming in a future update.</Text>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,77,110,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 },
  title: { fontSize: THEME.TYPE.title, fontFamily: THEME.TYPE.fontFamilyBold, marginBottom: 16, color: THEME.COLORS.deepWater },
  body: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamily, marginBottom: 16 },
  note: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#555', lineHeight: 20, marginBottom: 12 },
  comingSoon: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#888', marginBottom: 20 },
  closeButton: { backgroundColor: THEME.COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 16, fontFamily: THEME.TYPE.fontFamilyBold },
});
