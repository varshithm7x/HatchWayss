import { NextRequest, NextResponse } from "next/server";
import { vapiCallDataService } from "@/services/vapi/call-data.service";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

interface FeedbackAnalysis {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  nextSteps: string[];
  aiSummary: string;
  personalizedPlan: string[];
  responseTime: number;
  completionRate: number;
  duration: number;
}

function extractConversationFromMessages(messages: any[]): string {
  if (!messages || messages.length === 0) return "";

  const conversation = messages
    .filter(msg => msg.type === "transcript" && msg.transcriptType === "final")
    .map(msg => {
      const role = msg.role === "user" ? "Candidate" : "Interviewer";
      return `${role}: ${msg.transcript}`;
    })
    .join("\n");

  return conversation;
}

function calculateResponseTime(messages: any[]): number {
  const transcriptMessages = messages.filter(
    msg => msg.type === "transcript" && msg.transcriptType === "final"
  );

  if (transcriptMessages.length < 2) return 0;

  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 1; i < transcriptMessages.length; i++) {
    const prevMsg = transcriptMessages[i - 1];
    const currMsg = transcriptMessages[i];

    // Calculate response time between interviewer question and candidate answer
    if (prevMsg.role === "assistant" && currMsg.role === "user") {
      const timeDiff = (currMsg.timestamp || 0) - (prevMsg.timestamp || 0);
      if (timeDiff > 0 && timeDiff < 60000) { // Less than 60 seconds
        totalResponseTime += timeDiff;
        responseCount++;
      }
    }
  }

  return responseCount > 0 ? totalResponseTime / responseCount / 1000 : 8.5; // Convert to seconds
}

async function generateFeedbackFromTranscript(transcript: string, callData: any): Promise<FeedbackAnalysis> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("No conversation transcript available for analysis");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an expert interview coach analyzing a technical interview session. Please provide detailed feedback based on the following conversation transcript:

${transcript}

Please analyze this interview and provide feedback in the following JSON format:

{
  "overallScore": [number 0-100],
  "communicationScore": [number 0-100],
  "technicalScore": [number 0-100],
  "problemSolvingScore": [number 0-100],
  "confidenceScore": [number 0-100],
  "strengths": [array of 3-5 specific strengths],
  "weaknesses": [array of 3-4 areas for improvement],
  "suggestions": [array of 4-5 actionable suggestions],
  "nextSteps": [array of 4-5 concrete next steps],
  "aiSummary": "[2-3 sentence summary of overall performance]",
  "personalizedPlan": [array of 5-6 weekly improvement goals]
}

Focus on:
- Technical knowledge and problem-solving approach
- Communication clarity and structure
- Confidence and professionalism
- Areas for improvement with specific suggestions
- Actionable next steps for skill development

Provide realistic scores and constructive feedback that would help the candidate improve.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }

    const feedbackData = JSON.parse(jsonMatch[0]);

    // Calculate additional metrics from call data
    const messages = callData.messages || [];
    const responseTime = calculateResponseTime(messages);
    const duration = callData.endedAt && callData.startedAt 
      ? (new Date(callData.endedAt).getTime() - new Date(callData.startedAt).getTime()) / (1000 * 60)
      : 30;

    return {
      ...feedbackData,
      responseTime,
      completionRate: callData.status === "ended" ? 100 : 75,
      duration: Math.round(duration)
    };

  } catch (error) {
    console.error("Error generating AI feedback:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json(
        { error: "callId parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Generating feedback for call: ${callId}`);

    // Fetch the specific call data
    const callData = await vapiCallDataService.getCall(callId);

    if (!callData) {
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // Extract conversation transcript - messages are on the call object directly
    const messages = callData.messages || [];
    const transcript = extractConversationFromMessages(messages);

    console.log(`Call data structure:`, {
      hasArtifact: !!callData.artifact,
      hasMessages: !!messages.length,
      messageCount: messages.length,
      transcriptLength: transcript.length,
      callStatus: callData.status,
      firstMessageType: messages[0]?.type || 'none'
    });

    if (!transcript || transcript.trim().length === 0) {
      // If no transcript is available, create a mock feedback for demonstration
      console.log(`No transcript available for call ${callId}, generating mock feedback`);
      
      const mockFeedback: FeedbackAnalysis = {
        overallScore: 75,
        communicationScore: 70,
        technicalScore: 80,
        problemSolvingScore: 75,
        confidenceScore: 70,
        strengths: [
          "Successfully initiated the interview session",
          "Demonstrated engagement with the process",
          "Completed the technical setup"
        ],
        weaknesses: [
          "Limited conversation data available for detailed analysis",
          "Session may have been shorter than optimal",
          "Consider longer interview sessions for better feedback"
        ],
        suggestions: [
          "Ensure microphone and audio settings are properly configured",
          "Allow for longer conversation periods during interviews",
          "Practice speaking clearly and at an appropriate pace",
          "Engage more actively in the conversation"
        ],
        nextSteps: [
          "Schedule a follow-up interview session",
          "Test audio equipment before the next interview",
          "Prepare questions and topics for discussion",
          "Review common interview formats and expectations"
        ],
        aiSummary: "This interview session had limited conversation data available for analysis. To provide more detailed feedback in the future, ensure longer conversation periods and clear audio quality.",
        personalizedPlan: [
          "Week 1: Practice speaking clearly and confidently",
          "Week 2: Prepare for common interview questions",
          "Week 3: Focus on technical communication skills",
          "Week 4: Schedule a comprehensive interview session"
        ],
        responseTime: 5.0,
        completionRate: 60,
        duration: Math.floor((new Date(callData.endedAt || Date.now()).getTime() - new Date(callData.startedAt).getTime()) / (1000 * 60)) || 15
      };

      const responseData = {
        id: `feedback_${callId}`,
        callId,
        interviewId: callId,
        userId: "current_user",
        interviewType: "technical",
        createdAt: new Date().toISOString(),
        ...mockFeedback
      };

      console.log(`Generated mock feedback for call: ${callId}`);
      return NextResponse.json(responseData, { status: 200 });
    }

    // Generate AI-powered feedback
    const feedback = await generateFeedbackFromTranscript(transcript, callData);

    // Add metadata
    const responseData = {
      id: `feedback_${callId}`,
      callId,
      interviewId: callId, // Using callId as interviewId for now
      userId: "current_user", // You can get this from authentication
      interviewType: "technical",
      createdAt: new Date().toISOString(),
      ...feedback
    };

    console.log(`Successfully generated feedback for call: ${callId}`);

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("Error generating feedback:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to generate feedback";
    
    return NextResponse.json({
      error: errorMessage,
      message: "Failed to generate feedback from call data",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
