import { useState, useEffect } from 'react';
import voiceService from '../../services/voiceService';
import type { TtsVoice } from '../../types/podcast';
import './VoiceSelector.css';

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function VoiceSelector({ value, onChange, disabled = false, required = false, error }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await voiceService.getActiveVoices();
      setVoices(data);
    } catch (err: any) {
      console.error('Error loading voices:', err);
      setLoadError(err.message || 'Không thể tải danh sách giọng đọc');
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderIcon = (gender?: string): string => {
    switch (gender) {
      case 'Male':
        return '♂';
      case 'Female':
        return '♀';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="voice-selector">
        <select className="voice-selector-select" disabled>
          <option>Đang tải giọng đọc...</option>
        </select>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="voice-selector">
        <select className="voice-selector-select voice-selector-error" disabled>
          <option>{loadError}</option>
        </select>
        <button
          type="button"
          className="voice-selector-retry"
          onClick={loadVoices}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="voice-selector">
        <select className="voice-selector-select" disabled>
          <option>Không có giọng đọc nào</option>
        </select>
      </div>
    );
  }

  return (
    <div className="voice-selector">
      <select
        className={`voice-selector-select ${error ? 'voice-selector-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
      >
        <option value="">-- Chọn giọng đọc --</option>
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.displayName}
            {voice.gender && ` ${getGenderIcon(voice.gender)}`}
            {voice.provider && ` (${voice.provider})`}
          </option>
        ))}
      </select>
      {error && <span className="voice-selector-error-text">{error}</span>}
    </div>
  );
}
