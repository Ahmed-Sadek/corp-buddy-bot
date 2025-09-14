import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, LogOut, Calendar, CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "leave-request" | "status";
}

interface LeaveRequest {
  id: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestDate: Date;
  remainingDays: number;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Buddy, your employee support assistant. I can help you with company policies, submit leave requests, and check your request status. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingLeaveRequest, setPendingLeaveRequest] = useState<{days: number; reason: string} | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userEmail = localStorage.getItem("userEmail") || "employee@company.com";
  const remainingLeaveDays = 15; // Mock data

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const addMessage = (content: string, sender: "user" | "bot", type: "text" | "leave-request" | "status" = "text") => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      type,
    };
    setMessages(prev => [...prev, message]);
  };

  const simulateTyping = (callback: () => void, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const processMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Leave request detection
    const leaveMatch = lowerMessage.match(/(?:request|apply|take|need)\s+(\d+)\s+days?\s+(?:leave|off|vacation)/);
    if (leaveMatch) {
      const days = parseInt(leaveMatch[1]);
      setPendingLeaveRequest({ days, reason: message });
      simulateTyping(() => {
        addMessage(
          `I understand you want to request ${days} days of leave. You currently have ${remainingLeaveDays} days remaining. Would you like to proceed with this request?`,
          "bot"
        );
      });
      return;
    }

    // Leave confirmation
    if (pendingLeaveRequest && (lowerMessage.includes("yes") || lowerMessage.includes("confirm") || lowerMessage.includes("proceed"))) {
      const request: LeaveRequest = {
        id: Date.now().toString(),
        days: pendingLeaveRequest.days,
        reason: pendingLeaveRequest.reason,
        status: pendingLeaveRequest.days <= remainingLeaveDays ? "approved" : "rejected",
        requestDate: new Date(),
        remainingDays: remainingLeaveDays,
      };
      
      setLeaveRequests(prev => [...prev, request]);
      setPendingLeaveRequest(null);
      
      simulateTyping(() => {
        if (request.status === "approved") {
          addMessage(
            `✅ Your leave request for ${request.days} days has been automatically approved! You'll receive an email confirmation shortly.`,
            "bot"
          );
          toast({
            title: "Leave Request Approved",
            description: `Your ${request.days}-day leave has been approved.`,
          });
        } else {
          addMessage(
            `❌ Your leave request for ${request.days} days has been rejected. You only have ${remainingLeaveDays} days remaining.`,
            "bot"
          );
          toast({
            title: "Leave Request Rejected",
            description: "Insufficient leave days remaining.",
            variant: "destructive",
          });
        }
      });
      return;
    }

    // Status check
    if (lowerMessage.includes("status") && (lowerMessage.includes("leave") || lowerMessage.includes("request"))) {
      simulateTyping(() => {
        if (leaveRequests.length === 0) {
          addMessage("You have no leave requests on record.", "bot", "status");
        } else {
          const latestRequest = leaveRequests[leaveRequests.length - 1];
          addMessage(
            `Your latest leave request: ${latestRequest.days} days, Status: ${latestRequest.status.toUpperCase()}, Requested on: ${latestRequest.requestDate.toLocaleDateString()}`,
            "bot",
            "status"
          );
        }
      });
      return;
    }

    // FAQ responses
    const faqResponses: Record<string, string> = {
      "travel policy": "Our travel policy requires manager approval for all business trips. Employees can book flights and hotels through our corporate travel portal. Receipts must be submitted within 30 days for reimbursement.",
      "remote work": "Remote work is available up to 3 days per week with manager approval. Employees must maintain core hours of 10 AM - 3 PM in their local timezone.",
      "vacation": "All employees accrue 2.5 vacation days per month (30 days annually). Vacation requests must be submitted at least 2 weeks in advance.",
      "sick leave": "Employees receive 10 sick days per year. No advance notice required for sick leave, but please notify your manager as soon as possible.",
      "benefits": "We offer comprehensive health insurance, dental, vision, 401k matching up to 6%, and flexible spending accounts. Contact HR for enrollment details.",
      "it support": "For IT issues, use our internal helpdesk portal or call ext. 4357. Common issues can be resolved through our self-service knowledge base.",
    };

    for (const [keyword, response] of Object.entries(faqResponses)) {
      if (lowerMessage.includes(keyword)) {
        simulateTyping(() => {
          addMessage(response, "bot");
        });
        return;
      }
    }

    // Default response
    simulateTyping(() => {
      addMessage(
        "I'm here to help! You can ask me about:\n• Company policies (travel, remote work, benefits)\n• Submit leave requests\n• Check your request status\n• IT support procedures\n\nWhat would you like to know?",
        "bot"
      );
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage(inputValue, "user");
    const userMessage = inputValue;
    setInputValue("");

    setTimeout(() => {
      processMessage(userMessage);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Buddy Assistant</h1>
              <p className="text-sm text-muted-foreground">Employee Support</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userEmail}</p>
              <Badge variant="secondary" className="text-xs">Employee</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-xl">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 chat-scrollbar">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 chat-message-enter ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback
                      className={
                        message.sender === "user"
                          ? "bg-chat-user text-chat-user-foreground"
                          : "bg-chat-bot text-chat-bot-foreground"
                      }
                    >
                      {message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-chat-user text-chat-user-foreground ml-auto"
                        : "bg-chat-bot text-chat-bot-foreground"
                    } ${message.type === "leave-request" ? "border-l-4 border-warning" : ""} ${
                      message.type === "status" ? "border-l-4 border-primary" : ""
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-chat-bot text-chat-bot-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-chat-bot text-chat-bot-foreground px-4 py-2 rounded-2xl">
                    <div className="flex space-x-1 chat-typing">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about policies, request leave, or check status..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="btn-primary bg-primary hover:bg-primary-hover"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Try: "What's the travel policy?" or "I need 3 days leave"
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;