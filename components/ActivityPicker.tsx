import React from 'react';
import { ACTIVITIES, ActivityId } from '../constants/activities';
import OptionPicker from './OptionPicker';

type Props = {
  currentActivityId: ActivityId;
  onSelect: (id: ActivityId) => void;
};

export default function ActivityPicker({ currentActivityId, onSelect }: Props) {
  return (
    <OptionPicker heading="Activity" options={ACTIVITIES} selectedId={currentActivityId} onSelect={onSelect} />
  );
}
