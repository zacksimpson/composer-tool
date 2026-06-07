import Svg, { Path } from "react-native-svg";
import { n } from "@/utils/scaling";

interface PlusEditIconProps {
  color: string;
  size?: number;
}

export function PlusEditIcon({ color, size = 40 }: PlusEditIconProps) {
  const dim = n(size);
  return (
    <Svg fill="none" height={dim} viewBox="0 0 44 44" width={dim}>
      {/* Pencil body */}
      <Path
        d="M6 32L4 40L12 38L34 16L26 8L6 32Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <Path
        d="M26 8L34 16"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      {/* Plus sign bottom-right */}
      <Path
        d="M36 30V38M32 34H40"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </Svg>
  );
}
