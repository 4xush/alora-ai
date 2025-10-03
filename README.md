# InterviewPro - Modern Technical Interview Platform

A comprehensive technical interview platform designed to streamline the interview process for both candidates and hiring teams. The application provides automated resume parsing, personalized technical assessments, and detailed analytics to help companies make better hiring decisions while giving candidates a fair, consistent interview experience.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### For Candidates (Interviewees)

- 📄 **Resume-Based Personalization**: Upload your resume to receive customized interview questions
- 🤖 **AI-Generated Questions**: Personalized questions based on your resume and experience level
- ⏱️ **Timed MCQ Tests**: Multiple choice questions with adaptive difficulty levels
- 📊 **Instant Feedback**: Receive immediate scoring and feedback on your interview performance
- 📈 **Progress Tracking**: Monitor your improvement across multiple interview attempts
- 💾 **Auto-Save Progress**: Never lose your progress with automatic state persistence

### For Hiring Teams (Interviewers)

- 👥 **Candidate Management**: Track and manage all interview candidates in one place
- 📋 **Detailed Analytics**: View comprehensive interview results with question-by-question breakdowns
- 🔍 **Multiple Attempt Tracking**: See how candidates improve over multiple interview sessions
- 📊 **Resume Analysis**: Quickly review candidate qualifications with AI-assisted parsing
- � **Professional Dashboard**: Filter, sort, and search candidates efficiently

### Technical Highlights

- ⚡ **Modern Tech Stack**: React 18, Redux Toolkit, Ant Design
- 🔄 **State Management**: Centralized state for predictable data flow
- 🎨 **Professional UI**: Clean, intuitive interface with responsive design
- 🧠 **AI Integration**: Advanced AI for resume analysis and question generation
- 📱 **Mobile Responsive**: Works seamlessly across all devices
- 🔒 **Data Persistence**: Reliable localStorage with Redux-persist

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- AI API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd hackathon
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Getting Started

### For Candidates

1. **Create an Account**: Sign up with your email or social accounts
2. **Complete Your Profile**: Add basic information to get started
3. **Upload Your Resume**: Upload a PDF or DOCX resume for personalized questions
4. **Verify Information**: Confirm the extracted information is correct
5. **Take the Interview**: Answer technical questions tailored to your experience
6. **Review Results**: Get immediate feedback and areas for improvement

### For Interviewers

1. **Log in to the Interviewer Portal**: Access your dedicated dashboard
2. **Review Candidates**: See all candidates who have completed interviews

   - Search by name or email

3. **Analyze Performance**
   - Click on any candidate to see detailed results
   - Review interview transcripts
   - Access AI-generated feedback and scoring

## 🏗️ Architecture

### Frontend Structure

```
src/
├── components/          # Reusable UI components
│   ├── InterviewFlow/   # Multi-step interview process
│   ├── MCQTest/        # Question and answer interface
│   ├── IntervieweeDashboard/  # User dashboard
│   └── InterviewSummary/      # Results display
├── pages/              # Route-level components
├── store/              # Redux state management
3. **Analyze Performance**: Dive deep into individual candidate results
4. **Compare Candidates**: Use filters and sorting to compare across candidates
5. **Export Reports**: Generate detailed reports for hiring discussions

## Technical Documentation

### System Architecture

InterviewPro is built with a modern React frontend and uses Redux for state management. The application features:

- **Component-Based Architecture**: Modular design for maintainability
- **Redux State Management**: Centralized state for predictable data flow
- **Error Boundary Protection**: Graceful error handling throughout the application
- **Responsive Design**: Works on desktop and mobile devices

### Directory Structure

```

/src
/components # Reusable UI components
/CandidateChat # Candidate chat interface
/Dashboard # Main dashboard components
/IntervieweeDashboard # Candidate dashboard
/InterviewFlow # Multi-step interview process
/InterviewSummary # Results display
/MCQTest # Interview questions component
/ResumeUploader # Resume upload functionality
/Timer # Interview timing components
/pages # Page-level components
IntervieweePage.jsx # Main candidate experience
InterviewerPage.jsx # Interviewer dashboard
LandingPage.jsx # Application entry point
/store # Redux state management
intervieweeSlice.js # Candidate state
interviewerSlice.js # Interviewer state
store.js # Redux store configuration
/services # API and service integrations
/utils # Utility functions
/layouts # Layout components
/hooks # Custom React hooks

````

### State Management

The application uses Redux with several main slices:

1. **intervieweeSlice**: Manages the candidate experience including:
   - Resume data and profile information
   - Interview progress tracking
   - Questions and answers management
   - Results and scoring

2. **interviewerSlice**: Manages the interviewer experience including:
   - Candidate tracking with multiple interview attempts
   - Filtering and search functionality
   - Sorting and organization of candidate data

3. **settingsSlice**: Handles application configuration

4. **uiSlice**: Manages UI state across components

### Key Workflows

1. **Interview Process Flow**:
   - Dashboard → Resume Upload → Profile Verification → Interview Questions → Results
   - State transitions managed by Redux actions and local component state
   - Error handling at each step with fallbacks

2. **Interviewer Dashboard Flow**:
   - Candidate listing → Filtering/Sorting → Candidate Detail View
   - Multiple interview tracking for repeat candidates
   - Data visualization for performance metrics

## Recent Improvements

The application has been transformed from a prototype to a production-ready system:

### Critical Fixes Implemented
- **Multiple Interview Attempts**: Candidates can now take multiple interviews with history preserved
- **State Management Overhaul**: Eliminated state inconsistencies and implemented proper Redux patterns
- **Interview Flow Fixes**: Smooth navigation and proper validation between steps
- **Enhanced Components**: Professional UI with improved user experience
- **Results Analysis**: Comprehensive scoring with detailed feedback

### Performance Improvements
- Reduced unnecessary re-renders with proper memoization
- Fixed memory leaks in timer components
- Added comprehensive loading states and error handling
- Improved interview completion rate significantly

## Development Guide

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/interviewpro.git

# Install dependencies
cd interviewpro
npm install

# Start development server
npm start
````

### Environment Setup

Create a `.env` file with the following variables:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## Extending the Application

### Adding New Question Types

1. Create a new component in `/components`
2. Update the `renderQuestion` function in the MCQTest component
3. Add the new question type to the AI service prompt template
4. Update the scoring algorithm in `scoreAnswers` action

### Custom Resume Parsing

The resume parsing can be extended by modifying:

- `/services/resumeParser.js` for document processing
- `/services/aiService.js` for information extraction

## Troubleshooting

### Common Issues

1. **Blank Screen After Navigation**: Usually caused by state synchronization issues. Check Redux state and component key props.

2. **Resume Upload Failures**: Verify file format support and size limits in the ResumeUploader component.

3. **Question Generation Failures**: Check AI service connectivity and prompt templates.

## Contributing

We welcome contributions to InterviewPro! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

_Transform your interview process with AI-powered intelligence and comprehensive analytics._
