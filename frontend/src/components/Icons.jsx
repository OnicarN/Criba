const base = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };

export const Check = ({ color = 'var(--ok)', size = 20 }) => (
  <svg {...base} width={size} height={size} style={{ color }}><path d="M4 10.5l4 4 8-9" /></svg>
);
export const Cross = ({ color = 'var(--bad)', size = 20 }) => (
  <svg {...base} width={size} height={size} style={{ color }}><path d="M5 5l10 10M15 5L5 15" /></svg>
);
export const Info = ({ color = 'var(--primary)', size = 20 }) => (
  <svg {...base} width={size} height={size} style={{ color }}><circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6.2v.1" /></svg>
);
export const ArrowLeft = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><path d="M16 10H4M9 5l-5 5 5 5" /></svg>
);
export const ArrowRight = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><path d="M4 10h12M11 5l5 5-5 5" /></svg>
);
export const Upload = ({ size = 24 }) => (
  <svg {...base} width={size} height={size}><path d="M10 13V3M6 7l4-4 4 4M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" /></svg>
);
export const Trash = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><path d="M3.5 5.5h13M8 5.5V4h4v1.5M5.5 5.5l.8 10.5h7.4l.8-10.5" /></svg>
);
export const Download = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><path d="M10 3v10M6 9l4 4 4-4M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" /></svg>
);
export const Columns = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><rect x="3" y="3.5" width="14" height="13" rx="2" /><path d="M10 3.5v13" /></svg>
);
export const Search = ({ size = 20 }) => (
  <svg {...base} width={size} height={size}><circle cx="9" cy="9" r="5.5" /><path d="M13 13l4 4" /></svg>
);
export const Retry = ({ size = 18 }) => (
  <svg {...base} width={size} height={size}><path d="M4 10a6 6 0 1 0 1.8-4.3M4 3.5v3h3" /></svg>
);
export const Doc = ({ size = 22 }) => (
  <svg {...base} width={size} height={size}><path d="M5 2.5h6.5L15.5 6.5V17a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5zM11 2.5V7h4.5M7.5 11h5M7.5 14h5" /></svg>
);
export const Shield = ({ size = 22 }) => (
  <svg {...base} width={size} height={size}><path d="M10 2.5l6 2.5v4.5c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V5z" /><path d="M7.5 10l2 2 3.5-4" /></svg>
);
export const Chat = ({ size = 22 }) => (
  <svg {...base} width={size} height={size}><path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z" /><path d="M7 8h6M7 10.5h4" /></svg>
);
export const Ranking = ({ size = 22 }) => (
  <svg {...base} width={size} height={size}><path d="M4 16V9M10 16V4M16 16v-5" /></svg>
);
export const Edit = ({ size = 18 }) => (
  <svg {...base} width={size} height={size}><path d="M12.5 4.5l3 3L7 16H4v-3z" /></svg>
);
export const Archive = ({ size = 18 }) => (
  <svg {...base} width={size} height={size}><rect x="3" y="4" width="14" height="4" rx="1" /><path d="M4.5 8v8h11V8M8 11h4" /></svg>
);
