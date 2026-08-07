import React from 'react';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star';

type Props = {
  type: ShapeType;
  color: string;
  size?: number;
};

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export default function ShapeGraphic({ type, color, size = 68 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {type === 'circle' && <Circle cx={50} cy={50} r={42} fill={color} />}
      {type === 'square' && <Rect x={12} y={12} width={76} height={76} rx={12} fill={color} />}
      {type === 'triangle' && <Polygon points="50,10 90,88 10,88" fill={color} />}
      {type === 'star' && <Polygon points={starPoints(50, 50, 44, 18)} fill={color} />}
    </Svg>
  );
}
