import { test, expect, type Page } from '@playwright/test'

async function loginAs(page: Page, identifier: string) {
  await page.goto('/login')
  await page.locator('input').first().fill(identifier)
  await page.locator('input[type="password"]').fill('ptithcm2026')
  await page.locator('button[type="submit"]').click()

  await expect(page).toHaveURL(/dashboard|student|lecturer|admin|\/$/)
}

test('student can login and open registration result', async ({ page }) => {
  await loginAs(page, 'N23DCCN001')
  await expect(page.getByText('N23DCCN001').first()).toBeVisible()

  await page.goto('/student/registered')

  await expect(page.getByRole('heading', { name: 'Sinh viên - Danh sách học phần đã đăng ký / kết quả' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Mã MH' })).toBeVisible()
})

test('lecturer can login and open assigned sections', async ({ page }) => {
  await loginAs(page, 'minh.tuan')

  await page.goto('/lecturer/sections')

  await expect(page.getByRole('heading', { name: 'Giảng viên - Danh sách lớp được phân công' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Mã lớp' })).toBeVisible()
})

test('admin can login and open users and settings', async ({ page }) => {
  await loginAs(page, 'admin')

  await page.goto('/admin/users')
  await expect(page.getByRole('heading', { name: 'Quản trị - Quản lý tài khoản người dùng' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Thêm sinh viên thủ công' })).toBeVisible()

  await page.goto('/admin/settings')
  await expect(page.getByRole('heading', { name: 'Quản trị - Cấu hình tham số hệ thống' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Xuất / nhập dữ liệu' })).toBeVisible()
})
