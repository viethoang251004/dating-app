# 💕 Breeze – Mini Dating App Prototype

Demo: [link Vercel sau khi deploy]  
Repo: [link GitHub của bạn]

## Cách chạy

```bash
npm install
npm run dev
```

Build & deploy:
```bash
npm run build   # output vào /dist
```

---

## Tổ chức hệ thống

```
src/
  App.jsx   # Toàn bộ logic + UI (chia thành các component)
  App.css   # Stylesheet
  main.jsx  # Entry point
```

Ứng dụng là Single-Page App (React + Vite), toàn bộ state được đồng bộ về `localStorage`.

### Các component chính

| Component | Vai trò |
|---|---|
| `UserSelector` | Chọn profile hiện tại (không cần auth) |
| `CreateProfile` | Part A - Tạo profile |
| `BrowseProfiles` | Part B - Xem & Like |
| `MatchesView` | Danh sách match |
| `AvailabilityPicker` | Part C - Chọn lịch rảnh & tìm slot trùng |

---

## Lưu data bằng gì

**localStorage** - không cần backend.  
Key/value schema:

```
profiles        -> Profile[]          // Danh sách tất cả user
likes           -> { email: { email: true } }  // A đã like B
matches         -> { "emailA|emailB": true }    // Các cặp đã match
availabilities  -> { email: Slot[] }            // Lịch rảnh từng user
```

---

## Logic Match

```
A like B -> likes[A.email][B.email] = true
Khi A like B, kiểm tra: likes[B.email]?.[A.email] === true
Nếu đúng -> Match! -> Lưu vào matches[sorted(A,B).join("|")]
```

Match được lưu ngay lập tức và hiển thị popup "It's a Match!".

---

## Logic tìm slot trùng

```js
function findCommonSlot(slotsA, slotsB) {
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.date !== b.date) continue;
      const overlapStart = max(a.startTime, b.startTime);
      const overlapEnd = min(a.endTime, b.endTime);
      if (overlapStart < overlapEnd) return { date, overlapStart, overlapEnd };
    }
  }
  return null; // không có slot trùng
}
```

Hàm so sánh chuỗi `"HH:MM"` trực tiếp (lexicographic = chronological).  
Trả về **slot trùng đầu tiên** tìm được (first common slot).

---

## Nếu có thêm thời gian sẽ cải thiện gì

- **Backend thực sự** (Supabase / Firebase) để nhiều người dùng trên nhiều thiết bị
- **Real-time updates** - khi B like A, A nhận notification ngay
- **Upload ảnh** cho profile thay vì avatar chữ cái
- **Chat** sau khi match

---

## 3 tính năng đề xuất thêm

1. **In-app messaging** - Sau khi match, cho phép 2 người nhắn tin để biết nhau trước khi hẹn. Đây là tính năng core của mọi dating app, tăng engagement nhiều nhất.

2. **Filter & Discovery algorithm** - Cho phép lọc theo độ tuổi, giới tính, khoảng cách. Người dùng thấy profile phù hợp hơn -> tỷ lệ match cao hơn -> retention cao hơn.

3. **Streak & Gamification** - Thưởng "streak" khi người dùng dùng app mỗi ngày hoặc badge khi có match đầu tiên. Tăng daily active user mà không cần thay đổi core logic.
