import React from 'react';
import THEME from '../constants/theme';
import TappableObject, { CountableObjectProps } from './TappableObject';
import ShapeGraphic, { ShapeType } from './ShapeGraphic';

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'circle', label: 'Circle' },
  { type: 'square', label: 'Square' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'star', label: 'Star' },
];

// Locked palette colors only — see DESIGN-BRIEF.md.
const SHAPE_COLORS = [...THEME.COLORS.fish, THEME.COLORS.counted, THEME.COLORS.accent];

export default function Shape({ index, counted, order, onPress, interactive }: CountableObjectProps) {
  const shape = SHAPES[index % SHAPES.length];
  const color = SHAPE_COLORS[index % SHAPE_COLORS.length];

  return (
    <TappableObject
      index={index}
      counted={counted}
      order={order}
      onPress={onPress}
      interactive={interactive}
      objectLabel={`${shape.label} shape`}
    >
      <ShapeGraphic type={shape.type} color={color} />
    </TappableObject>
  );
}
