import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SearchResults() {
  const router = useRouter();
  const { t } = useLanguage();
  const { q } = router.query;
  const [results, setResults] = useState<{ questions: any[]; posts: any[] }>({ questions: [], posts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof q !== "string") return;
    setLoading(true);
    axiosInstance
      .get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  const hasResults = results.questions.length > 0 || results.posts.length > 0;

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">
        {t("search.results")} "{q}"
      </h1>

      {!hasResults ? (
        <p className="text-sm text-gray-500">{t("search.noResults")}</p>
      ) : (
        <div className="space-y-8 max-w-2xl">
          {results.questions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{t("search.questions")}</h2>
              <div className="space-y-3">
                {results.questions.map((q: any) => (
                  <Link
                    key={q._id}
                    href={`/questions/${q._id}`}
                    className="block border-b border-gray-200 pb-3"
                  >
                    <h3 className="text-blue-700 font-medium text-sm hover:underline">
                      {q.questiontitle}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{q.questionbody}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.posts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{t("search.posts")}</h2>
              <div className="space-y-3">
                {results.posts.map((p: any) => (
                  <Link
                    key={p._id}
                    href={`/feed/${p._id}`}
                    className="block border-b border-gray-200 pb-3"
                  >
                    <div className="text-sm text-blue-700 font-medium">{p.author?.name}</div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{p.content}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Mainlayout>
  );
}