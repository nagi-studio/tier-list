import {useMemo} from 'react';
import {encode} from 'uqr';

/**
 * QR code drawn as one SVG path, with the app mark in the middle. Uses the highest error correction (H, ~30%)
 * so the center logo (~5% of the area) never breaks scanning. Rendered locally: works outside the Bilibili SDK.
 */
export default function QrCode({value, size = 96}: {value: string; size?: number}) {
  const {path, n} = useMemo(() => {
    // A 2-module quiet zone: with 1 module, downscaled or recompressed screenshots stop decoding.
    const {data, size: n} = encode(value, {ecc: 'H', border: 2});
    let d = '';
    data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
    return {path: d, n};
  }, [value]);
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
