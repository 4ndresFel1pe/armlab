import type { Joint } from '../core/types.ts';
import { displayQ, toSI, fmt } from './units';

interface Props {
  joints: Joint[];
  q: number[];
  onChange: (index: number, valueSI: number) => void;
}

export function JointSliders({ joints, q, onChange }: Props) {
  return (
    <div>
      {joints.map((joint, i) => {
        const shown = displayQ(joint, q[i]);
        const min = displayQ(joint, joint.qMin);
        const max = displayQ(joint, joint.qMax);
        const letter = joint.type === 'R' ? 'θ' : 'd';

        return (
          <div className={`joint is-${joint.type}`} key={i}>
            <div className="joint-head">
              <strong>q{i + 1} = {letter}{i + 1}</strong>
              <output>{fmt(shown.value, 1)} {shown.unit}</output>
            </div>
            <input
              type="range"
              min={min.value}
              max={max.value}
              step={shown.step}
              value={shown.value}
              onChange={e => onChange(i, toSI(joint, Number(e.target.value)))}
            />
            <div className="joint-limits">
              <span>{fmt(min.value, 0)}</span>
              <span>{fmt(max.value, 0)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}