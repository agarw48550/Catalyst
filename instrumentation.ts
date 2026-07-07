export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateConfig } = await import('@/config')
    const { errors } = validateConfig()
    if (errors.length > 0) {
      console.error('⚠️  Configuration errors detected:\n' + errors.map((e) => `  - ${e}`).join('\n'))
    }
  }
}
