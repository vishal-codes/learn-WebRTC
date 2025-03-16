import React, { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import axios from "axios";
import Markdown from "react-markdown";

export default function ChatWindow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<
    Array<{ role: string; parts: { text: string }[] }>
  >([]);
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const host = process.env.NEXT_PUBLIC_SERVER_URL;
  const url = host + "/chat";

  const handleSendMessage = async () => {
    if (!inputRef?.current?.value.trim()) {
      alert("Please enter a message");
      return;
    }
    handleNonStreamingChat(inputRef.current.value);
  };

  const handleNonStreamingChat = async (message: string) => {
    const chatData = {
      chat: message,
      history: data,
    };
    const ndata = [...data, { role: "user", parts: [{ text: message }] }];
    flushSync(() => {
      setData(ndata);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.placeholder = "Thinking...";
      }
      setWaiting(true);
    });

    scrollToBottom();

    let headerConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const fetchData = async () => {
      var modelResponse = "";
      try {
        console.log(chatData);
        const response = await axios.post(url, chatData, headerConfig);
        modelResponse = response.data.text;
      } catch (error) {
        modelResponse = "Error occurred, please try again later.";
      } finally {
        const updatedData = [
          ...ndata,
          { role: "model", parts: [{ text: modelResponse }] },
        ];
        flushSync(() => {
          setData(updatedData);
          if (inputRef.current) {
            inputRef.current.placeholder = "Ask about WebRTC...";
          }
          setWaiting(false);
        });
        scrollToBottom();
      }
    };
    fetchData();
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg ">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg">WebRTC Assistant</h3>
      </div>
      <div className="px-3 pt-2 space-y-4 h-[400px] md:h-[100%] overflow-y-scroll">
        {data.map((element, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg break-words ${
              element.role === "user"
                ? "bg-blue-900 ml-auto max-w-[80%] w-fit"
                : "bg-gray-700 max-w-[80%]"
            }`}
          >
            <pre className="overflow-x-auto whitespace-pre-wrap">
              <Markdown>{element.parts[0].text}</Markdown>
            </pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-lg">
        <div className="flex gap-2">
          <input
            style={{ width: "100px" }}
            type="text"
            ref={inputRef}
            className="flex-1 bg-gray-900 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={waiting ? "Thinking..." : "Ask about WebRTC..."}
          />
          <button
            disabled={waiting}
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
