// Core benchmark utilities shared across different benchmark configurations
const { exec } = require('child_process')
const fs = require('fs')
const util = require('util')

const execAsync = util.promisify(exec)

function parseResults(output) {
  const jsonString = output.match(/\[.*\]/)
  return jsonString ? JSON.parse(jsonString[0]) : []
}

function createMarkdownTable(results, commandNames) {
  const benchmarks = new Set()

  commandNames.forEach((name) => {
    results[name].forEach((entry) => {
      benchmarks.add(entry.name)
    })
  })

  const benchmarkArray = Array.from(benchmarks)
  const columnWidths = [Math.max(...benchmarkArray.map((b) => b.length), 37)]

  commandNames.forEach((name) => {
    const maxLength = Math.max(
      ...results[name].map((entry) => entry.result.toString().length),
      name.length,
      17
    )
    columnWidths.push(maxLength)
  })

  let table = '| Benchmark (Higher scores are better)  '
  commandNames.forEach((name, index) => {
    table += `| ${name.padEnd(columnWidths[index + 1])} `
  })
  table += '|\n'

  table += '|-' + '-'.repeat(columnWidths[0]) + '-'
  commandNames.forEach((_, index) => {
    table += '|-' + '-'.repeat(columnWidths[index + 1]) + '-'
  })
  table += '|\n'

  benchmarkArray.forEach((benchmark) => {
    const row = [`| ${benchmark.padEnd(columnWidths[0])}`]
    commandNames.forEach((name, index) => {
      const result = results[name].find((entry) => entry.name === benchmark)
      row.push(
        `| ${
          result
            ? result.result.toString().padEnd(columnWidths[index + 1])
            : 'N/A'.padEnd(columnWidths[index + 1])
        }`
      )
    })
    table += `${row.join(' ')} |\n`
  })

  return table
}

function createCSV(results, commandNames) {
  let csv = 'Benchmark,'
  csv += commandNames.join(',') + '\n'

  const benchmarks = new Set()

  commandNames.forEach((name) => {
    results[name].forEach((entry) => {
      benchmarks.add(entry.name)
    })
  })

  benchmarks.forEach((benchmark) => {
    const row = [benchmark]
    commandNames.forEach((name) => {
      const result = results[name].find((entry) => entry.name === benchmark)
      row.push(result ? result.result.toString() : 'N/A')
    })
    csv += `${row.join(',')}\n`
  })

  return csv
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let idx = 0

  const runOne = async () => {
    while (true) {
      const myIdx = idx++
      if (myIdx >= items.length) return
      results[myIdx] = await worker(items[myIdx], myIdx)
    }
  }

  const n = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: n }, runOne))
  return results
}

// Run a single engine once and return parsed results
async function runOnce(name, command) {
  const startTime = Date.now()
  console.log(`Starting ${name}...`)
  try {
    const { stdout } = await execAsync(command, { timeout: 300000 })
    const elapsed = Date.now() - startTime
    const r = parseResults(stdout)
    console.log(`${name} completed in ${(elapsed / 1000).toFixed(2)}s`, r)
    return r
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`Error executing ${name} (after ${(elapsed / 1000).toFixed(2)}s): ${error.message}`)
    return []
  }
}

// Run one engine multiple times sequentially and average results per benchmark
async function runMultipleAndAggregate(name, command, times, warmupTimes, cooldownMs) {
  /** @type {Array<Array<{name: string, result: number}>>} */
  const allRuns = []
  const totalStartTime = Date.now()

  // Warm up to reduce cold-start / frequency ramp / cache effects.
  for (let i = 0; i < warmupTimes; i++) {
    console.log(`Warmup ${i + 1} / ${warmupTimes} for ${name}...`)
    await runOnce(name, command)
    if (cooldownMs > 0) {
      await new Promise((r) => setTimeout(r, cooldownMs))
    }
  }

  for (let i = 0; i < times; i++) {
    console.log(`Run ${i + 1} / ${times} for ${name}...`)
    const runResult = await runOnce(name, command)
    allRuns.push(runResult)
    if (cooldownMs > 0) {
      await new Promise((r) => setTimeout(r, cooldownMs))
    }
  }

  const totalElapsed = Date.now() - totalStartTime
  console.log(
    `${name} finished ${warmupTimes} warmups + ${times} runs in ${(totalElapsed / 1000).toFixed(2)}s (avg: ${(
      totalElapsed /
      Math.max(1, warmupTimes + times) /
      1000
    ).toFixed(2)}s per run)`
  )

  const aggregateMap = new Map()

  allRuns.forEach((run) => {
    run.forEach((entry) => {
      const key = entry.name
      const value = Number(entry.result)
      if (Number.isNaN(value)) {
        return
      }
      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, { name: key, total: 0, count: 0 })
      }
      const agg = aggregateMap.get(key)
      agg.total += value
      agg.count += 1
    })
  })

  return Array.from(aggregateMap.values()).map((agg) => ({
    name: agg.name,
    result: agg.count > 0 ? Math.round(agg.total / agg.count) : 0,
  }))
}

/**
 * Run benchmark with given commands
 * @param {Array<{name: string, command: string}>} commands
 * @param {string} csvFilename - Output CSV filename
 */
async function runBenchmark(commands, csvFilename = 'benchmark_results.csv') {
  const results = {}
  const repeatTimes = Number(process.env.BENCH_REPEAT) || 3
  const warmupTimes = Number(process.env.BENCH_WARMUP) || 0
  const cooldownMs = Number(process.env.BENCH_COOLDOWN_MS) || 0

  // Keep original behavior by default (fully parallel). Set BENCH_CONCURRENCY to limit parallelism.
  const envConcurrency = Number(process.env.BENCH_CONCURRENCY)
  const concurrency =
    Number.isFinite(envConcurrency) && envConcurrency > 0
      ? Math.min(envConcurrency, commands.length)
      : commands.length

  console.log(`concurrency`, concurrency)
  await runWithConcurrency(commands, concurrency, async ({ name, command }) => {
    const aggregated = await runMultipleAndAggregate(
      name,
      command,
      repeatTimes,
      warmupTimes,
      cooldownMs
    )
    results[name] = aggregated
    return null
  })

  const engineNames = commands.map((cmd) => cmd.name)

  const markdownTable = createMarkdownTable(results, engineNames)
  console.log('Markdown Table:')
  console.log(markdownTable)

  const csvContent = createCSV(results, engineNames)

  fs.writeFileSync(csvFilename, csvContent)
  console.log(`CSV file has been saved as ${csvFilename}`)
}

module.exports = {
  parseResults,
  createMarkdownTable,
  createCSV,
  runWithConcurrency,
  runOnce,
  runMultipleAndAggregate,
  runBenchmark,
}

