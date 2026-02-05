export const isLocalDevelopment = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}
