import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';
import { LEVELS, LevelId } from '../constants/levels';

type Props = {
  currentLevelId: LevelId;
  onSelect: (id: LevelId) => void;
};

export default function LevelPicker({ currentLevelId, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.heading}>Counting level</Text>
      {LEVELS.map(level => {
        const selected = level.id === currentLevelId;
        return (
          <Pressable
            key={level.id}
            onPress={() => onSelect(level.id)}
            disabled={level.comingSoon}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: level.comingSoon }}
            style={[styles.row, selected && styles.rowSelected, level.comingSoon && styles.rowDisabled]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {level.label}
                {level.comingSoon ? ' (coming soon)' : ''}
              </Text>
              <Text style={styles.description}>{level.description}</Text>
            </View>
            {selected && <Text style={styles.check}>✓</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: THEME.TYPE.body,
    fontFamily: THEME.TYPE.fontFamilyBold,
    color: THEME.COLORS.deepWater,
    marginBottom: THEME.SPACING.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F4F6F8',
    padding: THEME.SPACING.m,
    marginBottom: THEME.SPACING.s,
  },
  rowSelected: {
    borderColor: THEME.COLORS.counted,
    backgroundColor: THEME.withOpacity(THEME.COLORS.counted, 0.1),
  },
  rowDisabled: { opacity: 0.5 },
  rowText: { flex: 1 },
  label: { fontSize: THEME.TYPE.body, fontFamily: THEME.TYPE.fontFamilyBold, color: THEME.COLORS.deepWater },
  labelSelected: { color: THEME.COLORS.deepWater },
  description: { fontSize: THEME.TYPE.small, fontFamily: THEME.TYPE.fontFamily, color: '#666', marginTop: 2 },
  check: { fontSize: 18, color: THEME.COLORS.counted, fontFamily: THEME.TYPE.fontFamilyBold, marginLeft: THEME.SPACING.s },
});
