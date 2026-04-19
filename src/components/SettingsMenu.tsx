"use client";

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SettingsMenu() {
  const { state, setKeys, setThemeColor } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState(state.openAiKey || '');
  const [geminiKey, setGeminiKey] = useState(state.geminiKey || '');
  // themeColor applies instantly to the store for live preview
  const themeColor = state.themeColor || '#ff87be';

  const handleSave = () => {
    setKeys(openaiKey || null, geminiKey || null);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-surface-container-high transition-colors focus-glow"
        aria-label="Settings"
      >
        <Settings className="w-6 h-6 text-primary" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-panel rounded-xl shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-on-surface-variant hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-display font-bold mb-6 text-on-surface">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Google Gemini API Key
                </label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 rounded-md bg-surface-container-low text-on-surface border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  OpenAI API Key
                </label>
                <input 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 rounded-md bg-surface-container-low text-on-surface border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
                <p className="text-xs text-on-surface-variant mt-2">
                  Keys are stored locally in your browser. Leave blank if using environment variables.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-3">
                  Theme Color
                </label>
                <div className="flex gap-3">
                  {[
                    { name: 'Axolotl Pink', hex: '#ff87be' },
                    { name: 'Nebula Purple', hex: '#b988ff' },
                    { name: 'Cyan Glow', hex: '#40e0d0' },
                    { name: 'Electric Green', hex: '#39ff14' },
                    { name: 'Sunset Orange', hex: '#ff6b6b' },
                  ].map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setThemeColor(color.hex)}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        themeColor === color.hex ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex, color: color.hex }}
                    />
                  ))}
                  
                  {/* Custom color picker */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:scale-105 transition-transform"
                       style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                    <input 
                      type="color" 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Custom Color"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full mt-4 py-3 gradient-primary text-on-primary font-bold rounded-full glow-hover transition-all shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
