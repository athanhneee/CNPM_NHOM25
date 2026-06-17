# Checklist chốt DB demo

Ngày rà soát: 2026-05-14.  
Phạm vi: chỉ đọc `backend/prisma/seed.ts`, `docs/demo-snapshot-2026-05-13.json` và tài liệu demo hiện có. Không chạy seed/reset/import DB thật.

## Trạng thái khuyến nghị

Chốt DB demo hiện tại theo snapshot evidence `docs/demo-snapshot-2026-05-13.json` cho các flow read-only, waitlist và prerequisite fail. Không chạy `npm run prisma:seed`, `/snapshot/reset` hoặc `/snapshot/import` trên DB demo sát giờ báo cáo nếu chưa export snapshot mới và chưa có người chịu trách nhiệm xác nhận.

Seed source hiện mới hơn snapshot: `backend/prisma/seed.ts` đã có thêm `CSE150` và section `CSE150-1` để tạo một lớp mở sạch cho demo đăng ký thành công. Snapshot evidence ngày 2026-05-13 chưa có `CSE150/CSE150-1`, nên nếu DB demo đang đúng snapshot này thì chưa nên hứa flow đăng ký thành công live bằng `CSE150` cho đến khi rehearsal trên DB đã cập nhật.

## So sánh seed source và snapshot

| Case | Seed source `backend/prisma/seed.ts` | Snapshot `docs/demo-snapshot-2026-05-13.json` | Ghi chú demo |
| --- | --- | --- | --- |
| Course catalog | Có `CSE101`, `CSE201`, `CSE150`, `CSE301` | Có `CSE101`, `CSE201`, `CSE301` | `CSE150` chỉ có trong seed source hiện tại. |
| Section đăng ký sạch | Có `CSE150-1`, capacity 35, `REGISTERED=0`, `WAITLIST=0`, `OPEN` | Không có `CSE150-1` | Muốn demo đăng ký thành công live nên chuẩn bị DB/snapshot mới có section này. |
| Waitlist | `CSE101-2` capacity 1, đã có 1 registered và 1 waitlisted | Có `enr-waitlist-cse101`, student `N23DCCN002`, `waitlistOrder=1` | Đủ evidence để demo/xem waitlist read-only. |
| Prerequisite fail | `N23DCCN002` bị reject ở `CSE201-1` với `REG_ERR_PREREQUISITE_NOT_MET` | Có `enr-rejected-cse201`, `reasonCode=REG_ERR_PREREQUISITE_NOT_MET` | Đủ evidence cho flow rule tiên quyết. |
| Nguyện vọng | Có `wish-cse301-extra` PENDING | Có `wish-cse301-extra` PENDING | Có thể xem/duyệt thử nếu đã snapshot trước; mutation nên đánh dấu Manual pending khi chưa muốn đổi DB. |

## Checklist trước ngày demo

- [ ] Xác nhận DB đang dùng là snapshot nào: evidence 2026-05-13 hay bản đã seed/export mới hơn.
- [ ] Nếu vẫn dùng `docs/demo-snapshot-2026-05-13.json`, dùng các flow read-only cho waitlist/prerequisite và tránh demo live “đăng ký thành công CSE150”.
- [ ] Nếu muốn demo đăng ký thành công live, chuẩn bị DB rehearsal có `CSE150/CSE150-1`, chạy thử một lần, rồi export snapshot mới đặt tên theo ngày.
- [ ] Không chạy `npm run prisma:seed`, `/snapshot/reset`, `/snapshot/import` trên DB demo khi chưa có snapshot backup.
- [ ] Ghi lại mọi mutation live trong `docs/manual-test-evidence.md`: tài khoản, section, trạng thái trước/sau và cách hoàn nguyên.
- [ ] Giữ `TEST_DATABASE_URL` riêng nếu muốn chạy backend integration; không dùng DB demo thật cho integration.

## Ghi chú rủi ro có chủ đích

- `reviewNote` của nguyện vọng đang được frontend gửi lên backend và backend lưu trong audit metadata. Chưa thêm cột `WishRequest.reviewNote` vì cần migration/apply DB, không phù hợp sát deadline nếu DB demo đã ổn.
- Các file frontend lớn như `frontend/src/features/academic/academic-pages.tsx`, `frontend/src/features/student/student-pages.tsx`, `frontend/src/features/admin/admin-pages.tsx` và `frontend/src/features/pages.tsx` là hạn chế bảo trì sau báo cáo. Giai đoạn hiện tại chỉ nên sửa lỗi nhỏ, không refactor lớn.
