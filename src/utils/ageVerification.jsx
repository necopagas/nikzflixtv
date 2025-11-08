/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';

// Age verification for 18+ content
export const useAgeVerification = () => {
  const [isVerified, setIsVerified] = useState(() => {
    const verified = localStorage.getItem('age_verified');
    return verified === 'true';
  });

  const verifyAge = birthYear => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age >= 18) {
      localStorage.setItem('age_verified', 'true');
      setIsVerified(true);
      return true;
    }
    return false;
  };

  const resetVerification = () => {
    localStorage.removeItem('age_verified');
    setIsVerified(false);
  };

  return { isVerified, verifyAge, resetVerification };
};

// Age Verification Modal Component
export const AgeVerificationModal = ({ onVerify, onCancel }) => {
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();

    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();

    if (!year || year < 1900 || year > currentYear - 18) {
      setError('You must be 18 years or older to access this content.');
      return;
    }

    const age = currentYear - year;
    if (age >= 18) {
      onVerify(year);
    } else {
      setError('You must be 18 years or older to access this content.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-600 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔞</div>
          <h2 className="text-2xl font-bold text-white mb-2">Age Verification Required</h2>
          <p className="text-gray-400">This content is restricted to users 18 years and older.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter your birth year:
            </label>
            <input
              type="number"
              value={birthYear}
              onChange={e => {
                setBirthYear(e.target.value);
                setError('');
              }}
              placeholder="e.g., 2000"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              min="1900"
              max={new Date().getFullYear()}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Verify Age
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          By clicking "Verify Age", you confirm that you are 18 years or older.
        </p>
      </div>
    </div>
  );
};

// Default export for React Fast Refresh
export default AgeVerificationModal;
