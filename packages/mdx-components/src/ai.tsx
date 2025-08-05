'use client';

import React, { useState } from 'react';

// AI-powered MDX components
export function AIChatBox({ lessonContent }: { lessonContent: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: lessonContent,
        }),
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error asking AI:', error);
      setAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 my-6">
      <h3 className="font-semibold mb-3">Ask AI Assistant</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          placeholder="Ask a question about this lesson..."
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
        />
        <button
          onClick={handleAskQuestion}
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
        {answer && (
          <div className="mt-4 p-3 bg-white rounded-md border">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AIQuizGenerator({ lessonContent }: { lessonContent: string }) {
  // Placeholder for AI quiz generation
  return (
    <div className="bg-blue-50 rounded-lg p-4 my-6">
      <h3 className="font-semibold mb-3">AI Quiz</h3>
      <p className="text-sm text-gray-600">AI-generated quiz coming soon!</p>
    </div>
  );
}

// Re-export AIChatBox as AIChat for compatibility
export const AIChat = AIChatBox;

// Additional AI components
export function AIExplainer({ lessonId, courseId, children }: { 
  lessonId: string;
  courseId: string;
  children?: React.ReactNode;
}) {
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: children?.toString() || '',
          lessonId,
          courseId,
        }),
      });
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
      setExplanation('Sorry, I encountered an error. Please try again.');
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="bg-purple-50 rounded-lg p-4 my-6">
      <div className="prose max-w-none">
        {children}
      </div>
      <button
        onClick={handleExplain}
        disabled={explaining}
        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
      >
        {explaining ? 'Explaining...' : 'AI Explain This'}
      </button>
      {explanation && (
        <div className="mt-4 p-3 bg-white rounded-md border">
          <p className="whitespace-pre-wrap">{explanation}</p>
        </div>
      )}
    </div>
  );
}

export function AICodeReview({ lessonId, courseId, code = '', language = 'javascript' }: { 
  lessonId: string;
  courseId: string;
  code?: string;
  language?: string;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState('');

  const handleReview = async () => {
    setReviewing(true);
    try {
      const response = await fetch('/api/ai/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          lessonId,
          courseId,
        }),
      });
      
      const data = await response.json();
      setReview(data.review);
    } catch (error) {
      console.error('Error reviewing code:', error);
      setReview('Sorry, I encountered an error. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="bg-green-50 rounded-lg p-4 my-6">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleReview}
        disabled={reviewing}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
      >
        {reviewing ? 'Reviewing...' : 'AI Review This Code'}
      </button>
      {review && (
        <div className="mt-4 p-3 bg-white rounded-md border">
          <p className="whitespace-pre-wrap">{review}</p>
        </div>
      )}
    </div>
  );
}