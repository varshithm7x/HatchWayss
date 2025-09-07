# 🧠 Emotion Detection Integration for BohdAi

## Overview

This implementation adds comprehensive real-time tone & emotion detection to your AI interview platform. The system analyzes candidate responses during live interviews and provides detailed emotional insights during playback.

## Features Implemented

### ✅ **Real-time Emotion Detection**
- **Text Analysis**: Uses Google Gemini AI and rule-based analysis for emotion detection
- **Confidence Scoring**: Each emotion reading includes a confidence score (0-100%)
- **Intensity Levels**: Emotions are classified as low, medium, or high intensity
- **Stress Indicators**: Identifies stress markers and confidence levels

### ✅ **Enhanced Call Data API**
- **Emotion Integration**: Call details now include complete emotion analysis
- **Timeline Mapping**: Emotions are mapped to specific timestamps in conversations
- **Message Enhancement**: Each user message can include emotion metadata

### ✅ **Visualization Components**
- **Real-time Overlay**: Shows current emotion during active interviews
- **Timeline Graph**: Visual representation of emotion changes over time
- **Emoji Indicators**: Quick visual emotion identification
- **Stress Level Bars**: Visual stress level indicators

### ✅ **Advanced Analytics**
- **Emotion Distribution**: Breakdown of emotion frequency throughout interview
- **Emotional Trends**: Tracks if candidate improved, declined, or stayed stable
- **Stability Metrics**: Measures emotional consistency
- **Confidence Analysis**: Average confidence levels and trends

## Files Added/Modified

### 🆕 New Services
- `services/emotion/emotion-detection.service.ts` - Core emotion detection logic
- `hooks/useEmotionDetection.ts` - React hooks for emotion data management

### 🆕 New Components  
- `components/EmotionVisualization.tsx` - Comprehensive emotion visualization
- `app/api/vapi/call-data/[callId]/emotion/route.ts` - Real-time emotion API

### 🔧 Modified Files
- `components/Agent.tsx` - Added real-time emotion detection to interviews
- `app/(root)/call-data/[callId]/page.tsx` - Added emotion visualization to call details
- `app/api/vapi/call-data/[callId]/route.ts` - Enhanced with emotion analysis
- `types/vapi.d.ts` - Added emotion data types

### 🐍 Optional Python Enhancement
- `scripts/advanced_emotion_detection.py` - Advanced audio + text emotion analysis
- `requirements-emotion.txt` - Python dependencies for advanced features

## How It Works

### 1. **During Live Interviews**
```typescript
// Real-time emotion detection in Agent component
const onMessage = async (message: Message) => {
  if (message.role === "user" && message.transcript.trim().length > 10) {
    const emotionData = await emotionDetectionService.analyzeTextEmotion(
      message.transcript,
      timestamp,
      speakingDuration
    );
    setCurrentEmotion(emotionData);
  }
};
```

### 2. **Emotion Analysis Process**
```typescript
// Primary analysis with Gemini AI
const prompt = `Analyze emotional tone: "${text}"`;
const analysis = await gemini.generateContent(prompt);

// Fallback rule-based analysis
const emotionPatterns = {
  confident: ['sure', 'definitely', 'absolutely'],
  nervous: ['um', 'uh', 'maybe', 'not sure'],
  // ... more patterns
};
```

### 3. **Visualization Timeline**
```typescript
// Timeline shows emotion changes over time
<EmotionTimeline emotions={emotions} duration={callDuration} />

// Each segment shows dominant emotion with confidence
const segmentEmotion = {
  emotion: 'confident',
  confidence: 0.85,
  stressLevel: 0.3
};
```

## Emotion Labels Supported

- **🙂 happy** - Positive, satisfied responses
- **😐 neutral** - Balanced, professional tone  
- **😰 nervous** - Uncertainty, hesitation markers
- **😎 confident** - Strong, assertive communication
- **😫 stressed** - High pressure, overwhelm indicators
- **🤩 excited** - High energy, enthusiasm
- **😞 disappointed** - Negative sentiment, dissatisfaction
- **😤 frustrated** - Irritation, impatience
- **😌 calm** - Relaxed, composed responses
- **🤔 uncertain** - Indecision, unclear responses

