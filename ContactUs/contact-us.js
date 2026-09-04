/**
 * 聯絡表單設定與郵件組裝。
 * 本頁不把資料送到伺服器，而是開啟使用者電腦上的預設郵件程式。
 */
const CONTACT_CONFIG = {
  toEmail: "trade@jimmore.com.tw",
  subject: "Nine9 Contact Us Request"
};

// 集中定義表單欄位與郵件內顯示的標籤，避免重複讀取邏輯。
const CONTACT_FIELDS = [
  { id: "company", label: "Company" },
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "country", label: "Country" },
  { id: "tel", label: "Tel" },
  { id: "productInterest", label: "Product interest" },
  { id: "comments", label: "Comments" }
];

// 安全取得欄位值；欄位不存在時回傳空字串。
function getFieldValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

// 將所有欄位整理成 URL 編碼過的 mailto 連結。
function buildContactMailto() {
  const bodyLines = CONTACT_FIELDS.flatMap(field => [
    `${field.label}:`,
    getFieldValue(field.id),
    ""
  ]);

  const query = new URLSearchParams({
    subject: CONTACT_CONFIG.subject,
    body: bodyLines.join("\r\n")
  });

  return `mailto:${CONTACT_CONFIG.toEmail}?${query.toString()}`;
}

// 攔截表單送出，先驗證必填欄位，再開啟郵件程式。
function bindContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    window.location.href = buildContactMailto();
  });
}

// 等待頁面元素建立完畢後再綁定表單。
document.addEventListener("DOMContentLoaded", bindContactForm);
