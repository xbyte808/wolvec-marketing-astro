import { useState } from 'react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function EarlyAccessCTA() {
  const [state, setState] = useState<FormState>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      yearsCoaching: (form.elements.namedItem('yearsCoaching') as HTMLSelectElement).value,
      clientCount: (form.elements.namedItem('clientCount') as HTMLSelectElement).value,
      currentPlatform: (form.elements.namedItem('currentPlatform') as HTMLInputElement).value,
    };

    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setState('success');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-slate-950 text-xl font-semibold">You&apos;re on the list.</p>
        <p className="text-slate-600 mt-2">We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name <span className="text-slate-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
            placeholder="Your name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email <span className="text-slate-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="yearsCoaching" className="text-sm font-medium text-slate-700">
            How long have you been coaching online? <span className="text-slate-400">*</span>
          </label>
          <select
            id="yearsCoaching"
            name="yearsCoaching"
            required
            defaultValue=""
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="Less than 6 months">Less than 6 months</option>
            <option value="6–12 months">6-12 months</option>
            <option value="1–2 years">1-2 years</option>
            <option value="2+ years">2+ years</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="clientCount" className="text-sm font-medium text-slate-700">
            How many clients do you currently work with? <span className="text-slate-400">*</span>
          </label>
          <select
            id="clientCount"
            name="clientCount"
            required
            defaultValue=""
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="0–5">0-5</option>
            <option value="6–15">6-15</option>
            <option value="16–30">16-30</option>
            <option value="30+">30+</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="currentPlatform" className="text-sm font-medium text-slate-700">
          What platform do you currently use, if any?
        </label>
        <input
          id="currentPlatform"
          name="currentPlatform"
          type="text"
          className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
          placeholder="e.g. Trainerize, Everfit, TrueCoach, or none"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'loading'}
        className="mt-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-lg px-6 py-3 rounded-lg transition-colors"
      >
        {state === 'loading' ? 'Submitting...' : 'Request access'}
      </button>

      {state === 'error' && (
        <p className="text-red-600 text-sm text-center">
          Something went wrong. Please try again or email{' '}
          <a href="mailto:ellard@wolvec.ai" className="underline text-slate-800 hover:text-slate-600">
            ellard@wolvec.ai
          </a>{' '}
          directly.
        </p>
      )}
    </form>
  );
}
