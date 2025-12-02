import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../authentication/AuthContext';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [password, setPassword] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingApiKey, setIsClearingApiKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        setIsFetching(true);
        const response = await fetch('http://localhost:3000/api/user/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load profile.');
        }

        const data = await response.json();
        if (!ignore) {
          setProfileName(data.user?.name ?? '');
          setEmail(data.user?.email ?? '');
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load profile.');
        }
      } finally {
        if (!ignore) {
          setIsFetching(false);
        }
      }
    };

    const loadApiKeyFlag = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/user/has-api-key', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to load API key status.');
        }
        const data = await response.json();
        if (!ignore) {
          setHasStoredApiKey(Boolean(data.hasApiKey));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadProfile();
    loadApiKeyFlag();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileName.trim()) {
      setError('Name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: Record<string, string> = {
        name: profileName.trim(),
        email: email.trim(),
        apiKey: apiKey.trim(),
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await fetch('http://localhost:3000/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to update profile.');
      }

      setMessage('Profile updated successfully.');
      setPassword('');
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: profileName.trim(),
              email: email.trim(),
              apiKey: apiKey.trim(),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = async () => {
    setIsClearingApiKey(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3000/api/user/api-key', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to clear API key.');
      }

      setApiKey('');
      setHasStoredApiKey(false);
      setMessage('API key cleared successfully.');
      setUser((prev) => (prev ? { ...prev, apiKey: '' } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear API key.');
    } finally {
      setIsClearingApiKey(false);
    }
  };

  if (isFetching) {
    return <div className="p-6 text-lg">Loading account...</div>;
  }

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-lg bg-white p-8 shadow">
      <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
      <p className="mt-1 text-sm text-gray-600">
        Display name:
        <span className="font-medium">{profileName || 'Not set'}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-canvas-light-blue focus:outline-none"
          placeholder="Enter your name"
        />
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-canvas-light-blue focus:outline-none"
          placeholder="Enter your email"
          required
        />
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-canvas-light-blue focus:outline-none"
          placeholder="Enter a new password (leave blank to keep current)"
        />
        <label className="block text-sm font-medium text-gray-700" htmlFor="apiKey">
          API key
        </label>
        <input
          id="apiKey"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-canvas-light-blue focus:outline-none"
          placeholder="Enter your API key"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-canvas-light-blue px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={handleClearApiKey}
            disabled={isClearingApiKey || (!apiKey && !hasStoredApiKey)}
            className="rounded border border-red-500 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isClearingApiKey ? 'Clearing...' : 'Clear API key'}
          </button>
        </div>
      </form>
    </div>
  );
}
