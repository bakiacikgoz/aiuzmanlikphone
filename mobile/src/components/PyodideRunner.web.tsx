import { forwardRef, useImperativeHandle, type Ref } from 'react';

import type { PyodideRunnerHandle, PythonRunResult } from './PyodideRunner.types';

const PYODIDE_VERSION = '0.29.3';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const EMPTY_OUTPUT = 'Kod çalıştı; konsola yazılan bir çıktı yok.';

type PyodideRuntime = {
  runPython: (code: string) => unknown;
  setStdin: (options: { error: boolean }) => void;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideRuntime>;
    __aiAcademyPyodidePromise?: Promise<PyodideRuntime>;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadPyodideScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Pyodide sadece browser veya WebView ortamında çalışır.'));
  }

  if (window.loadPyodide) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-ai-academy-pyodide="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Pyodide yüklenemedi.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_BASE_URL}/pyodide.js`;
    script.async = true;
    script.dataset.aiAcademyPyodide = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Pyodide yüklenemedi.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

async function getPyodide() {
  await loadPyodideScript();

  if (!window.loadPyodide) {
    throw new Error('Pyodide başlatıcı bulunamadı.');
  }

  window.__aiAcademyPyodidePromise ??= window.loadPyodide({ indexURL: `${PYODIDE_BASE_URL}/` });
  const pyodide = await window.__aiAcademyPyodidePromise;
  pyodide.setStdin({ error: true });
  return pyodide;
}

async function executePython(code: string): Promise<PythonRunResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  try {
    const pyodide = await getPyodide();
    pyodide.setStdout({ batched: (text) => stdout.push(text) });
    pyodide.setStderr({ batched: (text) => stderr.push(text) });

    const value = pyodide.runPython(code);
    const output = [...stdout, ...stderr];
    if (value !== undefined && value !== null) output.push(String(value));

    return {
      ok: true,
      output: output.join('\n').trim() || EMPTY_OUTPUT,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      output: [...stdout, ...stderr, message].join('\n').trim(),
      error: message,
    };
  }
}

function PyodideRunner(_: object, ref: Ref<PyodideRunnerHandle>) {
  useImperativeHandle(ref, () => ({
    runPython: executePython,
  }));

  return null;
}

export default forwardRef(PyodideRunner);
