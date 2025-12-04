import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/'); // Mobalik sa homepage human mag-login/signup
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-(--bg-secondary) rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-(--text-primary)">
          {isLogin ? 'Login to NikzFlix' : 'Create an Account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-(--text-secondary)">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-(--bg-tertiary) rounded-md focus:outline-none focus:ring-2 focus:ring-(--brand-color)"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 font-bold bg-(--brand-color) rounded-md hover:bg-red-700 transition-colors"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-(--text-secondary)">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-(--brand-color) hover:underline ml-2"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};
