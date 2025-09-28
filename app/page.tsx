"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Settings, MessageCircle, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  options?: string[];
  selectedOption?: number;
  timestamp: Date;
}

interface Personality {
  description: string;
}

const defaultPersonality: Personality = {
  description:
    "You are a helpful, friendly, and knowledgeable AI assistant. You provide clear, accurate, and engaging responses in a professional tone.",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] =
    useState<Personality>(defaultPersonality);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(-1);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load personality from localStorage on mount
  useEffect(() => {
    const savedPersonality = localStorage.getItem("chatPersonality");
    if (savedPersonality) {
      try {
        setPersonality(JSON.parse(savedPersonality));
      } catch (error) {
        console.error("Failed to load personality from localStorage:", error);
      }
    }
  }, []);

  // Save personality to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chatPersonality", JSON.stringify(personality));
  }, [personality]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        // Smooth scroll to bottom
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          personality,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Choose your preferred response:",
        options: data.options,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingMessageId(assistantMessage.id);
      setSelectedOptionIndex(0); // Start with first option selected

      // Focus the main container to enable keyboard navigation
      setTimeout(() => {
        const mainContainer = document.querySelector('[tabindex="0"]');
        if (mainContainer) {
          (mainContainer as HTMLElement).focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (messageId: string, optionIndex: number) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.options) {
      const selectedResponse = message.options[optionIndex];

      // Replace the options message with the selected response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: selectedResponse,
                options: undefined,
                selectedOption: undefined,
              }
            : msg
        )
      );

      setPendingMessageId(null);
      setSelectedOptionIndex(-1);
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
    setPendingMessageId(null);
    setSelectedOptionIndex(-1);
  };

  const handlePersonalityUpdate = (value: string) => {
    setPersonality({ description: value });
  };

  // Keyboard navigation for options
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      pendingMessageId &&
      messages.find((m) => m.id === pendingMessageId)?.options
    ) {
      const currentMessage = messages.find((m) => m.id === pendingMessageId);
      const optionsCount = currentMessage?.options?.length || 0;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedOptionIndex((prev) =>
          prev <= 0 ? optionsCount - 1 : prev - 1
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedOptionIndex((prev) =>
          prev >= optionsCount - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Enter" && selectedOptionIndex >= 0) {
        e.preventDefault();
        handleOptionSelect(pendingMessageId, selectedOptionIndex);
      }
    } else if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isLoading &&
      inputValue.trim()
    ) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="h-screen bg-background flex overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Sidebar with icon tabs */}
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`p-3 rounded-lg transition-colors ${
            activeTab === "chat"
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
          }`}
          title="Chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab("personality")}
          className={`p-3 rounded-lg transition-colors ${
            activeTab === "personality"
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
          }`}
          title="Personality"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Reset button for chat */}
        {activeTab === "chat" && (
          <button
            onClick={handleResetConversation}
            className="p-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors mt-auto"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 max-w-5xl mx-auto">
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat header */}
            <div className="px-6 py-4  ">
              <h1 className="text-xl font-semibold">Communication Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Choose from personalized response options
              </p>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col min-h-0 p-6">
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 min-h-0 pr-4 mb-4"
              >
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center justify-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                      <p className="text-xs">
                        Start a conversation by typing a message below
                      </p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <p className="mb-2 text-xs">{message.content}</p>

                        {message.options && (
                          <div className="space-y-2 mt-3">
                            {message.options.map((option, index) => (
                              <Button
                                key={index}
                                variant={
                                  pendingMessageId === message.id &&
                                  selectedOptionIndex === index
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                                onClick={() =>
                                  handleOptionSelect(message.id, index)
                                }
                              >
                                <span className="text-xs">{option}</span>
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 mr-4">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Generating responses...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="flex gap-2 flex-shrink-0">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="bg-background h-10"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={isLoading || !inputValue.trim()}
                  className="size-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "personality" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Personality header */}
            <div className="px-6 py-4 ">
              <h1 className="text-xl font-semibold">Personality Settings</h1>
              <p className="text-sm text-muted-foreground">
                Describe how you want the AI to behave and respond
              </p>
            </div>

            {/* Personality content */}
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium mb-2 block">
                  AI Personality Description
                </label>
                <Textarea
                  value={personality.description}
                  onChange={(e) => handlePersonalityUpdate(e.target.value)}
                  placeholder="Describe how you want the AI to behave. For example: 'You are a helpful coding assistant who explains things clearly and provides practical examples. You're patient, encouraging, and focus on best practices. You prefer concise but thorough explanations.'"
                  className="flex-1 min-h-[200px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Write a detailed description of how you want the AI to behave,
                  its tone, expertise areas, and response style.
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setPersonality(defaultPersonality)}
                  className="flex-1"
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
