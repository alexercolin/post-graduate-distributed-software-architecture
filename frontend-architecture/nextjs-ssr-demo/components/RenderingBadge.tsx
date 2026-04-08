// Color-coded label that makes the rendering strategy immediately obvious.
// Maps strategy names to Tailwind color classes.

type Strategy = "SSR" | "CSR" | "SSG" | "ISR";

const COLORS: Record<Strategy, string> = {
  SSR: "bg-red-100 text-red-800 border-red-300",
  CSR: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SSG: "bg-green-100 text-green-800 border-green-300",
  ISR: "bg-purple-100 text-purple-800 border-purple-300",
};

export default function RenderingBadge({ strategy }: { strategy: Strategy }) {
  return (
    <span
      className={`inline-block border text-xs font-bold uppercase px-3 py-1 rounded-full tracking-widest ${COLORS[strategy]}`}
    >
      {strategy}
    </span>
  );
}
