import Mainlayout from "@/layout/Mainlayout";

export default function About() {
  return (
    <Mainlayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">About CodeQuest</h1>
        <p className="text-gray-700 leading-relaxed mb-4">
          CodeQuest is a community platform for developers to ask and answer technical questions,
          share updates and projects, and build reputation by helping others. It combines a
          Q&A knowledge base with a social feed, so you can get unstuck on a specific problem and
          also follow what the people you learn from are building.
        </p>
        <h2 className="text-lg font-semibold mt-6 mb-2">What you can do here</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Ask and answer questions, with accepted-answer and voting-based reputation</li>
          <li>Share technical updates, project showcases, images, and code snippets in the feed</li>
          <li>Follow other members and build a personalized feed</li>
          <li>Earn reputation and unlock community privileges as you contribute</li>
          <li>Use the platform in your preferred language, with secure verification for changes</li>
        </ul>
      </div>
    </Mainlayout>
  );
}