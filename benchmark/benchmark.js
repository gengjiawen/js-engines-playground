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

const commands = [
  { name: 'QuickJS', command: 'qjs combined.js' },
  { name: 'QuickJS Bellard', command: 'qjs_bellard combined.js' },
  { name: 'V8 --jitless', command: 'v8 --jitless combined.js' },
  { name: 'V8', command: 'v8 combined.js' },
  { name: 'JSC', command: 'jsc combined.js' },
  // Add more engines here
]

// Run a single engine once and return parsed results
async function runOnce(name, command) {
  console.log(`Starting ${name}...`)
  try {
    const { stdout } = await execAsync(command, { timeout: 300000 })
    const r = parseResults(stdout)
    console.log(name, r)
    return r
  } catch (error) {
    console.error(`Error executing ${name}: ${error.message}`)
    return []
  }
}

// Run one engine multiple times sequentially and average results per benchmark
async function runMultipleAndAggregate(name, command, times) {
  /** @type {Array<Array<{name: string, result: number}>>} */
  const allRuns = []

  for (let i = 0; i < times; i++) {
    console.log(`Run ${i + 1} / ${times} for ${name}...`)
    const runResult = await runOnce(name, command)
    allRuns.push(runResult)
  }

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

async function main() {
  const results = {}
  const repeatTimes = 3

  for (const { name, command } of commands) {
    const aggregated = await runMultipleAndAggregate(name, command, repeatTimes)
    results[name] = aggregated
  }

  const engineNames = commands.map((cmd) => cmd.name)

  const markdownTable = createMarkdownTable(results, engineNames)
  console.log('Markdown Table:')
  console.log(markdownTable)

  const csvContent = createCSV(results, engineNames)

  fs.writeFileSync('benchmark_results.csv', csvContent)
  console.log('CSV file has been saved as benchmark_results.csv')
}

main().catch((err) => {
  console.error('Benchmark runner failed:', err)
  process.exitCode = 1
})
