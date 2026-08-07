import React from 'react';
import THEME from '../constants/theme';
import TappableObject from './TappableObject';
import ShapeGraphic, { ShapeType } from './ShapeGraphic';

type Props = {
  index: number;
  counted: boolean;
  order: number | null;
  onPress: () => void;
};

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'star'];

// Locked palette colors only — see DESIGN-BRIEF.md.
const SHAPE_COLORS = [...THEME.COLORS.fish, THEME.COLORS.counted, THEME.COLORS.accent];

export default function Shape({ index, counted, order, onPress }: Props) {
  const type = SHAPE_TYPES[index % SHAPE_TYPES.length];
  const color = SHAPE_COLORS[index % SHAPE_COLORS.length];

  return (
    <TappableObject index={index} counted={counted} order={order} onPress={onPress} objectLabel="Shape">
      <ShapeGraphic type={type} color={color} />
    </TappableObject>
  );
}
