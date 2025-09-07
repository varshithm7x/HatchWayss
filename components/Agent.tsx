/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { AgentProps } from "@/types";
import { useRouter } from "next/navigation";
import { vapi } from "@/services/vapi/vapi.sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Code, Activity } from "lucide-react";
import {
  emotionDetectionService,
  EmotionData,
  EmotionLabel,
} from "@/services/emotion/emotion-detection.service";
import { useCallLogs } from "@/hooks/useCallLogs";
import { toast } from "sonner";
import { Message } from "@/types/vapi";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";

enum CallStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  emotionData?: EmotionData;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotionData?: EmotionData;
}

interface DSAQuestion {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  problem: string;
  constraints?: string[];
  examples?: { input: string; output: string; explanation?: string }[];
}

const ASSISTANT = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

function Agent({ userName, userId, type }: AgentProps) {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<DSAQuestion | null>(
    null
  );
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [fullAssistantMessage, setFullAssistantMessage] = useState<string>("");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use emotion detection hook
  const {
    currentEmotion,
    emotionHistory,
    addEmotionReading,
    clearEmotions,
    isProcessing: isProcessingEmotion,
  } = useEmotionDetection({
    callId: currentCallId || undefined,
    enableRealTime: true,
  });

  const [showEmotionOverlay, setShowEmotionOverlay] = useState(true);
  // Add call logs hook
  const { saveCallLog } = useCallLogs(userId);

  const parseQuestionFromMessage = (message: string): DSAQuestion | null => {
    try {
      const lines = message.split("\n");
      let title = "";
      let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
      let problem = "";
      let constraints: string[] = [];

      let currentSection = "";

      // Look for question patterns in the full message
      const questionPatterns = [
        /(?:problem|question|challenge|task):\s*(.+?)(?:\n|$)/i,
        /(?:write|implement|create|solve)\s+(?:a|an)?\s*(.+?)(?:\n|\.)/i,
        /(?:given|you have|consider)\s+(.+?)(?:\n|\.)/i,
      ];

      for (const pattern of questionPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          title =
            match[1].trim().slice(0, 80) + (match[1].length > 80 ? "..." : "");
          break;
        }
      }

      // Extract difficulty if mentioned
      const difficultyMatch = message.match(
        /(easy|medium|hard|beginner|intermediate|advanced)/i
      );
      if (difficultyMatch) {
        const diff = difficultyMatch[1].toLowerCase();
        if (diff === "easy" || diff === "beginner") difficulty = "Easy";
        else if (diff === "hard" || diff === "advanced") difficulty = "Hard";
        else difficulty = "Medium";
      }

      // Use the full message as problem description, cleaned up
      problem = message
        .replace(/^(problem|question|challenge|task):\s*/i, "")
        .replace(/\b(easy|medium|hard|beginner|intermediate|advanced)\b/gi, "")
        .trim();

      // Look for constraints
      const constraintMatch = message.match(/constraints?:\s*(.+?)(?:\n\n|$)/i);
      if (constraintMatch) {
        constraints = constraintMatch[1]
          .split(/[•\-\n]/)
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
          .slice(0, 5);
      }

      // If we have a meaningful title and problem, return the question
      if (title && problem.length > 20) {
        return {
          title: title || "Coding Problem",
          difficulty,
          problem: problem.slice(0, 500) + (problem.length > 500 ? "..." : ""),
          constraints: constraints.length > 0 ? constraints : undefined,
        };
      }

      // Fallback: if it's a long message with coding keywords, treat as problem
      if (message.length > 50) {
        const codingKeywords = [
          "array",
          "string",
          "tree",
          "graph",
          "algorithm",
          "function",
          "return",
          "implement",
        ];
        const hasKeywords = codingKeywords.some((keyword) =>
          message.toLowerCase().includes(keyword)
        );

        if (hasKeywords) {
          return {
            title: "Programming Problem",
            difficulty: "Medium",
            problem:
              message.slice(0, 400) + (message.length > 400 ? "..." : ""),
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error parsing question:", error);
      return null;
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isLoadingChat) return;

    setIsLoadingChat(true);
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");

    try {
      // When call is active, inject the solution into the conversation
      if (callStatus === CallStatus.ACTIVE) {
        // Add the solution to the conversation context that the assistant can see
        const solutionPrompt = `USER PROVIDED DSA SOLUTION VIA TEXT: "${message}". Please acknowledge this solution and provide feedback during the interview.`;

        try {
          // Try to send via Vapi's message system
          vapi.send({
            type: "add-message",
            message: {
              role: "user",
              content: solutionPrompt,
            },
          });
        } catch (vapiError) {
          console.log(
            "Direct Vapi send failed, solution logged locally:",
            vapiError
          );
        }

        // Add success message to chat
        const successMessage: ChatMessage = {
          role: "assistant",
          content:
            "✅ Solution submitted! The interviewer will analyze your approach.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, successMessage]);

        // Store the solution in the component state for potential later use
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `[TEXT SOLUTION]: ${message}`,
          },
        ]);
      } else {
        // When call is not active, just acknowledge
        const offlineMessage: ChatMessage = {
          role: "assistant",
          content:
            "✅ Solution noted. Start a voice interview to get real-time feedback.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, offlineMessage]);
      }
    } catch (error) {
      console.error("Error processing solution:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "✅ Solution recorded successfully.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const getDifficultyColor = (difficulty: "Easy" | "Medium" | "Hard") => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 bg-green-100";
      case "Medium":
        return "text-orange-600 bg-orange-100";
      case "Hard":
        return "text-red-600 bg-red-100";
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Global error handler to suppress Vapi meeting end errors
  useEffect(() => {
    const originalConsoleError = console.error;

    const filteredConsoleError = (...args: any[]) => {
      const message = args.join(" ");

      // Filter out Vapi meeting end errors
      if (
        message.includes("Meeting ended due to ejection") ||
        message.includes("Meeting has ended") ||
        message.includes("call-end") ||
        message.includes("ejection")
      ) {
        // Don't log these errors as they're expected behavior
        return;
      }

      // Log all other errors normally
      originalConsoleError.apply(console, args);
    };

    // Handle unhandled promise rejections from Vapi
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason || "";

      if (
        message.includes("Meeting ended due to ejection") ||
        message.includes("Meeting has ended") ||
        message.includes("call-end") ||
        message.includes("ejection")
      ) {
        // Prevent the error from being logged
        event.preventDefault();
        return;
      }
    };

    console.error = filteredConsoleError;
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      // Restore original console.error when component unmounts
      console.error = originalConsoleError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      console.log("Call started - will try to get call ID from Vapi");
    };

    const onCallEnd = async () => {
      setCallStatus(CallStatus.FINISHED);
      setShowChat(false);
      setChatMessages([]);
      setFullAssistantMessage("");

      // Use the stored call ID from when the call started
      let callId = currentCallId;

      // If no stored call ID, try to get it from Vapi's internal state
      if (!callId) {
        try {
          // Try to access the call ID from Vapi's internal state
          const vapiCall = (vapi as any)?._call;
          callId = vapiCall?.id || vapiCall?.callId;
          console.log("Retrieved call ID from Vapi internal state:", callId);
        } catch (error) {
          console.warn("Could not retrieve call ID from Vapi state:", error);
        }
      }

      if (!callId) {
        console.log("NO CALL ID AVAILABLE - currentCallId is:", currentCallId);
        toast.error("No call ID available for saving");
        setCurrentCallId(null);
        return;
      }

      // Save call log when call ends
      if (callId && userId) {
        setIsSavingCall(true);
        toast.info("Saving call data...", { duration: 2000 });

        try {
          // Add delay to ensure Vapi has processed the call data
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const res = await saveCallLog(callId);
          console.log(`Call log saved for call: ${callId}`);
          toast.success("Call data saved successfully!");
        } catch (error) {
          console.error("Error saving call log:", error);
          toast.error("Failed to save call data. Please try again.");
        } finally {
          setIsSavingCall(false);
          setCurrentCallId(null); // Clear the call ID after processing
        }
      } else {
        setCurrentCallId(null); // Clear even if not saving
      }
    };

    const onMessage = async (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const timestamp = Date.now();

        // Process emotion detection for user messages using the hook
        if (message.role === "user" && message.transcript.trim().length > 10) {
          try {
            await addEmotionReading(message.transcript, timestamp);
          } catch (error) {
            console.error("Error processing emotion:", error);
          }
        }

        const newMessage: SavedMessage = {
          role: message.role as "user" | "assistant",
          content: message.transcript,
          timestamp,
          emotionData: currentEmotion || undefined,
        };

        setMessages((prev) => [...prev, newMessage]);

        // Build full assistant message by concatenating messages
        if (message.role === "assistant") {
          setFullAssistantMessage((prev) => {
            const updated = prev + " " + message.transcript;

            // Check if the combined message contains DSA-related keywords
            const dsaKeywords = [
              "dsa",
              "algorithm",
              "data structure",
              "coding",
              "problem",
              "solve",
              "function",
              "array",
              "string",
              "tree",
              "graph",
              "linked list",
              "stack",
              "queue",
              "write a",
              "implement",
              "return",
              "leetcode",
              "write code",
              "solution",
              "complexity",
            ];
            const containsDSA = dsaKeywords.some((keyword) =>
              updated.toLowerCase().includes(keyword)
            );

            if (containsDSA) {
              setShowChat(true);
              // Try to parse question from the full message
              const questionData = parseQuestionFromMessage(updated);
              if (questionData) {
                setCurrentQuestion(questionData);
              }
            }

            return updated;
          });
        } else {
          // Reset full message when user speaks
          setFullAssistantMessage("");
        }
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onErr = (e: Error) => {
      // Filter out unnecessary "Meeting ended due to ejection" errors
      if (e.message && e.message.includes("Meeting ended due to ejection")) {
        // This is a normal call end event, don't log as error
        console.log("Call ended normally");
        return;
      }
      // Only log actual errors that need attention
      console.log("Vapi Error:", e.message || e);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-end", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onErr);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-end", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onErr);
    };
  }, [saveCallLog, userId, router, currentCallId]);

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED && !isSavingCall) {
      // Add a small delay before redirecting to allow cleanup
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [callStatus, isSavingCall, router]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      const callData = await vapi.start(ASSISTANT, {
        variableValues: {
          username: userName,
          userId: userId,
          dsaChatEnabled: "true",
        },
      });

      // Try to extract call ID from the response
      const callId = callData?.id || callData?.call?.id;
      if (callId) {
        setCurrentCallId(callId);
        console.log("Call started with ID captured:", callId);
      } else {
        console.warn("No call ID in start response:", callData);
        // Set a timeout to try to get the call ID after the call is established
        setTimeout(() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vapiCall = (vapi as any)?._call;
            const fallbackCallId = vapiCall?.id || vapiCall?.callId;
            if (fallbackCallId && !currentCallId) {
              setCurrentCallId(fallbackCallId);
              console.log(
                "Call ID captured via fallback method:",
                fallbackCallId
              );
            }
          } catch (error) {
            console.warn("Failed to capture call ID via fallback:", error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus(CallStatus.INACTIVE);
      toast.error("Failed to start call. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    try {
      setCallStatus(CallStatus.FINISHED);
      setShowChat(false);
      setChatMessages([]);
      setFullAssistantMessage("");

      // Gracefully stop the call
      await vapi.stop();
    } catch (error) {
      // Suppress expected disconnection errors
      if (error instanceof Error && !error.message.includes("Meeting ended")) {
        console.log("Disconnect error:", error.message);
      }
    }
  };

  const latestMsg = messages[messages.length - 1]?.content;

  const isInativeOrFinished =
    callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE;

  return (
    <div className="fixed inset-0 flex bg-dark-100">
      {/* Interview Area - extends to red shaded area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-100">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row gap-8 items-center justify-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center">
                <Image
                  src={"/ai-avatar.png"}
                  alt="ai-avatar"
                  width={80}
                  height={80}
                  className="object-cover rounded-full"
                />
                {isSpeaking && (
                  <div className="absolute inset-0 border-4 border-primary-200 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white">Hatchways AI</h3>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-gradient-to-br from-dark-200 to-dark-300 rounded-full flex items-center justify-center border-2 border-primary-200/30">
              <Image
                src={"/user-avatar.png"}
                alt="user-avatar"
                width={80}
                height={80}
                className="object-cover rounded-full"
              />
            </div>
            <h3 className="text-xl font-semibold text-white">{userName}</h3>
          </div>
        </div>

        {/* Transcript */}
        {messages?.length > 0 && (
          <div className="w-full max-w-2xl mb-8 px-8">
            <div className="bg-dark-200/50 rounded-xl p-6 border border-primary-200/20">
              <p className="text-light-100 text-center leading-relaxed">
                {latestMsg}
              </p>
            </div>
          </div>
        )}

        {/* Real-time Emotion Overlay */}
        {currentEmotion &&
          showEmotionOverlay &&
          callStatus === CallStatus.ACTIVE && (
            <div className="w-full max-w-2xl mb-4 px-8">
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-400/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* <span className="text-2xl">
                      {emotionDetectionService.getEmotionEmoji(
                        currentEmotion.emotion
                      )}
                    </span> */}
                    <div>
                      <p className="text-sm font-medium text-white capitalize">
                        {currentEmotion.emotion}
                      </p>
                      <p className="text-xs text-gray-300">
                        Confidence:{" "}
                        {Math.round(currentEmotion.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        currentEmotion.intensity === "high" &&
                          "bg-red-500/20 text-red-300",
                        currentEmotion.intensity === "medium" &&
                          "bg-yellow-500/20 text-yellow-300",
                        currentEmotion.intensity === "low" &&
                          "bg-green-500/20 text-green-300"
                      )}
                    >
                      {currentEmotion.intensity}
                    </span>
                    <button
                      onClick={() => setShowEmotionOverlay(false)}
                      className="ml-2 text-gray-400 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Emotion metrics bar */}
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Stress Level</span>
                    <span className="text-gray-300">
                      {Math.round(
                        (currentEmotion.additionalMetrics?.stress_level || 0) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-green-400 to-red-400 h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (currentEmotion.additionalMetrics?.stress_level ||
                            0) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Emotion History Toggle */}
        {emotionHistory.length > 0 && (
          <div className="w-full max-w-2xl mb-4 px-8">
            <button
              onClick={() => setShowEmotionOverlay(!showEmotionOverlay)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              {showEmotionOverlay ? "Hide" : "Show"} Emotion Detection (
              {emotionHistory.length} readings)
            </button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col justify-center items-center gap-4">
          {callStatus !== CallStatus.ACTIVE ? (
            <button
              className="bg-primary-200 hover:bg-primary-200/80 text-dark-100 px-8 py-4 rounded-full font-bold text-lg transition-colors relative"
              onClick={handleCall}
            >
              {callStatus === CallStatus.CONNECTING && (
                <span className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-75"></span>
              )}
              <span className="relative">
                {isInativeOrFinished ? "Start Interview" : "Connecting..."}
              </span>
            </button>
          ) : (
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
              onClick={handleDisconnect}
            >
              End Interview
            </button>
          )}

          {/* Saving Indicator */}
          {isSavingCall && (
            <div className="flex items-center gap-2 text-primary-200 animate-pulse">
              <div className="w-4 h-4 border-2 border-primary-200 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Saving call data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Code Editor Panel - positioned in blue shaded area (far right edge) */}
      <div className="w-[380px] h-full bg-dark-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-300 bg-dark-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-200 rounded-lg flex items-center justify-center">
              <span className="text-dark-100 text-sm font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-light-100 font-semibold text-lg">
              Code Editor
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-6">
          {/* Problem Statement */}
          {currentQuestion && (
            <div className="mb-6 p-4 bg-dark-300/50 rounded-xl border border-primary-200/20">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-primary-100 font-semibold text-lg">
                  {currentQuestion.title}
                </h4>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold ml-3 flex-shrink-0",
                    currentQuestion.difficulty === "Easy" &&
                      "bg-green-500/20 text-green-400 border border-green-500/30",
                    currentQuestion.difficulty === "Medium" &&
                      "bg-orange-500/20 text-orange-400 border border-orange-500/30",
                    currentQuestion.difficulty === "Hard" &&
                      "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>

              <div className="text-light-100 text-sm leading-relaxed mb-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-200/30">
                {currentQuestion.problem}
              </div>

              {currentQuestion.constraints &&
                currentQuestion.constraints.length > 0 && (
                  <div className="pt-3 border-t border-primary-200/10">
                    <p className="text-light-400 text-xs font-medium mb-2">
                      Constraints:
                    </p>
                    <ul className="text-light-100 text-xs space-y-1">
                      {currentQuestion.constraints
                        .slice(0, 3)
                        .map((constraint, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary-200 mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span className="leading-relaxed">
                              {constraint}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Previous Solutions */}
          {chatMessages.length > 0 && (
            <div className="mb-4 p-4 bg-dark-300/30 rounded-xl border border-primary-200/10">
              <p className="text-light-400 text-xs font-medium mb-2">
                Previous Solutions:
              </p>
              <div className="max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-200/30 space-y-2">
                {chatMessages.map(
                  (msg, index) =>
                    msg.role === "user" && (
                      <div
                        key={index}
                        className="text-light-100 text-xs bg-dark-200 rounded-lg p-2 border border-primary-200/10"
                      >
                        <div className="font-mono text-xs">
                          {msg.content.substring(0, 100)}...
                        </div>
                        <div className="text-light-400 text-xs mt-1">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-light-100 text-sm font-medium">
                Your Solution:
              </p>
              <div className="flex items-center gap-2 text-xs text-light-400">
                <span>Lines: {currentInput.split("\n").length}</span>
                <span>•</span>
                <span>Chars: {currentInput.length}</span>
              </div>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    sendChatMessage(currentInput);
                  }
                }}
                placeholder={`// Write your solution here...
function solution() {
    // Your code here
    return result;
}`}
                disabled={isLoadingChat}
                className="w-full h-full bg-dark-300 border border-primary-200/20 text-light-100 placeholder:text-light-400/70 rounded-xl p-4 pl-12 font-mono text-sm leading-relaxed resize-none focus:border-primary-200 focus:ring-2 focus:ring-primary-200/20 focus:outline-none"
                style={{ minHeight: "400px" }}
              />

              {/* Line numbers overlay */}
              <div className="absolute top-4 left-2 text-light-400/50 text-xs font-mono leading-relaxed pointer-events-none select-none">
                {Array.from(
                  { length: Math.max(20, currentInput.split("\n").length) },
                  (_, i) => (
                    <div
                      key={i}
                      className="h-[1.375rem] text-right pr-2 min-w-[24px]"
                    >
                      {i + 1}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Submit Controls */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => sendChatMessage(currentInput)}
                disabled={
                  isLoadingChat ||
                  !currentInput.trim() ||
                  callStatus !== CallStatus.ACTIVE
                }
                className="bg-primary-200 hover:bg-primary-200/80 text-dark-100 rounded-xl px-6 py-3 font-bold flex items-center gap-2"
              >
                {isLoadingChat ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-100/30 border-t-dark-100 rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Solution
                  </>
                )}
              </Button>

              <div className="text-xs text-light-400">
                {callStatus === CallStatus.ACTIVE
                  ? "Ctrl+Enter to submit"
                  : "Start interview to submit solutions"}
              </div>
            </div>

            {/* Status Messages */}
            {chatMessages.length > 0 && (
              <div className="mt-3">
                {chatMessages.slice(-1).map(
                  (msg, index) =>
                    msg.role === "assistant" && (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400">{msg.content}</span>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Agent;
