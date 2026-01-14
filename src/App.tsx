import { useState } from 'react';
import AppModern from './AppModern';
import AppLawFirm from './AppLawFirm';

export default function App() {
  const [theme, setTheme] = useState<'modern' | 'lawfirm'>('lawfirm');

  return (
    <div>
      {/* Theme Switcher */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('modern')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              theme === 'modern'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Modern Theme
          </button>
          <button
            onClick={() => setTheme('lawfirm')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              theme === 'lawfirm'
                ? 'bg-amber-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Law Firm Theme
          </button>
        </div>
      </div>

      {/* Render Selected Theme */}
      {theme === 'modern' ? <AppModern /> : <AppLawFirm />}
    </div>
  );
}