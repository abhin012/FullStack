import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  History,
  Share,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

const renderBody = (text: string) =>
  text
    .replace(/## (.*)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>')
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>'
    )
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, "</p>")
    .replace(/\n(\d+\. .*)/g, '<ol class="list-decimal list-inside my-4"><li>$1</li></ol>');

const QuestionDetail = ({ questionId }: any) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [question, setquestion] = useState<any>(null);
  const [answer, setanswer] = useState<any>();
  const [newanswer, setnewAnswer] = useState("");
  const [isSubmitting, setisSubmitting] = useState(false);
  const [loading, setloading] = useState(true);
  const [privileges, setPrivileges] = useState<any>({});
  const { user } = useAuth();

  const fetchQuestion = async () => {
    try {
      const res = await axiosInstance.get("/question/getallquestion");
      const matchedquestion = res.data.data.find((u: any) => u._id === questionId);
      setanswer(matchedquestion.answer);
      setquestion(matchedquestion);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    if (user) {
      axiosInstance
        .get("/reputation/my-reputation")
        .then((res) => setPrivileges(res.data.privileges))
        .catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    );
  }
  if (!question) {
    return <div className="text-center text-gray-500 mt-4">{t("question.notFound")}</div>;
  }

  const handleVote = async (vote: String) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (question.userid === user._id) {
      toast.error("You can't vote on your own question");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/question/vote/${question._id}`, {
        value: vote,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Vote Updated");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to Vote question");
    }
  };

  const handleVoteAnswer = async (answerId: string, vote: string, answerOwnerId: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (answerOwnerId === user._id) {
      toast.error("You can't vote on your own answer");
      return;
    }
    try {
      const res = await axiosInstance.patch(
        `/question/vote-answer/${question._id}/${answerId}`,
        { value: vote, userid: user?._id }
      );
      if (res.data.data) {
        setquestion(res.data.data);
        setanswer(res.data.data.answer);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to vote on answer");
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/answer/accept/${question._id}/${answerId}`);
      if (res.data.data) {
        setquestion(res.data.data);
        setanswer(res.data.data.answer);
        toast.success("Answer accepted!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to accept answer");
    }
  };

  const handleCloseQuestion = async () => {
    if (!window.confirm("Close this question? No new answers will be accepted.")) return;
    try {
      const res = await axiosInstance.patch(`/question/close/${question._id}`);
      setquestion(res.data.data);
      toast.success("Question closed");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close question");
    }
  };

  const handlebookmark = () => {
    setquestion((prev: any) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
  };

  const handleSubmitanswer = async () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!newanswer.trim()) return;
    setisSubmitting(true);
    try {
      const res = await axiosInstance.post(`/answer/postanswer/${question?._id}`, {
        answerbody: newanswer,
        useranswered: user.name,
        userid: user._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        setanswer(res.data.data.answer);
        toast.success("Answer Uploaded");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to Answer");
    } finally {
      setnewAnswer("");
      setisSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await axiosInstance.delete(`/question/delete/${question._id}`);
      if (res.data.message) {
        toast.success(res.data.message);
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  const handleDeleteanswer = async (id: String) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this answer?")) return;
    try {
      const res = await axiosInstance.delete(`/answer/delete/${question._id}`, {
        data: { answerid: id },
      });
      if (res.data.data) {
        const updateanswer = question.answer.filter((ans: any) => ans._id !== id);
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: updateanswer.length,
          answer: updateanswer,
        }));
        toast.success("deleted successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  const isQuestionAuthor = question.userid === user?._id;

  return (
    <div className="max-w-5xl">
      {/* Question Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">
          {question.questiontitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{t("question.askedOn")} {new Date(question.askedon).toLocaleDateString()}</span>
          </div>
          {question.isClosed && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {t("question.closedBy")} {question.closedBy}
            </span>
          )}
        </div>
      </div>

      {/* Question Content */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Section */}
            <div className="flex sm:flex-col items-center sm:items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-600 hover:text-orange-500"
                onClick={() => handleVote("upvote")}
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
              <span>{question.upvote.length - question.downvote.length}</span>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-600 hover:text-orange-500"
                onClick={() => handleVote("downvote")}
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <div className="flex sm:flex-col gap-2 sm:gap-4 mt-4 sm:mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    question?.isBookmarked ? "text-yellow-500" : "text-gray-600 hover:text-yellow-500"
                  }`}
                  onClick={handlebookmark}
                >
                  <Bookmark className="w-5 h-5" fill={question?.isBookmarked ? "currentColor" : "none"} />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-gray-800">
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              <div className="prose max-w-none mb-6">
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderBody(question.questionbody) }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {question.questiontags.map((tag: any) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                    <Share className="w-4 h-4 mr-1" />
                    {t("question.share")}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                    <Flag className="w-4 h-4 mr-1" />
                    {t("question.flag")}
                  </Button>
                  {privileges.voteToCloseQuestions && !question.isClosed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseQuestion}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      {t("question.closeQuestion")}
                    </Button>
                  )}
                  {isQuestionAuthor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      {t("question.delete")}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    {t("question.askedOn")} {new Date(question.askedon).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/users/${question.userid}`}
                    className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">{question.userposted[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-blue-600 hover:text-blue-800 font-medium">
                        {question.userposted}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {question.answer.length} {question.answer.length !== 1 ? t("question.answersCountPlural") : t("question.answersCount")}
        </h2>
        <div className="space-y-6">
          {[...question.answer]
            .sort((a: any, b: any) => (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0))
            .map((ans: any) => (
              <Card key={ans._id} className={ans.isAccepted ? "border-green-400 border-2" : ""}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Answer voting */}
                    <div className="flex sm:flex-col items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-gray-600 hover:text-orange-500"
                        onClick={() => handleVoteAnswer(ans._id, "upvote", ans.userid)}
                      >
                        <ChevronUp className="w-5 h-5" />
                      </Button>
                      <span>{(ans.upvote?.length || 0) - (ans.downvote?.length || 0)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-gray-600 hover:text-orange-500"
                        onClick={() => handleVoteAnswer(ans._id, "downvote", ans.userid)}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </Button>

                      {isQuestionAuthor && !question.acceptedAnswerId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcceptAnswer(ans._id)}
                          className="mt-3 text-gray-400 hover:text-green-600"
                          title="Accept this answer"
                        >
                          <Check className="w-6 h-6" />
                        </Button>
                      )}
                      {ans.isAccepted && (
                        <div className="mt-3 text-green-600" title="Accepted answer">
                          <Check className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1 p-4 sm:p-6">
                      {ans.isAccepted && (
                        <Badge className="bg-green-100 text-green-700 mb-3">{t("question.acceptedAnswer")}</Badge>
                      )}
                      <div className="prose max-w-none mb-6">
                        <div
                          className="text-gray-800 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderBody(ans.answerbody) }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                            <Share className="w-4 h-4 mr-1" />
                            {t("question.share")}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                            <Flag className="w-4 h-4 mr-1" />
                            {t("question.flag")}
                          </Button>
                          {ans.userid === user?._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteanswer(ans._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash className="w-4 h-4 mr-1" />
                              {t("question.delete")}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">
                            {t("question.askedOn")} {new Date(ans.answeredon).toLocaleDateString()}
                          </span>
                          <Link
                            href={`/users/${ans.userid}`}
                            className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm">{ans.useranswered[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-blue-600 hover:text-blue-800 font-medium">
                                {ans.useranswered}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {question.isClosed ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {t("question.closedNotice")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{t("question.yourAnswer")}</h3>
            <Textarea
              placeholder={t("question.answerPlaceholder")}
              value={newanswer}
              onChange={(e) => setnewAnswer(e.target.value)}
              className="min-h-32 mb-4 resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                onClick={handleSubmitanswer}
                disabled={!newanswer.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? t("question.posting") : t("question.postAnswer")}
              </Button>
              <p className="text-sm text-gray-600">
                By posting your answer, you agree to the{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  terms of service
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionDetail;