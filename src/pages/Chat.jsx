import ChatInterface from "../components/chat/ChatInterface";

export default function Chat() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Chat</h1>
        <ChatInterface />
      </div>
    </div>
  );
}