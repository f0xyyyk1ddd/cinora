'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TvConnectForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Код должен состоять из 6 цифр');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/tv/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error || 'Ошибка проверки кода');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="text-green-400 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">Успешно!</h2>
        <p className="text-gray-400">Ваш телевизор теперь подключен. Вы можете закрыть эту страницу.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 bg-red-500/20 text-red-400 rounded-md text-sm text-center">{error}</div>}
      
      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="w-full bg-[#2a2a3e] border border-gray-700 rounded-lg p-4 text-center text-3xl tracking-widest font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          maxLength={6}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Проверка...' : 'Подключить'}
      </button>
    </form>
  );
}
