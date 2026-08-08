import React from 'react';
import { LETTER_STAGES, LetterStageId } from '../constants/letterStages';
import OptionPicker from './OptionPicker';

type Props = {
  currentStageId: LetterStageId;
  onSelect: (id: LetterStageId) => void;
};

export default function LetterStagePicker({ currentStageId, onSelect }: Props) {
  return (
    <OptionPicker heading="Letters mode" options={LETTER_STAGES} selectedId={currentStageId} onSelect={onSelect} />
  );
}
