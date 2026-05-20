import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('Please enter a valid API key');
      return;
    }

    if (apiKey.trim().length < 10) {
      alert('API key appears to be too short. Please check and try again.');
      return;
    }

    setIsLoading(true);
    try {
      onSave(apiKey.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg">
            <Key className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            Configure Gemini API
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste your Gemini API key here..."
                className="w-full px-4 py-3 pr-12 border border-gray-600/50 bg-gray-700/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-cyan-400 mb-2">
                <strong>How to get your API key:</strong>
              </p>
              <ol className="text-sm text-gray-300 mb-3 space-y-1 list-decimal list-inside">
                <li>Visit Google AI Studio</li>
                <li>Click "Get API Key"</li>
                <li>Select "Create API key"</li>
                <li>Copy the key and paste it above</li>
              </ol>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Open Google AI Studio <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-300">
                Your API key is saved securely in your browser and never sent to any server except Google's Gemini API.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg font-medium transition-colors border border-gray-600/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || isLoading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Checking key...' : 'Save & Initialize'}
          </button>
        </div>
      </div>
    </div>
  );
};