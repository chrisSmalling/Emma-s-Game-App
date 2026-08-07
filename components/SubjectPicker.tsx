import React from 'react';
import { SUBJECTS, SubjectId } from '../constants/subjects';
import OptionPicker from './OptionPicker';

type Props = {
  currentSubjectId: SubjectId;
  onSelect: (id: SubjectId) => void;
};

export default function SubjectPicker({ currentSubjectId, onSelect }: Props) {
  return (
    <OptionPicker heading="Counting subject" options={SUBJECTS} selectedId={currentSubjectId} onSelect={onSelect} />
  );
}
