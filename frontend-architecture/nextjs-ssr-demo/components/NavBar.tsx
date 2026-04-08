import Link from "next/link";

const LINKS = [
  { href: "/",    label: "Home" },
  { href: "/ssr", label: "SSR"  },
  { href: "/csr", label: "CSR"  },
  { href: "/ssg", label: "SSG"  },
  { href: "/isr", label: "ISR"  },
];

// Shared navigation across all pages.
// This component is a Server Component (no "use client") — it ships no JS.
export default function NavBar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex gap-6 items-center">
      <span className="font-bold text-lg mr-4">Next.js Rendering Demo</span>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="text-sm hover:text-blue-300 transition-colors"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
