import { SVGProps } from 'react'

export type PupilRegister = (index: number, element: SVGCircleElement | null) => void

interface OwlMascotProps extends SVGProps<SVGSVGElement> {
  onPupilRegister: PupilRegister
}

export function OwlMascot({ onPupilRegister, className, ...svgProps }: OwlMascotProps) {
  return (
    <svg
      viewBox="0 0 360 200"
      className={className ?? 'h-48 w-auto drop-shadow-[0_20px_45px_rgba(15,23,42,0.45)]'}
      role="img"
      aria-labelledby="owl-mascot-title"
      {...svgProps}
    >
      <title id="owl-mascot-title">Asistentes inteligentes de NexoPOS observando</title>
      <defs>
        <linearGradient id="owl-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <g transform="translate(50 30)">
        <Owl
          x={0}
          pupilIndexes={[0, 1]}
          onPupilRegister={onPupilRegister}
        />
        <Owl
          x={160}
          pupilIndexes={[2, 3]}
          onPupilRegister={onPupilRegister}
        />
        <path
          d="M20 150 Q130 180 240 150"
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

interface OwlProps {
  x: number
  pupilIndexes: [number, number]
  onPupilRegister: PupilRegister
}

function Owl({ x, pupilIndexes, onPupilRegister }: OwlProps) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect
        x={0}
        y={20}
        width={120}
        height={120}
        rx={40}
        fill="url(#owl-body)"
        opacity={0.95}
      />
      <path
        d="M60 0 C80 35 110 40 120 60 L120 80 C110 70 80 70 60 40 C40 70 10 70 0 80 L0 60 C10 40 40 35 60 0 Z"
        fill="#1d4ed8"
        opacity={0.65}
      />
      <circle cx={40} cy={80} r={26} fill="#f8fafc" />
      <circle cx={80} cy={80} r={26} fill="#f8fafc" />
      <circle
        cx={40}
        cy={80}
        r={14}
        fill="#0f172a"
        ref={element => onPupilRegister(pupilIndexes[0], element)}
      />
      <circle
        cx={80}
        cy={80}
        r={14}
        fill="#0f172a"
        ref={element => onPupilRegister(pupilIndexes[1], element)}
      />
      <path
        d="M45 110 C60 122 80 122 95 110"
        fill="none"
        stroke="#38bdf8"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={38} cy={70} r={4} fill="#bae6fd" />
      <circle cx={84} cy={70} r={4} fill="#bae6fd" />
      <path
        d="M30 130 Q60 150 90 130"
        fill="#38bdf8"
        opacity={0.35}
      />
      <text
        x={60}
        y={165}
        textAnchor="middle"
        fontSize="14"
        fill="#94a3b8"
      >
        NexoBots
      </text>
    </g>
  )
}
