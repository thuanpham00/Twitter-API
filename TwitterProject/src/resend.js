const { Resend } = require('resend');

// Replace this with your real API key
const resend = new Resend("re_jMNGWjjz_G71pAHbYcbTpy1BA4DpgSrko")

async function sendTestEmail() {
  try {
    const result = await resend.emails.send({
      from: "no-reply@techzoneapi.io.vn",
      to: "phamminhthuan912@gmail.com",
      subject: "Hello from Resend",
      html: "<strong>It works!</strong>"
    })
    const emailId = result.data?.id
    const status = await resend.emails.get(emailId)
    console.log(status)
  } catch (error) {
    console.error("❌ Failed to send email:", error)
  }
}

sendTestEmail()