## Configuration

### Environment Variables
```bash
# Required for Gemini AI emotion analysis
GOOGLE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_gemini_api_key

# Existing Vapi configuration
VAPI_PRIVATE_API_KEY=your_vapi_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
```

### Usage in Components
```typescript
// Use the emotion detection hook
const {
  currentEmotion,
  emotionHistory,
  addEmotionReading,
  emotionAnalysis
} = useEmotionDetection({ callId, enableRealTime: true });

// Add emotion reading
await addEmotionReading("I'm confident about this solution", Date.now());

// Display emotion visualization
<EmotionVisualization emotionAnalysis={emotionAnalysis} />
```

## API Endpoints

### Enhanced Call Data
```
GET /api/vapi/call-data/[callId]
```
Response now includes:
```json
{
  "id": "call_123",
  "messages": [...],
  "emotionAnalysis": {
    "emotions": [
      {
        "emotion": "confident",
        "confidence": 0.85,
        "timestamp": 1640995200000,
        "intensity": "high",
        "additionalMetrics": {
          "stress_level": 0.2,
          "energy_level": 0.8
        }
      }
    ],
    "dominantEmotion": "confident",
    "emotionalTrend": "improving",
    "summary": {
      "averageConfidence": 0.78,
      "emotionalStability": 0.65,
      "stressIndicators": []
    }
  }
}
```

### Real-time Emotion Processing
```
POST /api/vapi/call-data/[callId]/emotion
```
Body:
```json
{
  "transcript": "I think I can solve this problem",
  "timestamp": 1640995200000,
  "isPartial": false
}
```

## Advanced Python Integration (Optional)

For enhanced emotion detection with audio analysis:

### Setup
```bash
# Install Python dependencies
pip install -r requirements-emotion.txt

# Run the advanced emotion detector
python scripts/advanced_emotion_detection.py
```

### Features
- **Audio emotion detection** using Hubert models
- **Multi-modal analysis** combining text + audio
- **Real-time streaming** support for live analysis
- **Advanced metrics** including pitch, energy, spectral features

## Deployment Notes

### Production Considerations
1. **Rate Limiting**: Gemini API has rate limits - implement caching for repeated phrases
2. **Fallback Systems**: Rule-based emotion detection works when API is unavailable  
3. **Privacy**: Emotion data should be handled according to privacy policies
4. **Performance**: Debounce emotion analysis to avoid excessive API calls

### Scaling
- Consider caching emotion results for common phrases
- Implement background processing for historical analysis
- Use WebSocket connections for real-time updates

## Troubleshooting

### Common Issues

**1. Gemini API Errors**
```bash
# Check API key
echo $GOOGLE_AI_API_KEY

# Verify quota and billing
```

**2. Import Errors**
```bash
# Ensure all dependencies are installed
npm install @google/generative-ai
```

**3. Type Errors**
```typescript
// Import emotion types
import { EmotionData } from '@/services/emotion/emotion-detection.service';
```

### Performance Tips
- Enable emotion overlay only during active calls
- Limit emotion history to last 100 readings
- Use local storage for emotion preferences

## Future Enhancements

### Roadmap
- [ ] **Voice Tone Analysis** - Pitch, pace, volume analysis
- [ ] **Facial Expression** - Video emotion detection
- [ ] **Biometric Integration** - Heart rate, stress sensors
- [ ] **AI Coaching** - Real-time emotion feedback
- [ ] **Emotion Patterns** - Learning from successful interviews

### Integration Ideas
- **Slack Notifications** - Alert recruiters to concerning emotional patterns
- **Calendar Integration** - Schedule follow-ups based on emotional state
- **Analytics Dashboard** - Company-wide emotion trends
- **Training Modules** - Emotion-aware interview training

## Support

For questions or issues with the emotion detection system:
1. Check the console for error messages
2. Verify API keys and environment variables
3. Test with the fallback rule-based system
4. Review the emotion detection service logs

The system is designed to fail gracefully - if emotion detection fails, interviews continue normally without emotional analysis.
