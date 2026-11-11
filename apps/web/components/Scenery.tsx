import { starPath } from '@childgpt/shared';

// Декорации неба. Чистый SVG/CSS — без картинок, мгновенно грузится и чётко на любом экране.

export function Moon({ className = '' }: { className?: string }) {
  return (
    <div className={`moon ${className}`} aria-hidden="true">
      <span className="moon__crater moon__crater--1" />
      <span className="moon__crater moon__crater--2" />
      <span className="moon__crater moon__crater--3" />
    </div>
  );
}

export function Clouds({ tint = 'rgba(255,255,255,0.9)', className = '' }: { tint?: string; className?: string }) {
  return (
    <svg className={`clouds ${className}`} viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
      <path
        className="clouds__back"
        fill={tint}
        opacity="0.18"
        d="M0 150 C 80 90 180 110 230 140 C 280 80 400 70 450 130 C 520 90 610 100 650 145 C 720 80 850 80 900 140 C 960 100 1060 100 1100 150 C 1160 90 1300 90 1340 150 C 1380 120 1420 130 1440 140 L1440 220 L0 220 Z"
      />
      <path
        className="clouds__mid"
        fill={tint}
        opacity="0.32"
        d="M0 175 C 60 135 150 140 190 170 C 250 120 360 125 400 172 C 470 135 560 140 600 178 C 680 125 790 130 830 175 C 900 140 1000 140 1040 180 C 1110 130 1230 135 1270 178 C 1330 150 1400 155 1440 170 L1440 220 L0 220 Z"
      />
      <path
        className="clouds__front"
        fill={tint}
        opacity="0.55"
        d="M0 200 C 70 168 140 172 180 196 C 240 160 330 165 370 198 C 430 170 520 172 560 202 C 630 165 730 168 770 200 C 840 172 930 172 970 204 C 1040 166 1150 170 1190 202 C 1260 176 1370 178 1440 196 L1440 220 L0 220 Z"
      />
    </svg>
  );
}

export function CosmosScene({ className = '' }: { className?: string }) {
  return (
    <svg className={`scene scene--cosmos ${className}`} viewBox="0 0 600 260" aria-hidden="true">
      <defs>
        <radialGradient id="planetA" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffd9a0" />
          <stop offset="100%" stopColor="#e2834f" />
        </radialGradient>
        <radialGradient id="planetB" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#b9f0ff" />
          <stop offset="100%" stopColor="#3f8fd6" />
        </radialGradient>
      </defs>
      <g className="scene__float">
        <ellipse cx="470" cy="80" rx="62" ry="14" fill="none" stroke="#ffe7b8" strokeOpacity="0.7" strokeWidth="5" transform="rotate(-16 470 80)" />
        <circle cx="470" cy="80" r="38" fill="url(#planetA)" />
        <path d="M410 92 Q470 70 530 66" stroke="#ffe7b8" strokeOpacity="0.9" strokeWidth="5" fill="none" transform="rotate(-16 470 80)" />
      </g>
      <circle className="scene__float scene__float--slow" cx="110" cy="70" r="22" fill="url(#planetB)" />
      <g className="scene__rocket">
        <path d="M300 150 C 300 110 318 88 330 80 C 342 88 360 110 360 150 Z" fill="#f4f6ff" />
        <circle cx="330" cy="118" r="10" fill="#7fd6ff" stroke="#24407e" strokeWidth="4" />
        <path d="M300 150 L 286 172 L 304 166 Z M360 150 L 374 172 L 356 166 Z" fill="#ff7f7f" />
        <path d="M312 150 L 348 150 L 342 164 L 318 164 Z" fill="#c9d2f2" />
        <path className="scene__flame" d="M320 166 Q330 196 340 166 Z" fill="#ffcf6e" />
      </g>
      {[
        [60, 180, 5],
        [200, 40, 4],
        [540, 190, 5],
        [250, 210, 3],
        [400, 30, 3],
      ].map(([x, y, r], i) => (
        <path key={i} className="scene__twinkle" style={{ animationDelay: `${i * 0.7}s` }} d={starPath(x!, y!, r! * 2, r! * 0.8)} fill="#fff3c4" />
      ))}
    </svg>
  );
}

export function CastleScene({ className = '' }: { className?: string }) {
  return (
    <svg className={`scene scene--castle ${className}`} viewBox="0 0 600 260" aria-hidden="true">
      <defs>
        <linearGradient id="castle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b3f97" />
          <stop offset="100%" stopColor="#2c1450" />
        </linearGradient>
      </defs>
      <g fill="url(#castle)">
        <path d="M150 260 L150 150 L170 150 L170 132 L184 132 L184 150 L206 150 L206 132 L220 132 L220 150 L240 150 L240 260 Z" />
        <path d="M360 260 L360 150 L380 150 L380 132 L394 132 L394 150 L416 150 L416 132 L430 132 L430 150 L450 150 L450 260 Z" />
        <path d="M220 260 L220 120 L380 120 L380 260 Z" />
        <path d="M262 120 L262 70 L338 70 L338 120 Z" />
        <path d="M250 70 L300 18 L350 70 Z" />
        <path d="M140 150 L195 96 L250 150 Z" />
        <path d="M350 150 L405 96 L460 150 Z" />
        <path d="M280 260 L280 205 Q300 182 320 205 L320 260 Z" fill="#1a0b33" />
      </g>
      <path d="M300 18 L300 0 L322 6 L300 12 Z" fill="#ffb8d9" />
      {[
        [290, 88],
        [310, 88],
        [182, 176],
        [412, 176],
        [250, 150],
        [350, 150],
      ].map(([x, y], i) => (
        <rect key={i} className="scene__window" style={{ animationDelay: `${i * 0.9}s` }} x={x} y={y} width="10" height="16" rx="5" fill="#ffe29a" />
      ))}
      {[
        [80, 60, 5],
        [520, 50, 6],
        [470, 140, 3],
        [110, 150, 3],
      ].map(([x, y, r], i) => (
        <path key={i} className="scene__twinkle" style={{ animationDelay: `${i * 0.6}s` }} d={starPath(x!, y!, r! * 2, r! * 0.8)} fill="#fff2c9" />
      ))}
    </svg>
  );
}
