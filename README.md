# CRM Realtime Dashboard

## Chạy nhanh
1. Mở file `index.html` trong trình duyệt.
2. Hoặc chạy local server:
   - `python -m http.server 8080`
   - mở `http://localhost:8080`

## Nguồn dữ liệu
Dashboard đang đọc trực tiếp từ Google Sheet:
- Sheet ID: `1NgLuWiU3zzmTX3aKpykD7rqj2-x5x1nD1FyQlZUTE2U`
- GID: `1810436556`

## Nếu không thấy dữ liệu
Cần để sheet ở chế độ public read:
1. Google Sheet -> `Share` -> `Anyone with the link` -> `Viewer`
2. Nếu vẫn lỗi, vào `File` -> `Share` -> `Publish to web` cho đúng tab dữ liệu.

## Tính năng
- Auto refresh mỗi 30 giây
- KPI tổng quan lead
- Biểu đồ trạng thái liên hệ
- Biểu đồ tiến độ chăm sóc lần 1/2/3
- Lọc theo Leader, PIC, Ngành học, Hệ đào tạo
- Bảng chi tiết lead
