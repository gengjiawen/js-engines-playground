/**
 * need to handle real backend, dev mode, and cloud dev mode like gitpod
 * @param suffix
 */
export function getUrl(suffix: string) {
  let prod = import.meta.env.PROD
  if (prod) {
    return `/${suffix}`
  }
  let url = `http://localhost:8000/${suffix}`
  let location = window.location.href
  // console.log(`location`, location)
  if (location.includes('gitpod.io')) {
    url = location.replace('3000', '8000') + suffix
  }
  return url
}
