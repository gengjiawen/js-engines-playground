const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function updateVersionInFile(filePath, date) {
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const updatedContent = fileContent.replace(
    /(const version = )"[^"]*"/,
    `\$1"${date}"`
  )

  console.log(updatedContent)
  fs.writeFileSync(filePath, updatedContent, 'utf8')
}

function formatDateToYYYYMD(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() returns 0-11
  const day = date.getDate()
  return `${year}.${month}.${day}`
}

function generateRandomDateList(months) {
  const dates = []
  const now = new Date()

  for (let i = 0; i < months.length; i++) {
    const month = months[i]
    const randomDay = Math.floor(Math.random() * 28) + 1 // Generate a random day between 1 and 28
    const date = new Date(now.getFullYear(), month - 1, randomDay)

    // Set random work hours (9 AM to 5 PM)
    const randomHour = Math.floor(Math.random() * 8) + 9 // 9 to 16 (9 AM to 5 PM)
    const randomMinute = Math.floor(Math.random() * 60) // 0 to 59
    const randomSecond = Math.floor(Math.random() * 60) // 0 to 59

    date.setHours(randomHour, randomMinute, randomSecond)

    const formattedDate = formatDateToYYYYMD(date) // Format to YYYY.m.d
    dates.push(formattedDate)
    const commitDate = new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)

    // Update the version in the file
    const filePath = path.join(__dirname, 'backend/libs/consts.ts')
    updateVersionInFile(filePath, formattedDate)

    // Stage the changes
    execSync('git add ' + filePath)

    // Commit the changes
    execSync(
      `git commit --quiet --date "${date.toISOString()}" -m "update version to ${commitDate}"`
    )
  }

  return dates
}

try {
  const randomDates = generateRandomDateList([2, 3, 4, 6])
  console.log(randomDates)
} catch (error) {
  console.log(error)
  console.error(error.stdout?.toString())
  console.error(error?.stderr.toString())
}
