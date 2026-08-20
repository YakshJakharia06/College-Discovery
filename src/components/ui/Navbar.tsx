import Link from "next/link";
import { getAuthUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function Navbar() {
  const userId = await getAuthUserId();
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    : null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-700">
          CollegeFind
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/colleges" className="text-gray-700 hover:text-brand-700">
            Colleges
          </Link>
          <Link href="/compare" className="text-gray-700 hover:text-brand-700">
            Compare
          </Link>
          <Link href="/predictor" className="text-gray-700 hover:text-brand-700">
            Predictor
          </Link>
          {user ? (
            <>
              <Link href="/saved" className="text-gray-700 hover:text-brand-700">
                Saved
              </Link>
              <span className="text-gray-500">Hi, {user.name.split(" ")[0]}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-brand-700">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
