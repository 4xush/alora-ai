# Interview Status and Attempt Numbering Fix

## Problem Description

Our interview platform encountered two related issues in the interviewer dashboard:

1. **Duplicate Interview Entries**: When a candidate completed an interview, the interviewer dashboard incorrectly showed both "In Progress" and "Completed" entries for the same interview session. This created confusion and inflated the number of interview attempts.

2. **Incorrect Attempt Numbering**: When a candidate's interview transitioned from "In Progress" to "Completed", the system incremented the attempt number (e.g., from Attempt #1 to Attempt #2), even though it was the same interview session.

These issues stemmed from how the application handled the state transitions of interview sessions in the Redux store and how this data was processed for display in the interviewer dashboard.

## Root Causes

1. **Data Model Structure**: The Redux store maintained separate entries for "In Progress" and "Completed" states of the same interview session, without explicitly linking them together.

2. **Display Logic**: The dashboard UI didn't reconcile these related entries, treating each entry as a separate attempt, leading to duplicated display and incorrect attempt numbering.

3. **Status Transition**: When an interview status changed from "In Progress" to "Completed", the system created a new entry instead of updating the existing one, causing the attempt counter to increment incorrectly.

## Solution Implemented

We implemented a comprehensive solution that addresses both issues while maintaining the original data structure in the Redux store. The solution intelligently processes the data for display in the UI layer.

### 1. Grouping Attempts by Candidate

```javascript
// Group attempts by candidate email to filter out duplicates
const candidateAttemptsMap = new Map();

// Process candidates and collect their attempts
candidates.forEach((candidate) => {
  const email = candidate.email;
  if (!email) return; // Skip if no email (required for proper identification)

  // ...process candidate attempts
  if (!candidateAttemptsMap.has(email)) {
    candidateAttemptsMap.set(email, []);
  }

  // Add all attempts to the candidate's array
  // ...
});
```

### 2. Matching Related In-Progress and Completed Attempts

```javascript
// Sort attempts by date for proper chronological processing
const sortedAttempts = attempts.sort((a, b) => {
  const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
  const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
  return dateA - dateB; // Oldest first for proper sequencing
});

// Find pairs of in-progress and completed attempts that are related
const processedIds = new Set();
const finalAttempts = [];

// First pass: identify completed attempts and their in-progress counterparts
for (let i = 0; i < sortedAttempts.length; i++) {
  const attempt = sortedAttempts[i];

  // Skip if we've already processed this attempt
  if (processedIds.has(attempt.id)) continue;

  // If this is a completed attempt, look for a matching in-progress attempt
  if (attempt.status === "Completed") {
    // Look for an in-progress attempt with similar creation time (within 24 hours)
    // or matching interview ID pattern
    const matchingInProgress = sortedAttempts.find(
      (a) =>
        a.status === "In Progress" &&
        !processedIds.has(a.id) &&
        // Same base ID (if the ID format follows a pattern we can match)
        ((attempt.id &&
          a.id &&
          attempt.id.split("_")[0] === a.id.split("_")[0]) ||
          // Creation dates within 24 hours
          (attempt.createdAt &&
            a.createdAt &&
            Math.abs(new Date(attempt.createdAt) - new Date(a.createdAt)) <
              86400000))
    );

    if (matchingInProgress) {
      // We found a matching pair - keep the completed one but use the attempt number from in-progress
      processedIds.add(attempt.id);
      processedIds.add(matchingInProgress.id);

      // Use the lower attempt number to maintain consistency
      const attemptNumber = Math.min(
        attempt.attemptNumber || Number.MAX_SAFE_INTEGER,
        matchingInProgress.attemptNumber || Number.MAX_SAFE_INTEGER
      );

      finalAttempts.push({
        ...attempt,
        attemptNumber: attemptNumber,
      });
    } else {
      // No match found, keep as is
      processedIds.add(attempt.id);
      finalAttempts.push(attempt);
    }
  }
}
```

### 3. Processing Remaining Unmatched Attempts

```javascript
// Second pass: add any remaining unmatched in-progress attempts
for (let i = 0; i < sortedAttempts.length; i++) {
  const attempt = sortedAttempts[i];
  if (!processedIds.has(attempt.id)) {
    finalAttempts.push(attempt);
    processedIds.add(attempt.id);
  }
}

// Add the processed attempts to our final collection
allAttempts.push(...finalAttempts);
```

## Benefits of this Solution

1. **Non-Destructive**: The solution processes data for display without modifying the underlying Redux store structure, making it safer and more maintainable.

2. **Intelligent Matching**: Uses multiple criteria (timestamps, ID patterns) to match related attempts even in edge cases with inconsistent data.

3. **Correct Attempt Numbering**: Preserves the original attempt number when an "In Progress" interview is completed, showing it as a single attempt.

4. **Complete Data Preservation**: No information is lost; all interview data is preserved but displayed correctly.

5. **Edge Case Handling**: The solution handles various scenarios including:
   - Multiple genuine attempts by the same candidate
   - Incomplete or inconsistent interview data
   - Different creation patterns for interview IDs

## Future Considerations

For a more permanent solution, consider the following improvements to the data model:

1. **Linked Interview States**: Create a direct relationship between different states of the same interview session.

2. **Single Interview Record**: Maintain a single interview record that changes status rather than creating new records for status changes.

3. **Normalized Data Structure**: Implement a more normalized Redux store structure that separates interviews, candidates, and attempts for better data management.

These improvements would address the issue at the data model level rather than just in the UI display layer.
