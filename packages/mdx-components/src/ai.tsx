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