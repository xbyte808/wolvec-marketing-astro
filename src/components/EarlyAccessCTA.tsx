import { useEffect, useRef, useState } from 'react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          theme?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function EarlyAccessCTA() {
  const [state, setState] = useState<FormState>('idle');
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !widgetRef.current) return;

    function renderWidget() {
      if (!window.turnstile || !widgetRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY!,
        theme: 'dark',
        callback: (token: string) => {
          tokenRef.current = token;
        },
        'expired-callback': () => {
          tokenRef.current = '';
        },
      });
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    );
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', renderWidget);
    if (!existing) {
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    return () => script.removeEventListener('load', renderWidget);
  }, []);

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
      turnstileToken: tokenRef.current,
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
        if (window.turnstile && widgetIdRef.current !== null) {
          tokenRef.current = '';
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white text-xl font-semibold">You're on the list.</p>
        <p className="text-neutral-400 mt-2">We'll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-neutral-400">
            Full name <span className="text-brand-accent">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="bg-brand border border-white/20 rounded-md px-4 py-3 text-white placeholder-neutral-400/60 focus:outline-none focus:border-brand-accent transition-colors"
            placeholder="Your name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-neutral-400">
            Email <span className="text-brand-accent">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="bg-brand border border-white/20 rounded-md px-4 py-3 text-white placeholder-neutral-400/60 focus:outline-none focus:border-brand-accent transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="yearsCoaching" className="text-sm font-medium text-neutral-400">
            How long have you been coaching online? <span className="text-brand-accent">*</span>
          </label>
          <select
            id="yearsCoaching"
            name="yearsCoaching"
            required
            defaultValue=""
            className="bg-brand border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="Less than 6 months">Less than 6 months</option>
            <option value="6–12 months">6–12 months</option>
            <option value="1–2 years">1–2 years</option>
            <option value="2+ years">2+ years</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="clientCount" className="text-sm font-medium text-neutral-400">
            How many clients do you currently work with? <span className="text-brand-accent">*</span>
          </label>
          <select
            id="clientCount"
            name="clientCount"
            required
            defaultValue=""
            className="bg-brand border border-white/20 rounded-md px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors appearance-none"
          >
            <option value="" disabled>Select...</option>
            <option value="0–5">0–5</option>
            <option value="6–15">6–15</option>
            <option value="16–30">16–30</option>
            <option value="30+">30+</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="currentPlatform" className="text-sm font-medium text-neutral-400">
          What platform do you currently use, if any?
        </label>
        <input
          id="currentPlatform"
          name="currentPlatform"
          type="text"
          className="bg-brand border border-white/20 rounded-md px-4 py-3 text-white placeholder-neutral-400/60 focus:outline-none focus:border-brand-accent transition-colors"
          placeholder="e.g. Trainerize, Everfit, TrueCoach, or none"
        />
      </div>

      {TURNSTILE_SITE_KEY && <div ref={widgetRef} className="flex justify-center" />}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="mt-2 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-lg px-8 py-4 rounded-full transition-colors"
      >
        {state === 'loading' ? 'Submitting...' : 'Apply for early access'}
      </button>

      {state === 'error' && (
        <p className="text-red-400 text-sm text-center">
          Something went wrong. Please try again or email{' '}
          <a href="mailto:ellard@wolvec.ai" className="underline">
            ellard@wolvec.ai
          </a>{' '}
          directly.
        </p>
      )}
    </form>
  );
}
