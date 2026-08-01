import Mainlayout from "@/layout/Mainlayout";
import Link from "next/link";

const PRODUCTS = [
  { name: "Q&A", desc: "Ask questions, post answers, accept the best one, and build reputation through votes.", href: "/questions" },
  { name: "Community Feed", desc: "Share updates, code snippets, images, and project showcases with the community.", href: "/feed" },
  { name: "Reputation System", desc: "Earn points for contributions, unlock privileges, and transfer reputation to others.", href: "/users" },
  { name: "Premium Plans", desc: "Upgrade your account for higher daily limits, badges, and priority visibility.", href: "/pricing" },
];

export default function Products() {
  return (
    <Mainlayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRODUCTS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="border border-gray-200 rounded p-4 hover:border-blue-400 transition-colors"
            >
              <h2 className="font-semibold text-blue-700 mb-1">{p.name}</h2>
              <p className="text-sm text-gray-600">{p.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </Mainlayout>
  );
}