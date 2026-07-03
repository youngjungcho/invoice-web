import Link from "next/link";

const links = [
  { label: "소개", href: "#" },
  { label: "개인정보처리방침", href: "#" },
  { label: "이용약관", href: "#" },
  { label: "GitHub", href: "https://github.com" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 Next.js Starter Kit. MIT License.
          </p>
          <nav className="flex items-center gap-6">
            {links.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
