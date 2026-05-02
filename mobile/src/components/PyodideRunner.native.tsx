import { forwardRef, useCallback, useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { PyodideRunnerHandle, PythonRunResult } from './PyodideRunner.types';

const PYODIDE_VERSION = '0.29.3';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const RUNNER_TIMEOUT_MS = 45000;
const EMPTY_OUTPUT = 'Kod çalıştı; konsola yazılan bir çıktı yok.';

type PendingRun = {
  resolve: (result: PythonRunResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type ReadyWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

type RunnerMessage =
  | { type: 'ready' }
  | { type: 'init-error'; error?: string }
  | { type: 'result'; id: string; ok: boolean; output?: string; error?: string };

const runnerHtml = String.raw`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="${PYODIDE_BASE_URL}/pyodide.js"></script>
  </head>
  <body>
    <script>
      const EMPTY_OUTPUT = ${JSON.stringify(EMPTY_OUTPUT)};
      let pyodideReadyPromise = null;

      function postMessageToNative(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }

      async function getPyodide() {
        if (!pyodideReadyPromise) {
          pyodideReadyPromise = loadPyodide({ indexURL: ${JSON.stringify(`${PYODIDE_BASE_URL}/`)} });
        }

        const pyodide = await pyodideReadyPromise;
        pyodide.setStdin({ error: true });
        return pyodide;
      }

      async function initialize() {
        try {
          await getPyodide();
          postMessageToNative({ type: 'ready' });
        } catch (error) {
          postMessageToNative({ type: 'init-error', error: error && error.message ? error.message : String(error) });
        }
      }

      async function runPython(message) {
        const stdout = [];
        const stderr = [];

        try {
          const pyodide = await getPyodide();
          pyodide.setStdout({ batched: (text) => stdout.push(text) });
          pyodide.setStderr({ batched: (text) => stderr.push(text) });

          const value = pyodide.runPython(message.code || '');
          const output = stdout.concat(stderr);
          if (value !== undefined && value !== null) output.push(String(value));

          postMessageToNative({
            type: 'result',
            id: message.id,
            ok: true,
            output: output.join('\n').trim() || EMPTY_OUTPUT,
          });
        } catch (error) {
          const errorMessage = error && error.message ? error.message : String(error);
          postMessageToNative({
            type: 'result',
            id: message.id,
            ok: false,
            output: stdout.concat(stderr).concat(errorMessage).join('\n').trim(),
            error: errorMessage,
          });
        }
      }

      function handleMessage(event) {
        try {
          const message = JSON.parse(event.data);
          if (message && message.type === 'run') runPython(message);
        } catch (error) {
          postMessageToNative({ type: 'init-error', error: error && error.message ? error.message : String(error) });
        }
      }

      document.addEventListener('message', handleMessage);
      window.addEventListener('message', handleMessage);
      initialize();
    </script>
  </body>
</html>`;

function PyodideRunner(_: object, ref: Ref<PyodideRunnerHandle>) {
  const webViewRef = useRef<WebView>(null);
  const pendingRunsRef = useRef<Map<string, PendingRun>>(new Map());
  const readyRef = useRef(false);
  const readyWaitersRef = useRef<ReadyWaiter[]>([]);
  const initErrorRef = useRef<string | null>(null);

  const waitForReady = useCallback(() => {
    if (readyRef.current) return Promise.resolve();
    if (initErrorRef.current) return Promise.reject(new Error(initErrorRef.current));

    return new Promise<void>((resolve, reject) => {
      const waiter: ReadyWaiter = { resolve, reject };
      const timeout = setTimeout(() => {
        readyWaitersRef.current = readyWaitersRef.current.filter((item) => item !== waiter);
        reject(new Error('Python ortamı hazırlanırken zaman aşımı oluştu.'));
      }, RUNNER_TIMEOUT_MS);

      waiter.resolve = () => {
        clearTimeout(timeout);
        resolve();
      };
      waiter.reject = (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      };
      readyWaitersRef.current.push(waiter);
    });
  }, []);

  const sendRunMessage = useCallback((id: string, code: string) => {
    const serialized = JSON.stringify({ id, type: 'run', code });
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(serialized)} })); true;`,
    );
  }, []);

  useImperativeHandle(ref, () => ({
    async runPython(code: string) {
      await waitForReady();

      return new Promise<PythonRunResult>((resolve, reject) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const timeout = setTimeout(() => {
          pendingRunsRef.current.delete(id);
          reject(new Error('Kod çalıştırma zaman aşımına uğradı.'));
        }, RUNNER_TIMEOUT_MS);

        pendingRunsRef.current.set(id, { resolve, reject, timeout });
        sendRunMessage(id, code);
      });
    },
  }), [sendRunMessage, waitForReady]);

  const handleRunnerMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    let message: RunnerMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message.type === 'ready') {
      readyRef.current = true;
      const waiters = readyWaitersRef.current;
      readyWaitersRef.current = [];
      waiters.forEach((waiter) => waiter.resolve());
      return;
    }

    if (message.type === 'init-error') {
      initErrorRef.current = message.error ?? 'Python ortamı başlatılamadı.';
      const waiters = readyWaitersRef.current;
      readyWaitersRef.current = [];
      waiters.forEach((waiter) => waiter.reject(new Error(initErrorRef.current ?? 'Python ortamı başlatılamadı.')));
      pendingRunsRef.current.forEach((pending) => {
        clearTimeout(pending.timeout);
        pending.reject(new Error(initErrorRef.current ?? 'Python ortamı başlatılamadı.'));
      });
      pendingRunsRef.current.clear();
      return;
    }

    if (message.type === 'result') {
      const pending = pendingRunsRef.current.get(message.id);
      if (!pending) return;

      clearTimeout(pending.timeout);
      pendingRunsRef.current.delete(message.id);
      pending.resolve({
        ok: message.ok,
        output: message.output?.trim() || (message.ok ? EMPTY_OUTPUT : 'Kod çalıştırılamadı.'),
        error: message.error,
      });
    }
  }, []);

  return (
    <View pointerEvents="none" style={styles.hiddenHost}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        javaScriptEnabled
        source={{ html: runnerHtml }}
        onMessage={handleRunnerMessage}
        onError={({ nativeEvent }) => {
          initErrorRef.current = nativeEvent.description || 'Python WebView yüklenemedi.';
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenHost: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default forwardRef(PyodideRunner);
