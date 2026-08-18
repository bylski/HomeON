export const buildLogger = (context: string) => {
  const buildMsg = (msg: string) => `${context} ${msg}`
  return {
    info: (msg: string) => console.log(buildMsg(msg)),
    error: (msg: string) => console.error(buildMsg(msg)),
  }
}
