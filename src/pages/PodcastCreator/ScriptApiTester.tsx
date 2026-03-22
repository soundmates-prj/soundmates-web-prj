import { useState } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import scriptService from '../../services/scriptService';
import type { Script } from '../../types/podcast';
import './ScriptApiTester.css';

/**
 * Component để test API generate script nhanh
 * Dùng cho development và debugging
 */
export function ScriptApiTester() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Script | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const testCases = [
    {
      name: 'Basic',
      data: {
        topic: 'Trí tuệ nhân tạo đang thay đổi thế giới',
        contextType: 'podcast',
        useAutoContext: true,
        strictFactMode: false,
      }
    },
    {
      name: 'With Instructions',
      data: {
        topic: 'Lợi ích của thiền định',
        title: 'Thiền Định - Chìa Khóa Tâm Trí',
        contextType: 'podcast',
        editorInstruction: 'Viết theo phong cách thân thiện, dễ hiểu',
        useAutoContext: true,
        strictFactMode: false,
      }
    },
    {
      name: 'Interview Style',
      data: {
        topic: 'Phỏng vấn về biến đổi khí hậu',
        title: 'Cuộc Trò Chuyện Về Khí Hậu',
        contextType: 'interview',
        temperature: 0.7,
        useAutoContext: true,
        strictFactMode: true,
      }
    },
    {
      name: 'Creative Mode',
      data: {
        topic: 'Cuộc sống trên Trái Đất năm 2100',
        title: 'Trái Đất 2100',
        contextType: 'podcast',
        temperature: 1.0,
        maxTokens: 3000,
        useAutoContext: true,
        strictFactMode: false,
      }
    }
  ];

  const handleQuickTest = async (testCase: typeof testCases[0]) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const script = await scriptService.generateScript(testCase.data as any);
      setResult(script);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi test API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomTest = async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const script = await scriptService.generateScript({
        topic,
        contextType: 'podcast',
        useAutoContext: true,
        strictFactMode: false,
      });
      setResult(script);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi test API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (result) {
      const resultText = JSON.stringify(result, null, 2);
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="script-api-tester">
      <div className="tester-header">
        <h2>Script API Tester</h2>
        <p>Test nhanh API POST /api/scripts/podcast:generate</p>
      </div>

      {/* Quick Test Cases */}
      <div className="test-cases">
        <h3>Quick Tests</h3>
        <div className="test-case-buttons">
          {testCases.map((testCase) => (
            <button
              key={testCase.name}
              className="test-case-btn"
              onClick={() => handleQuickTest(testCase)}
              disabled={isLoading}
            >
              {testCase.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Test */}
      <div className="custom-test">
        <h3>Custom Test</h3>
        <div className="custom-test-form">
          <input
            type="text"
            className="custom-test-input"
            placeholder="Nhập chủ đề để test..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
          <button
            className="custom-test-btn"
            onClick={handleCustomTest}
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Testing...
              </>
            ) : (
              'Test'
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="tester-loading">
          <Loader2 size={32} className="spinner" />
          <p>Đang gọi API...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="tester-error">
          <h4>Error</h4>
          <pre>{error}</pre>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="tester-result">
          <div className="result-header">
            <h4>Result</h4>
            <button
              className="copy-btn"
              onClick={handleCopyResult}
              title="Copy JSON"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">ID:</span>
              <span className="result-value">{result.id}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Status:</span>
              <span className={`result-status status-${result.status}`}>
                {result.status}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Topic:</span>
              <span className="result-value">{result.topic}</span>
            </div>
            {result.title && (
              <div className="result-item">
                <span className="result-label">Title:</span>
                <span className="result-value">{result.title}</span>
              </div>
            )}
          </div>

          <div className="result-content">
            <h5>Content Preview</h5>
            <pre className="content-preview">{result.content}</pre>
          </div>

          <details className="result-json">
            <summary>Full JSON Response</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
