import { useState, useEffect } from 'react';
import { QuickGenerateForm } from './QuickGenerateForm';
import { ScriptGenerateForm } from './ScriptGenerateForm';
import { ScriptApiTester } from './ScriptApiTester';
import './PodcastCreatorPage.css';

type TabType = 'quick' | 'script-only' | 'step-by-step' | 'my-content' | 'api-tester';

export function PodcastCreatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('script-only');
  const [showDevTools, setShowDevTools] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+D to toggle dev tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'quick':
        return <QuickGenerateForm />;
      case 'script-only':
        return <ScriptGenerateForm />;
      case 'api-tester':
        return <ScriptApiTester />;
      case 'step-by-step':
        return (
          <div className="tab-placeholder">
            <h3>Step-by-Step Workflow</h3>
            <p>Tính năng đang được phát triển...</p>
          </div>
        );
      case 'my-content':
        return (
          <div className="tab-placeholder">
            <h3>My Content</h3>
            <p>Tính năng đang được phát triển...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="podcast-creator-page">
      <div className="podcast-creator-container">
        {/* Header */}
        <div className="podcast-creator-header">
          <div>
            <h1 className="page-title">Podcast Creator</h1>
            <p className="page-subtitle">
              Tạo nội dung podcast chuyên nghiệp với AI
            </p>
          </div>
          {/* Dev Tools Toggle - Press Ctrl+Shift+D to show */}
          {showDevTools && (
            <button
              className="dev-tools-toggle"
              onClick={() => setShowDevTools(false)}
              title="Hide Dev Tools (Ctrl+Shift+D)"
            >
              🛠️ Dev Mode ON
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'script-only' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('script-only')}
          >
            Tạo Script
          </button>
          <button
            className={`tab-button ${activeTab === 'quick' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            Tạo Nhanh (Full)
          </button>
          <button
            className={`tab-button ${activeTab === 'step-by-step' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('step-by-step')}
          >
            Từng Bước
          </button>
          <button
            className={`tab-button ${activeTab === 'my-content' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('my-content')}
          >
            Nội Dung Của Tôi
          </button>
          {showDevTools && (
            <button
              className={`tab-button tab-button-dev ${activeTab === 'api-tester' ? 'tab-button-active' : ''}`}
              onClick={() => setActiveTab('api-tester')}
            >
              🛠️ API Tester
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
