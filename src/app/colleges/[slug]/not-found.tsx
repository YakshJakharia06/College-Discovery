import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold">College not found</h2>
      <p className="text-sm text-gray-500">
        The college you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/colleges" className="text-brand-700 underline">
        Back to colleges
      </Link>
    </div>
  );
}
