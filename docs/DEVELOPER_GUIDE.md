# Developer Documentation for InterviewPro

This document provides technical information for developers working on the InterviewPro platform. It covers architecture decisions, code organization, and implementation details.

## Tech Stack

- **Frontend**: React 18 with Vite
- **State Management**: Redux Toolkit
- **UI Framework**: Ant Design
- **Persistence**: Redux-Persist with localStorage
- **Document Processing**: PDF.js and mammoth.js
- **AI Integration**: External AI API

## Core Components Architecture

### Resume Processing Pipeline

The resume processing system follows these steps:

1. **Document Upload** (`ResumeUploader.jsx`)

   - Handles file selection and validation
   - Uses PDF.js/mammoth.js to convert to text

2. **Information Extraction** (`resumeService.js`)

   - Parses text for relevant information
   - Structures data for AI processing

3. **Profile Verification** (`PreInterview.jsx`)
   - Displays extracted information
   - Allows user corrections

### Interview Flow Architecture

The interview flow is managed through a state machine pattern:

1. **Flow Controller** (`InterviewFlow.jsx`)

   - Manages transitions between steps
   - Handles validation between steps

2. **Question Engine** (`MCQTest.jsx`)

   - Renders questions based on type
   - Manages answer collection
   - Handles timing and progress

3. **Scoring System** (`aiService.js`)
   - Evaluates answers against expected results
   - Generates detailed feedback
   - Calculates overall score

### Data Management

#### Redux Slices

1. **intervieweeSlice.js**

   ```javascript
   {
     profile: { name, email, phone, ... },
     resume: { text, parsed, ... },
     questions: [{ id, text, options, ... }],
     answers: [{ id, text, ... }],
     results: { totalScore, perAnswer, summary, ... },
     status: 'idle' | 'uploading' | 'questioning' | 'scoring' | 'completed',
     ...
   }
   ```

2. **interviewerSlice.js**
   ```javascript
   {
     candidates: [
       {
         id: "unique-id",
         candidateInfo: { name, email, ... },
         attempts: [
           {
             id: "attempt-id",
             timestamp: "2023-05-01T12:00:00Z",
             score: 85,
             status: "Completed",
             transcript: [{ q, a, score, explanation }],
             ...
           },
           ...
         ]
       },
       ...
     ],
     search: "",
     sortKey: "score",
     sortOrder: "descend",
     ...
   }
   ```

## Implementation Notes

### Multiple Interview Attempts

The system supports multiple interview attempts by the same candidate through:

1. **Unique Interview IDs**: Each interview session has a unique ID
2. **Candidate Grouping**: Interviews are grouped by candidate email/identity
3. **Timestamp Tracking**: Each attempt records start and completion times
4. **History Preservation**: All attempt data is retained for analysis

Implementation in `interviewerSlice.js`:

```javascript
// Example action to add a new attempt
addInterviewAttempt: (state, action) => {
  const { candidateInfo, attemptData } = action.payload;
  const candidateId =
    candidateInfo.email || candidateInfo.name || Date.now().toString();

  // Find or create candidate entry
  let candidate = state.candidates.find((c) => c.id === candidateId);
  if (!candidate) {
    candidate = {
      id: candidateId,
      candidateInfo: { ...candidateInfo },
      attempts: [],
    };
    state.candidates.push(candidate);
  }

  // Add new attempt
  candidate.attempts.push({
    id: attemptData.id,
    timestamp: attemptData.timestamp,
    ...attemptData,
  });
};
```

### AI Service Integration

The AI service integration handles:

1. **Resume Analysis**: Extracting relevant skills and experience
2. **Question Generation**: Creating personalized questions
3. **Answer Scoring**: Evaluating responses against expected answers

Implementation pattern in `aiService.js`:

```javascript
export const analyzeResume = async (resumeText) => {
  try {
    const prompt = constructResumeAnalysisPrompt(resumeText);
    const response = await callAIApi(prompt);
    return parseResumeAnalysisResponse(response);
  } catch (error) {
    console.error("Resume analysis failed:", error);
    throw new Error("Failed to analyze resume");
  }
};

export const generateQuestions = async (
  resumeAnalysis,
  difficulty = "medium",
  count = 5
) => {
  // Similar implementation pattern
};

export const scoreAnswers = async (questions, answers, resumeContext) => {
  // Similar implementation pattern
};
```

## Extension Points

### Adding New Question Types

To add a new question type:

1. Create component in `/components/QuestionTypes/`
2. Add type to question schema in `intervieweeSlice.js`
3. Update rendering logic in `MCQTest.jsx`
4. Modify AI prompt template in `aiService.js`
5. Update scoring algorithm in `scoreAnswers()`

### Custom Scoring Algorithms

To implement custom scoring:

1. Modify `scoreAnswers()` in `aiService.js`
2. Update scoring display in `InterviewSummary.jsx`
3. Add new metrics to the interviewer dashboard

## Optimization Notes

1. **Memoization**: Use React.memo and useMemo for expensive components
2. **State Updates**: Batch updates to prevent unnecessary renders
3. **API Calls**: Implement caching for AI API results
4. **Large Lists**: Use virtualization for candidate lists when they grow large

## Future Architecture Considerations

1. **Backend Integration**

   - Move AI processing server-side
   - Implement proper authentication
   - Add database persistence

2. **Scalability**

   - Split into microservices
   - Implement API gateway
   - Add caching layer

3. **Advanced Features**
   - Real-time collaborative evaluation
   - Video interview recording and analysis
   - Integrated scheduling system
