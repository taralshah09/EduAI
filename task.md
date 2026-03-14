Build a full-stack AI web application similar to Miyagi Labs.

Goal:
Users should be able to paste a YouTube link and the system automatically converts the video into an interactive learning course with quizzes, explanations, and progress tracking.

Tech Stack:
Frontend:
- React JS
- Vanila CSS
- Javascript

Backend:
- Express.js API routes
- MongoDB 
- Redis for caching

AI:
- Gemini API for content generation
- Whisper or YouTube transcript extraction for transcription
- Embeddings for semantic search inside course content

Features:

1. User Authentication
<!-- - Email + OAuth (Google) -->
- Email + Password
- User dashboard

2. YouTube Course Generator
Input:
- YouTube video URL

Pipeline:
Step 1:
Fetch video metadata and transcript from YouTube.

Step 2:
Chunk transcript into logical sections.

Step 3:
Use an LLM to:
- Summarize each section
- Extract key concepts
- Generate explanations
- Generate examples

Step 4:
Automatically generate:
- Multiple choice quizzes
- Short answer questions
- Flashcards

3. Course Structure
Convert video into:

Course
 ├ Lesson 1
 │   ├ Summary
 │   ├ Key Concepts
 │   ├ Explanation
 │   ├ Quiz
 ├ Lesson 2
 │   ├ Summary
 │   ├ Concepts
 │   ├ Quiz

4. Interactive Quiz Engine
- MCQ questions
- Instant feedback
- Explanation for each answer
- Score tracking

5. Progress Tracking
Users can see:
- Completion %
- Quiz accuracy
- Weak topics

6. AI Tutor Chat
Allow users to ask questions about the video/course:
Example:
"Explain gradient descent again."

Use RAG:
- retrieve relevant transcript chunks
- answer using LLM

7. UI Pages
Landing Page:
- hero section
- demo input for YouTube link
- feature sections

Dashboard:
- list of generated courses

Course Page:
- lessons
- quizzes
- notes

8. Design Style
- clean`
- modern
- minimal
- education focused
- similar to Duolingo / Notion style UI

9. Deployment
- Vercel for frontend
- Supabase/Postgres for database

Bonus Features:
- spaced repetition flashcards
- ability to upload PDFs
- AI generated practice exams
- shareable course links

Important:
Structure the code cleanly with reusable components and clear folder structure.