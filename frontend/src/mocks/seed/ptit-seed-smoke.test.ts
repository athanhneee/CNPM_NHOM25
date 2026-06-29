import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)
const sectionsSource = fs.readFileSync(path.join(currentDir, 'sections.ts'), 'utf8')
const enrollmentsSource = fs.readFileSync(path.join(currentDir, 'enrollments.ts'), 'utf8')
const coursesSource = fs.readFileSync(path.join(currentDir, 'courses.ts'), 'utf8')

test('seed sources contain full, waitlist and closed section scenarios', () => {
  assert.match(sectionsSource, /id:\s*'SEC104'[\s\S]*sectionCode:\s*'INT2102-02'[\s\S]*capacity:\s*4[\s\S]*allowWaitlist:\s*true/)
  assert.match(sectionsSource, /id:\s*'SEC112'[\s\S]*sectionCode:\s*'SEC2201-01'[\s\S]*capacity:\s*4[\s\S]*allowWaitlist:\s*true/)
  assert.match(sectionsSource, /id:\s*'SEC119'[\s\S]*sectionCode:\s*'SEC2401-01'[\s\S]*status:\s*'CLOSED'/)
})

test('seed sources keep prerequisite rejection and capstone metadata cases', () => {
  assert.match(
    enrollmentsSource,
    /studentId:\s*'N23DCCN001'[\s\S]*sectionId:\s*'SEC118'[\s\S]*status:\s*'REJECTED'[\s\S]*reasonCode:\s*'REG_ERR_PREREQUISITE_NOT_MET'/,
  )
  assert.match(
    coursesSource,
    /code:\s*['"]INT2301['"][\s\S]*courseType:\s*['"]Đồ án['"]/,
  )
})
