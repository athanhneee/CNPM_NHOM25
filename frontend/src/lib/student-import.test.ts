import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildImportedStudentUser,
  parseStudentGrid,
  parseStudentText,
} from './student-import.ts'

test('parseStudentText keeps rows with Ho ten and MSSV order', () => {
  const preview = parseStudentText(
    [
      'Họ tên\tMSSV\tGhi chú',
      'Nguyễn Thị Mỹ Duyên\tN23DCCN199\tCNTT',
      'Trần An Bình\tN23DCAT088\tATTT',
    ].join('\n'),
  )

  assert.equal(preview.candidates.length, 2)
  assert.equal(preview.issues.length, 0)
  assert.equal(preview.candidates[0]?.fullName, 'Nguyễn Thị Mỹ Duyên')
  assert.equal(preview.candidates[0]?.code, 'N23DCCN199')
  assert.equal(preview.candidates[1]?.code, 'N23DCAT088')
})

test('parseStudentGrid reports invalid rows but still keeps valid ones', () => {
  const preview = parseStudentGrid([
    ['Họ tên', 'MSSV', 'Lớp'],
    ['Nguyễn Văn A', 'N23DCCN123', 'CNTT'],
    ['Thiếu mã'],
    ['Sai mã', 'MSSV???'],
  ])

  assert.equal(preview.candidates.length, 1)
  assert.equal(preview.issues.length, 2)
  assert.match(preview.issues[0]?.message ?? '', /Thiếu họ tên hoặc MSSV/)
  assert.match(preview.issues[1]?.message ?? '', /không đúng định dạng/)
})

test('buildImportedStudentUser infers role and major from student code', () => {
  const cntt = buildImportedStudentUser(
    {
      fullName: 'Nguyễn Văn A',
      code: 'N23DCCN123',
      rowNumber: 2,
    },
    1,
  )

  const attt = buildImportedStudentUser(
    {
      fullName: 'Trần Thị B',
      code: 'N23DCAT088',
      rowNumber: 3,
    },
    2,
  )

  const review = buildImportedStudentUser(
    {
      fullName: 'Lưu Minh C',
      code: 'N22DCPT006',
      rowNumber: 4,
    },
    3,
  )

  assert.equal(cntt.roles[0], 'STUDENT')
  assert.equal(cntt.username, 'N23DCCN123')
  assert.equal(cntt.majorCode, '7480201')
  assert.equal(cntt.studentClass, 'D23CNTT1')

  assert.equal(attt.majorCode, '7480202')
  assert.equal(attt.studentClass, 'D23ATTT1')

  assert.equal(review.majorCode, 'UNREVIEWED')
  assert.equal(review.classificationStatus, 'REVIEW')
})
