# Gửi mẹ yêu · 20/10

Website chúc mẹ nhân ngày Phụ nữ Việt Nam, với chữ ký **Made with love by Duc Le**.
HTML, CSS và JavaScript thuần, không backend, không cơ sở dữ liệu, không cần biến môi trường.

## Chạy trên máy

Yêu cầu Node.js 22 trở lên. Không cần cài thư viện.

```sh
npm run dev
```

Mở http://127.0.0.1:4173. Bản build:

```sh
npm run build
npm run preview
```

## Deploy Vercel

Import repository này trong Vercel. Cấu hình `vercel.json` đã đặt build command là
`npm run build`, output directory là `dist`, framework là Other. Không cần backend
hay biến môi trường. Các lần push sau tự động cập nhật website.

## Nội dung và giao diện

- Lời chúc riêng cho mẹ, có thể chỉnh trong `js/data.js` và `index.html`.
- Hoa nở khi chạm, bó hoa được gói khi cuộn, mười lời chúc và khu vườn sáu bông hoa.
- Đã bỏ component tạo/gửi thiệp cùng mọi nút dẫn đến nó.
- Đã bỏ dòng “Gửi những người phụ nữ của chúng ta”.
- Font được lưu tại `fonts/`, không phụ thuộc Google Fonts khi truy cập.
- Có giao diện điện thoại, điều khiển bằng bàn phím và hỗ trợ giảm chuyển động.

Giao diện và hiệu ứng frontend được điều chỉnh từ trang mẫu do người dùng cung cấp:
https://2010vn.vercel.app/?xung=mom. Các font Be Vietnam Pro, Fraunces và Pinyon Script
được phân phối theo SIL Open Font License; giấy phép đi kèm trong `fonts/`.
