const { exec } = require('child_process')

function parseResults(output) {
  const jsonString = output.match(/\[.*\]/)
  return jsonString ? JSON.parse(jsonString[0]) : []
}

function createMarkdownTable(results, commandNames) {
  // Create the header row dynamically
  let table = '| Benchmark (Higher scores are better) '
  commandNames.forEach((name) => {
    table += `| ${name} Result `
  })
  table += '|\n'

  // Create the separator row dynamically
  table += '|-------------------------------------'
  commandNames.forEach(() => {
    table += '|------------------'
  })
  table += '|\n'

  const benchmarks = new Set()

  // Collect all benchmark names from all results
  commandNames.forEach((name) => {
    results[name].forEach((entry) => {
      benchmarks.add(entry.name)
    })
  })

  // Create table rows for each benchmark
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

const commands = [
  { name: 'QuickJS', command: 'quickjs combined.js' },
  { name: 'V8 --jitless', command: 'v8 --jitless combined.js' },
  { name: 'V8', command: 'v8 combined.js' },
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
      console.log(markdownTable)
    }
  })
})
