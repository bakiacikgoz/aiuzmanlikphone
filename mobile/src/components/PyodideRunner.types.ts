export type PythonRunResult = {
  ok: boolean;
  output: string;
  error?: string;
};

export type PyodideRunnerHandle = {
  runPython: (code: string) => Promise<PythonRunResult>;
};
