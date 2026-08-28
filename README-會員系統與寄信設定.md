# ONE STROKE CLUB｜會員系統進階優化版

## 本版已加入
- 三步驟會員註冊：基本資料 → 品牌偏好問答 → Email 驗證
- 問答：從哪裡知道 OSC、感興趣內容、平常尺寸
- 新會員 NT$200 折價券：`OSC200`
- 結帳時輸入優惠序號，單筆滿 NT$1,000 折 NT$200
- 會員中心：購物里程、收藏、我的清單、訂單、個人資料、通知、優惠券
- 三款正式商品：目前只販售三款上衣
- 褲子／外套／配件目前顯示「敬請期待」
- Community CTA 可導向會員註冊或社群訂閱入口
- 會員面板與結帳面板加入淡入、位移、玻璃質感等動態
- 正式透明 Logo：`assets/logo-transparent.png`
- 使用者提供的衣服 Logo：`assets/shirt-logo-official.png`
- 官方信箱：`onestroketw@gmail.com`

## 關於「註冊後寄歡迎信」
瀏覽器純前端無法安全地直接用官方信箱發信，因此本版已預留 EmailJS 寄信介面：

1. 到 EmailJS 建立 Email Service / Template。
2. 將 `script.js` 最上方的 `EMAIL_CONFIG`：
   - `serviceId`
   - `templateId`
   - `publicKey`
   改成你的 EmailJS 設定。
3. Template 可使用以下變數：
   - `{{to_email}}`
   - `{{to_name}}`
   - `{{coupon_code}}`
   - `{{coupon_value}}`
   - `{{verification_code}}`
   - `{{from_email}}`
   - `{{subject}}`
   - `{{message_html}}`
4. 設定完成後，註冊完成會實際寄出歡迎／驗證信。

目前若沒有設定 EmailJS，網站會進入「預覽模式」，仍可測試完整註冊流程，但不會假裝已經寄出真實郵件。

## 正式上線建議
前端 localStorage 會員系統只適合原型／展示。正式營運應改用 Supabase / Firebase Auth 或自有後端，密碼不可放在瀏覽器 localStorage；優惠券、訂單、點數、付款與庫存也應由伺服器驗證。
