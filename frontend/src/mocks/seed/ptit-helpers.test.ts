import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getMajorMappingFromStudentCode,
  getStudentClass,
  parseStudentSeed,
} from './ptit-helpers.ts'

test('parseStudentSeed keeps Vietnamese names intact', () => {
  const rows = parseStudentSeed(
    [
      'N23DCCN001\tĐặng Kim\tAn',
      'N23DCAT001\tVõ Ngọc Bảo\tAn',
    ].join('\n'),
  )

  assert.equal(rows.length, 2)
  assert.deepEqual(rows[0], {
    code: 'N23DCCN001',
    middleName: 'Đặng Kim',
    givenName: 'An',
    fullName: 'Đặng Kim An',
  })
  assert.equal(rows[1]?.fullName, 'Võ Ngọc Bảo An')
})

test('student prefix mapping keeps unknown prefixes in review status', () => {
  const cntt = getMajorMappingFromStudentCode('N23DCCN001')
  const attt = getMajorMappingFromStudentCode('N23DCAT001')
  const unknown = getMajorMappingFromStudentCode('N22DCPT006')

  assert.equal(cntt.majorCode, '7480201')
  assert.equal(cntt.classificationStatus, 'MAPPED')
  assert.equal(getStudentClass('N23DCCN001', cntt), 'D23CNTT1')

  assert.equal(attt.majorCode, '7480202')
  assert.equal(attt.classificationStatus, 'MAPPED')
  assert.equal(getStudentClass('N23DCAT001', attt), 'D23ATTT1')

  assert.equal(unknown.majorCode, 'UNREVIEWED')
  assert.equal(unknown.classificationStatus, 'REVIEW')
  assert.equal(getStudentClass('N22DCPT006', unknown), 'D22RS1')
})
