"use client";

import AdminTableCard from "../../components/AdminTableCard";

export default function SeoTab({
  seoTitleBa, setSeoTitleBa,
  seoDescBa, setSeoDescBa,
}) {
  return (
    <div className="space-y-6">
      <AdminTableCard title="SEO / Meta Tags">
        <div className="p-4 space-y-4">
          <p className="text-sm text-neutral-500">
            Meta title and description used in search engines and social previews. Overrides the auto-generated per-month metadata.
          </p>
          <label className="block">
            <span className="mb-1 inline-block text-sm text-neutral-600">Meta title (BA)</span>
            <input
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-2 text-sm"
              value={seoTitleBa}
              onChange={(e) => setSeoTitleBa(e.target.value)}
              placeholder="Leave empty — an automatic title is generated per month"
              maxLength={120}
            />
            <span className="mt-0.5 text-xs text-neutral-400">{seoTitleBa.length}/120 characters</span>
          </label>
          <label className="block">
            <span className="mb-1 inline-block text-sm text-neutral-600">Meta description (BA)</span>
            <textarea
              className="w-full border border-[#D0D0D0] rounded px-2.5 py-2 text-sm resize-none"
              rows={3}
              value={seoDescBa}
              onChange={(e) => setSeoDescBa(e.target.value)}
              placeholder="Leave empty — an automatic description is generated per month"
              maxLength={320}
            />
            <span className="mt-0.5 text-xs text-neutral-400">{seoDescBa.length}/320 characters</span>
          </label>
        </div>
      </AdminTableCard>
    </div>
  );
}
