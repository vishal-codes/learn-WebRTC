"use client";

import React, { useState, useRef, useEffect } from "react";
import { generateUsername } from "unique-username-generator";
import io from "socket.io-client";
import ChatWindow from "./ChatWindow";
import { motion, AnimatePresence } from "framer-motion";

const socket = io(process.env.NEXT_PUBLIC_SERVER_URL);

type UserRole = "offerer" | "answerer" | null;
type Step = {
  title: string;
  action: (() => void) | null;
  roles: UserRole[];
};

export default function Playground() {
  const [username] = useState(generateUsername("", 2, 8));
  const [users, setUsers] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>(null);
  const [step, setStep] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string[]>([]);
  const [iceState, setIceState] = useState("disconnected");
  const [streamState, setStreamState] = useState<MediaStream | null>(null);
  const [showPopover, setShowPopover] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  const config = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setStep(1);
      updateStatus("Acquired local media stream");
      setStreamState(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      updateStatus("Error getting media devices");
    }
  };

  const createPeerConnection = () => {
    pc.current = new RTCPeerConnection(config);
    streamState
      ?.getTracks()
      .forEach((track) => pc.current?.addTrack(track, streamState));
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[${role}] ICE Candidate:`, event.candidate);
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          username,
          roomId,
        });
        updateStatus("ICE candidate generated");
      } else {
        console.log(`[${role}] No more ICE candidates.`);
      }
    };

    pc.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        updateStatus("Remote stream received");
      }
    };

    pc.current.oniceconnectionstatechange = () => {
      const state = pc.current?.iceConnectionState || "disconnected";
      setIceState(state);
      updateStatus(`ICE state: ${state}`);

      if (state === "connected") {
        setStep(4);
        updateStatus("Peer connection established!");
      }
    };

    setStep(2);
    updateStatus("Created peer connection");
  };

  const createOffer = async () => {
    if (!pc.current) return;
    try {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      console.log(`[Offerer] SDP Offer:`, offer);
      socket.emit("offer", { offer, username, roomId });
      setStep(3);
      updateStatus("Offer created and sent");
    } catch (error) {
      console.error("Error creating offer:", error);
      updateStatus("Error creating offer");
    }
  };

  const createAnswer = async () => {
    if (!pc.current) return;
    try {
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      console.log(`[Answerer] SDP Answer:`, answer);
      socket.emit("answer", { answer, username, roomId });
      setStep(3);
      updateStatus("Answer created and sent");
    } catch (error) {
      console.error("Error creating answer:", error);
      updateStatus("Error creating answer");
    }
  };

  const createRoom = () => {
    socket.emit("create-room", username, (response: { success: boolean }) => {
      if (response.success) {
        setRoomId(username);
        setIsConnected(true);
        setRole("offerer");
        setUsers([username]);
        updateStatus("Room created");
      } else {
        alert("Room already exists! Try a different username");
      }
    });
  };

  const joinRoom = () => {
    socket.emit(
      "join-room",
      { username, roomId: roomIdInput },
      (response: { success: boolean; users: string[] }) => {
        if (response.success) {
          setRoomId(roomIdInput);
          setIsConnected(true);
          setRole("answerer");
          setUsers(response.users);
          updateStatus("Joined room");
        } else {
          alert("Invalid room ID or room full!");
        }
      }
    );
  };

  const hangUp = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    socket.emit("leave-room", { roomId, username });
    resetConnection();
    updateStatus("Call ended locally");
  };

  const resetConnection = () => {
    setStep(0);
    setUsers([]);
    setRole(null);
    setIceState("disconnected");
    setIsConnected(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const updateStatus = (status: string) => {
    setConnectionStatus((prev) => [
      ...prev.slice(-20),
      `${new Date().toLocaleTimeString()}: ${status}`,
    ]);
  };

  useEffect(() => {
    socket.on("room-updated", ({ users: roomUsers }) => {
      setUsers(roomUsers);
      updateStatus(`Room updated: ${roomUsers.join(", ")}`);
    });

    socket.on("user-left", (leftUser: string) => {
      setUsers((prev) => prev.filter((u) => u !== leftUser));
      updateStatus(`${leftUser} left the room`);
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
      setStep(0);
      setIceState("disconnected");
      updateStatus("Peer connection closed due to user leaving");
    });

    socket.on("offer", async (data: { offer: RTCSessionDescriptionInit }) => {
      if (role === "answerer" && pc.current) {
        try {
          await pc.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          console.log(`[Answerer] Received offer:`, data.offer);
          updateStatus("Received remote offer - create answer now");
          setStep(3);
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });

    socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      if (role === "offerer" && pc.current) {
        try {
          await pc.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log(`[Offerer] Received answer:`, data.answer);
          updateStatus("Answer received - connection pending");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });

    socket.on(
      "ice-candidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        if (pc.current) {
          try {
            await pc.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
            console.log(`[${role}] Added ICE candidate:`, data.candidate);
            updateStatus("Added remote ICE candidate");
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        }
      }
    );

    return () => {
      socket.off("room-updated");
      socket.off("user-left");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      setShowPopover(true);
    };
  }, [role]);

  const steps: Step[] = [
    { title: "1. Get Media", action: getMedia, roles: ["offerer", "answerer"] },
    {
      title: "2. Create Peer Connection",
      action: createPeerConnection,
      roles: ["offerer", "answerer"],
    },
    { title: "3. Create Offer", action: createOffer, roles: ["offerer"] },
    { title: "4. Create Answer", action: createAnswer, roles: ["answerer"] },
    {
      title: `5. Connection: ${iceState}`,
      action: null,
      roles: ["offerer", "answerer"],
    },
  ];

  const renderStepButton = (stepConfig: Step, index: number) => {
    const isActive = step === index;
    const isRoleValid = role && stepConfig.roles.includes(role);
    const isEnabled = index < 4 ? isRoleValid && index <= step : true;

    return (
      <button
        key={index}
        onClick={stepConfig.action || undefined}
        className={`w-full p-2 rounded 
          ${isActive ? "bg-blue-600" : "bg-gray-700"}
          ${index < 4 && !isEnabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isRoleValid ? "border-l-4 border-blue-500" : ""}`}
        disabled={index < 4 && !isEnabled}
      >
        <div className="flex items-center justify-between">
          <span className="text-left flex-1">{stepConfig.title}</span>
          <div className="flex justify-end gap-1 flex-shrink-0">
            {stepConfig.roles.includes("offerer") && (
              <span className="text-xs mr-2 text-blue-300">Offerer</span>
            )}
            {stepConfig.roles.includes("answerer") && (
              <span className="text-xs text-green-300">Answerer</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-auto bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans">
      {!isConnected ? (
        <div className="w-full md:h-screen p-8 flex flex-col md:flex-row items-center justify-center">
          <div className="w-full md:w-1/3 bg-gray-700 rounded-lg p-6 mb-4 md:mb-0 md:mr-4">
            <h2 className="text-2xl mb-4">Steps to Use WebRTC Playground</h2>
            <ol className="list-decimal list-inside space-y-2 text-white">
              <li>
                Create a new room by clicking the "Create New Room" button.
              </li>
              <li>Open the same app in another tab or window.</li>
              <li>
                In the new tab, enter the Room ID from the first tab in the
                "Enter Room ID" field.
              </li>
              <li>Click "Join Existing Room".</li>
              <li>Follow the connection steps shown in the room.</li>
            </ol>
          </div>
          <div className="md:ml-20 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl mb-4">Welcome {username}</h2>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <button
                  onClick={createRoom}
                  className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
                >
                  Create New Room
                </button>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="Enter Room ID"
                    className="w-full bg-gray-600 rounded px-3 py-2"
                  />
                  <button
                    onClick={joinRoom}
                    className="w-full bg-purple-600 py-2 rounded hover:bg-purple-700"
                  >
                    Join Existing Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 border-r border-gray-700 p-4 flex flex-col order-1 md:order-none">
            <div className="mb-6">
              <button
                onClick={hangUp}
                className="w-full bg-red-600 py-2 rounded hover:bg-red-700 mb-4"
              >
                End Call
              </button>
              <h3 className="text-lg mb-2">
                Participants (Room ID:{" "}
                <span className="text-blue-400 break-all">{roomId}</span>)
              </h3>
              <div className="space-y-2 mb-4 md:flex md:justify-between">
                {users.map((user, i) => (
                  <div
                    key={user}
                    className={`p-2 rounded ${
                      i === 0 ? "bg-blue-900" : "bg-green-600"
                    } md:!mt-[0]`}
                  >
                    {user} {i === 0 ? "(offerer)" : "(answerer)"}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-800 rounded-lg p-2">
                  <h3 className="text-lg mb-2">Local Video</h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="w-full h-32 md:h-48 rounded-lg bg-black"
                  />
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <h3 className="text-lg mb-2">Remote Video</h3>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="w-full h-32 md:h-48 rounded-lg bg-black"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 border-r border-gray-700 p-4 flex flex-col order-2 md:order-none">
            <div className="bg-gray-800 rounded-lg p-4 relative">
              <h2 className="text-xl mb-4">
                {role === "offerer" ? "Offerer" : "Answerer"} Steps
              </h2>
              <div className="space-y-2">{steps.map(renderStepButton)}</div>
              <AnimatePresence>
                {showPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.6 }}
                    className="
              absolute left-3/2 transform -translate-x-1/2 top-full mt-2 w-64
              bg-gray-700 text-white p-4 rounded shadow-lg z-10
            "
                  >
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-0 h-0"
                      style={{
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderBottom: "8px solid #374151",
                      }}
                    />
                    <p className="mb-2 text-sm">
                      You are the {role === "offerer" ? "Offerer" : "Answerer"}.
                      Click each step in sync with the
                      {role === "offerer" ? " Answerer" : " Offerer"}!
                    </p>
                    <button
                      onClick={() => setShowPopover(false)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mt-4 flex-1">
              <h3 className="text-lg mb-2">Connection Status</h3>
              <div className="bg-gray-900 p-2 rounded h-64 overflow-y-auto">
                {connectionStatus.map((status, i) => (
                  <div key={i} className="text-xs text-gray-400">
                    {status}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:h-[88vh] md:w-1/3 p-4 order-3 md:order-none">
            <ChatWindow />
          </div>
        </div>
      )}
    </div>
  );
}
