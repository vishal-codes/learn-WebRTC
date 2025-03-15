import React, { useState, useRef, useEffect } from "react";

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setChatHistory((prev) => [...prev, { role: "user", content: message }]);
    const response = await fetchGeminiResponse(message);
    setChatHistory((prev) => [...prev, { role: "bot", content: response }]);
    setMessage("");
  };

  const fetchGeminiResponse = async (query: string) => {
    return "Sample response for: " + query;
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg">WebRTC Assistant</h3>
      </div>

      {/* Scrollable area */}
      <div ref={containerRef} className="flex-1 p-4 relative">
        <div className="space-y-4 h-[400px] md:h-[500px] overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg break-words ${
                msg.role === "user"
                  ? "bg-blue-900 ml-auto max-w-[80%]"
                  : "bg-gray-700 max-w-[80%]"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-gray-900 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about WebRTC..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
