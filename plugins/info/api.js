import fetch from "node-fetch"

let handler = async (m, { reply }) => {
  try {
    let res = await fetch('https://kuronekoapies.movanest.xyz/api/stats')
    if (!res.ok) throw await res.text()

    let json = await res.json()
    let creator = "Xiao"

    let txt = `
┏━━━⟨ *API STATUS* ⟩━━━┓
┃  🟢 *Status:* ${json.status ? 'Active' : 'Error'}
┃  👤 *Creator:* ${creator}
┃
┃  ⏱ *Runtime*
┃  • Uptime: ${json.runtime?.uptime}
┃  • Started: ${json.runtime?.started_at}
┃  • Memory: ${json.runtime?.memory_usage}
┃
┃  📊 *Requests*
┃  • Total: ${json.requests?.total_requests}
┃  • Success: ${json.requests?.success}
┃  • Failed: ${json.requests?.error}
┃  • Success Rate: ${json.requests?.success_rate}
┃  • Error Rate: ${json.requests?.error_rate}
┗━━━━━━━━━━━━━━━━━━━━┛
`.trim()

    return reply(txt)

  } catch (e) {
    console.error(e)
    return reply(`❌ *Terjadi Error Saat Mengambil Data API*\n\n${e}`)
  }
}

handler.help = ['apistats']
handler.tags = ['info']
handler.command = /^apistats$/i

export default handler