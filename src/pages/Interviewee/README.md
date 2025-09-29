# Interview Application Architecture

## Overview

The application has been refactored to follow a clean architecture pattern with better separation of concerns. The main interview flow is now modularized into separate components with shared logic extracted into custom hooks.

## Key Components

### Pages

- **IntervieweePage**: Main container/router component that renders the appropriate subpage based on the current step
- **DashboardPage**: Shows past interviews, resume status, and actions to start new interviews
- **PreInterviewPage**: Handles resume upload and profile verification (steps 0 and 1)
- **InterviewSessionPage**: Manages the actual interview process with questions and answers
- **SummaryPage**: Shows interview results and provides feedback

### Custom Hooks

- **useInterviewFlow**: Centralizes all interview-related logic and state management
- **useInterviewNavigation**: Handles route protection and navigation based on state
- **useInterviewPersistence**: Manages state persistence beyond Redux-Persist

## State Management

- Redux is used for global state management with Redux-Persist for persistence
- Additional localStorage synchronization for critical state (interview progress)
- Clean separation between UI components and business logic

## Features

- Resume upload and profile extraction
- Multiple-choice interview questions
- Detailed scoring and feedback
- Interview history tracking
- Pause and resume functionality

## Flow

1. User uploads resume and verifies profile information
2. Interview questions are generated based on resume
3. User answers questions one by one
4. Results are calculated and displayed
5. History is saved for future reference

## Benefits of New Architecture

- Better code organization and maintainability
- Improved state management and synchronization
- Cleaner separation of concerns
- More robust error handling
- Support for pausing and resuming interviews
