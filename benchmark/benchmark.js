const { exec } = require('child_process')
const fs = require('fs')

function parseResults(output) {
  const jsonString = output.match(/\[.*\]/)
  return jsonString ? JSON.parse(jsonString[0]) : []
}

function createMarkdownTable(results, commandNames) {
  let table = '| Benchmark (Higher scores are better) '
  commandNames.forEach((name) => {
    table += `| ${name} Result `
  })
  table += '|\n'

  table += '|-------------------------------------'
  commandNames.forEach(() => {
    table += '|------------------'
  })
  table += '|\n'

  const benchmarks = new Set()

  commandNames.forEach((name) => {
    results[name].forEach((entry) => {
      benchmarks.add(entry.name)
    })
  })

  benchmarks.forEach((benchmark) => {
    const row = [`| ${benchmark.padEnd(36)}`]
    commandNames.forEach((name) => {
      const result = results[name].find((entry) => entry.name === benchmark)
      row.push(
        `| ${result ? result.result.toString().padEnd(16) : 'N/A'.padEnd(16)}`
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
  { name: 'QuickJS', command: 'quickjs combined.js' },
  { name: 'V8 --jitless', command: 'v8 --jitless combined.js' },
  { name: 'V8', command: 'v8 combined.js' },
  { name: 'JSC', command: 'jsc combined.js' },
  // Add more engines here
]

const results = {}

commands.forEach(({ name, command }, index) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${name}: ${error.message}`)
      return
    }

    const r = parseResults(stdout)
    console.log(name, r)
    results[name] = r

    if (Object.keys(results).length === commands.length) {
      const markdownTable = createMarkdownTable(
        results,
        commands.map((cmd) => cmd.name)
      )
      console.log('Markdown Table:')
      console.log(markdownTable)

      const csvContent = createCSV(
        results,
        commands.map((cmd) => cmd.name)
      )

      fs.writeFileSync('benchmark_results.csv', csvContent)
      console.log('CSV file has been saved as benchmark_results.csv')
    }
  })
})
