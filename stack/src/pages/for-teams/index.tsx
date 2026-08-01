import Mainlayout from "@/layout/Mainlayout";

export default function ForTeams() {
  return (
    <Mainlayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">CodeQuest for Teams</h1>
        <p className="text-gray-700 leading-relaxed mb-4">
          Give your team a private, searchable knowledge base alongside the public community —
          reduce repeated questions, capture tribal knowledge, and keep track of who knows what.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Admin moderation tools to keep content accurate and on-topic</li>
          <li>Reputation-based privileges so trusted members can self-moderate</li>
          <li>Full login activity and session management for account security</li>
          <li>Multi-language support for distributed teams</li>
        </ul>
      </div>
    </Mainlayout>
  );
}