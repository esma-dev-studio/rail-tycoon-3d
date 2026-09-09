import { READINGS } from '../data/development';

const parts = new RegExp(`(${Object.keys(READINGS).join('|')})`, 'g');
export function Reading({ text }: { text: string }) {
  return <>{text.split(parts).map((part, i) => READINGS[part] ? <ruby key={i}>{part}<rt>{READINGS[part]}</rt></ruby> : part)}</>;
}
