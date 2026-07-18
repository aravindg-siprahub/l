'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicRoute } from '@/components/PublicRoute';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await authService.signUp({ email, password });
      
      if (data?.session) {
        setMessage('Account created successfully! Redirecting...');
        setTimeout(() => window.location.href = '/', 2000);
      } else {
        setMessage('Check your email for the confirmation link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create an account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {message && <div className="text-green-500 text-sm text-center">{message}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <div className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
      </div>
    </PublicRoute>
  );
}
