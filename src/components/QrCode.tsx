import {useMemo} from 'react';
import {encode} from 'uqr';

/**
 * QR code drawn as one SVG path, with the app mark in the middle (~5% of the area, well inside what
 * Q/H error correction recovers). Rendered locally: works outside the Bilibili SDK.
 * Quiet zone: 4 modules is the spec; anything under 2 stops decoding once screenshots get recompressed.
 */
export default function QrCode({value, size = 96, ecc = 'Q', border = 4}: {value: string; size?: number; ecc?: 'M' | 'Q' | 'H'; border?: number}) {
  const {path, n} = useMemo(() => {
    const {data, size: n} = encode(value, {ecc, border});
    let d = '';
    data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
    return {path: d, n};
  }, [value, ecc, border]);
  const logo = n * .22, at = (n - logo) / 2, bar = logo / 7;
  return <svg className="qr" width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label="二维码">
    <rect width={n} height={n} fill="#fff"/>
    <path d={path} fill="#18191c"/>
    <rect x={at} y={at} width={logo} height={logo} rx={logo * .22} fill="#fff"/>
    <g fill="#fb7299" shapeRendering="geometricPrecision">
      <rect x={at + bar * 1.2} y={at + bar * 1.4} width={bar} height={bar * 4.2} rx={bar * .35}/>
      <rect x={at + bar * 3} y={at + bar * 2.6} width={bar} height={bar * 3} rx={bar * .35} opacity=".7"/>
      <rect x={at + bar * 4.8} y={at + bar * 3.8} width={bar} height={bar * 1.8} rx={bar * .35} opacity=".45"/>
    </g>
  </svg>;
}
