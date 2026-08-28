# ONE STROKE CLUB × Supabase

這一版已把「正式會員資料」從 localStorage 移到 Supabase。

## 1. 建立 Supabase Project

在 Supabase 建立新 Project，取得：
- Project URL
- Publishable/Anon Key

只把 **Publishable/Anon Key** 放到前端；絕對不要放 service_role key。

## 2. 執行資料庫 Schema

打開 Supabase Dashboard → SQL Editor → 新增 Query，貼上：

`supabase-schema.sql`

執行後會建立：
- profiles：會員姓名、手機、來源、興趣、尺寸
- favorites：收藏
- orders / order_items：訂單
- points_ledger：購物里程
- coupons：OSC200 新會員券
- notifications：會員通知
- community_subscribers：Community 訂閱
- 新會員 trigger：註冊後自動建立 profile + OSC200 + 歡迎通知
- RLS：會員只能讀寫自己的會員資料

## 3. 填入前端 Supabase 設定

打開 `index.html`，找到：

```html
<script>window.OSC_SUPABASE_URL = "YOUR_SUPABASE_URL"; window.OSC_SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";</script>
```

替換成你的 Project URL 與 Publishable/Anon Key。

## 4. 開啟 Email 驗證

Supabase Dashboard → Authentication → Providers / Email：
- 啟用 Email provider
- 建議開啟 Confirm email

會員註冊後，Supabase Auth 會寄驗證信。

## 5. 自訂驗證信

Authentication → Email Templates → Confirm signup

建議內容：

「歡迎加入 ONE STROKE CLUB」

「你的新會員優惠碼：OSC200」

「單筆滿 NT$1,000 折 NT$200」

正式商用時，建議設定自己的 SMTP（例如 Resend / Postmark / SendGrid）與品牌寄件地址。

## 6. 官方信箱

網站官方信箱：

`onestroketw@gmail.com`

如果要用這個信箱作為真正寄件者，需要在你的 SMTP / Email provider 完成寄件網域或寄件人設定。前端不能安全地直接使用 Gmail 密碼寄信。

## 7. 本版資料策略

- 會員：Supabase Auth
- 會員資料：Supabase `profiles`
- 收藏：Supabase `favorites`
- 訂單：Supabase `orders` / `order_items`
- 購物里程：Supabase `points_ledger`
- 優惠券：Supabase `coupons`
- 通知：Supabase `notifications`
- Community Email：Supabase `community_subscribers`
- 購物袋：目前仍以 localStorage 作為「尚未結帳的暫存購物袋」；正式電商可再建立 `carts/cart_items`，讓會員跨裝置同步購物袋。

## 8. 正式上線前建議

目前前端已可直接連 Supabase，但真正商用結帳建議再加入：
- 金流（綠界 / 藍新 / Stripe 等）
- 物流
- Server-side checkout RPC / Edge Function
- Webhook 更新付款狀態
- 管理員後台
- 商品資料表與庫存
- 圖片 Storage / CDN
- Rate limiting / Bot protection

尤其「扣優惠券、建立訂單、增加里程」正式上線應改成 Supabase Edge Function / RPC 原子交易，避免使用者重複送出造成重複扣券或重複點數。
