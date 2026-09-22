export function appPublicUrl() {
  const url =
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3001'
  return url.replace(/\/$/, '')
}
