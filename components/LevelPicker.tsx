import React from 'react';
import { LEVELS, LevelId } from '../constants/levels';
import OptionPicker from './OptionPicker';

type Props = {
  currentLevelId: LevelId;
  onSelect: (id: LevelId) => void;
};

export default function LevelPicker({ currentLevelId, onSelect }: Props) {
  return <OptionPicker heading="Counting level" options={LEVELS} selectedId={currentLevelId} onSelect={onSelect} />;
}
