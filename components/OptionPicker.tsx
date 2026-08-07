import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import THEME from '../constants/theme';

export type PickerOption = {
  id: string;
  label: string;
  description: string;
  comingSoon?: boolean;
};

type Props<T extends PickerOption> = {
  heading: string;
  options: T[];
  selectedId: string;
  onSelect: (id: T['id']) => void;
};

// Shared row-list picker UI behind the parent gate — used for both the
// counting level and the counting subject.
export default function OptionPicker<T extends PickerOption>({ heading, options, selectedId, onSelect }: Props<T>) {
  return (
    <View>
      <Text style={styles.heading}>{heading}</Text>
      {options.map(option => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            disabled={option.comingSoon}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: option.comingSoon }}
            style={[styles.row, selected && styles.rowSelected, option.comingSoon && styles.rowDisabled]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
                {option.comingSoon ? ' (coming soon)' : ''}
              </Text>
              <Text style={styles.description}>{option.description}</Text>
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
