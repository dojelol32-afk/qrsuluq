<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة تحكم المحاضر - نظام الحضور الذكي</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background-color: #f4f6f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); width: 100%; max-width: 500px; }
    h2 { margin-top: 0; color: #333; font-size: 22px; text-align: center; }
    p.subtitle { color: #777; font-size: 13px; margin-bottom: 25px; text-align: center; }
    .input-group { margin-bottom: 15px; }
    .input-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 14px; color: #444; }
    .input-group input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 15px; outline: none; }
    .btn-action { width: 100%; background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    .btn-action:hover { background: #4338ca; }
    .btn-download { background: #16a34a; }
    .btn-download:hover { background: #15803d; }
    .message { margin-top: 15px; font-weight: bold; font-size: 14px; text-align: center; }
    .message.success { color: #16a34a; }
    .message.error { color: #dc2626; }
  </style>
</head>
<body>

<div class="card">
  <h2>لوحة تحكم المحاضر</h2>
  <p class="subtitle">إنشاء الجلسات وإدارة تقارير الحضور</p>

  <div class="input-group">
    <label>رمز الجلسة</label>
    <input type="text" id="sessionId" value="cs101">
  </div>
  <div class="input-group">
    <label>الرمز السري</label>
    <input type="text" id="secretKey" value="123456">
  </div>

  <button class="btn-action" onclick="createSession()">إنشاء وتفعيل الجلسة</button>
  <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">

  <div class="input-group">
    <label>تحميل التقرير</label>
    <button class="btn-action btn-download" onclick="downloadReport()">تحميل تقرير الحضور (CSV)</button>
  </div>
  <div id="messageBox" class="message"></div>
</div>

<script>
  const API_BASE_URL = 'https://qrsuluq.onrender.com';

  async function createSession() {
    const sessionId = document.getElementById("sessionId").value.trim();
    const secretKey = document.getElementById("secretKey").value.trim();
    const messageBox = document.getElementById("messageBox");

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, secret_key: secretKey })
      });

      if (response.ok) {
        messageBox.className = "message success";
        messageBox.innerText = "تم تفعيل الجلسة بنجاح!";
      } else {
        const data = await response.json();
        messageBox.className = "message error";
        messageBox.innerText = data.error || "فشل إنشاء الجلسة";
      }
    } catch (err) {
      messageBox.className = "message error";
      messageBox.innerText = "فشل الاتصال بالسيرفر";
    }
  }

  function downloadReport() {
    const sessionId = document.getElementById("sessionId").value.trim();
    if (!sessionId) { alert("أدخل رمز الجلسة"); return; }
    window.open(`${API_BASE_URL}/api/reports/session/${sessionId}/csv`, '_blank');
  }
</script>
</body>
</html>
