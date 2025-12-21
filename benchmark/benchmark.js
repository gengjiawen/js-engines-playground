// Benchmark for comparing QJS versions over time
const { runBenchmark } = require('./benchmark-core')

const commands = [
  { name: 'QuickJS', command: 'qjs combined.js' },
  { name: 'QuickJS Bellard', command: 'qjs_bellard combined.js' },
  { name: 'V8 --jitless', command: 'v8 --jitless combined.js' },
  { name: 'V8', command: 'v8 combined.js' },
  { name: 'JSC', command: 'jsc combined.js' },
  // Add more engines here
]

runBenchmark(commands, 'benchmark_results.csv').catch((err) => {
  console.error('Benchmark runner failed:', err)
  process.exitCode = 1
})
