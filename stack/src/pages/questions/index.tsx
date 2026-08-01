import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function QuestionsList() {
  const router = useRouter();
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/question/getallquestion")
      .then((res) => setQuestions(res.data.data))
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

  const { tags, minAnswers, sort } = router.query;
  const activeTags = typeof tags === "string" ? tags.split(",").filter(Boolean) : [];
  const activeMinAnswers = minAnswers ? Number(minAnswers) : 0;
  const activeSort = typeof sort === "string" ? sort : "newest";

  let filtered = questions;

  if (activeTags.length > 0) {
    filtered = filtered.filter((q) =>
      q.questiontags?.some((tg: string) => activeTags.includes(tg.toLowerCase()))
    );
  }

  if (activeMinAnswers > 0) {
    filtered = filtered.filter((q) => (q.noofanswer || 0) >= activeMinAnswers);
  }

  filtered = [...filtered].sort((a, b) => {
    if (activeSort === "oldest") return new Date(a.askedon).getTime() - new Date(b.askedon).getTime();
    if (activeSort === "mostVoted") return (b.upvote?.length || 0) - (a.upvote?.length || 0);
    if (activeSort === "mostAnswered") return (b.noofanswer || 0) - (a.noofanswer || 0);
    return new Date(b.askedon).getTime() - new Date(a.askedon).getTime();
  });

  const hasActiveFilter = activeTags.length > 0 || activeMinAnswers > 0 || (sort && sort !== "newest");

  return (
    <Mainlayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t("questions.allQuestions")}</h1>
        {hasActiveFilter && (
          <Link href="/questions" className="text-xs text-blue-600 hover:underline">
            {t("questions.clearFilters")}
          </Link>
        )}
      </div>

      {hasActiveFilter && (
        <div className="text-xs text-gray-500 mb-3">
          {t("questions.showing")} {filtered.length} {t("questions.of")} {questions.length}{" "}
          {t("questions.allQuestions").toLowerCase()}
          {activeTags.length > 0 && <> · tags: {activeTags.join(", ")}</>}
          {activeMinAnswers > 0 && (
            <>
              {" "}
              · min {activeMinAnswers} {t("questions.answers")}
            </>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-gray-500">{t("questions.noQuestions")}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <Link
              key={q._id}
              href={`/questions/${q._id}`}
              className="block border-b border-gray-200 pb-3"
            >
              <h2 className="text-blue-700 font-medium text-sm hover:underline">
                {q.questiontitle}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {q.upvote?.length || 0} {t("questions.upvotes")} · {q.noofanswer || 0}{" "}
                {t("questions.answers")} · {t("questions.asked")}{" "}
                {new Date(q.askedon).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-1">
                {q.questiontags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Mainlayout>
  );
}