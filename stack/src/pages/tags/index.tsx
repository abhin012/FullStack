import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TagsList() {
  const { t } = useLanguage();
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/question/getallquestion")
      .then((res) => {
        const counts: Record<string, number> = {};
        res.data.data.forEach((q: any) => {
          (q.questiontags || []).forEach((tag: string) => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        });
        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        setTags(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-4">{t("tags.title")}</h1>
      {tags.length === 0 ? (
        <div className="text-gray-500">{t("tags.noTags")}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/questions?tags=${tag.name}`}
              className="border border-gray-200 rounded p-3 hover:border-blue-400"
            >
              <div className="text-blue-700 text-sm font-medium">{tag.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {tag.count} {tag.count !== 1 ? t("tags.questions") : t("tags.question")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Mainlayout>
  );
}