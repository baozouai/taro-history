import {Current} from '@tarojs/taro'

const PAGE_REGEXP = /^(\/?pages\/)?/
const INDEX_REGEXP = /(\/index)?$/

/**
 * @description: 获取路径传参
 */
export function getParams<T = any>() {
  return (Current?.router?.params as unknown) as T
}
/**
 * @description: 获取当前路径
 */
export function getPath() {
  return Current?.router?.path || ''
}
/**
 * @description: 是否是当前路径
 */
export function isCurrentPath(path: string) {
  return getPath() === getFullPath(path)
}
/**
 * @description: 解析search为params
 * @param {string} search
 * @return {Record<string, unknown>} params
 */
export function parseSearch(search = '') {
  const params = Object.create(null)
  if (search === '') return params
  const searchArr = search.split('&')
  searchArr.forEach((item) => {
    const [key, value] = item.split('=')
    params[key.trim()] = value
  })

  return params
}

/**
 * @description: 为路径加上前缀/pages/ 和后缀 /index
 * @param {string} path
 * @return {string} /pages/originPath/index?search
 */
export function addPathWithPageAndIndex(path: string) {
  let search = ''
  const [url, tempsearch] = path.split('?')
  if (tempsearch) {
    search = `?${tempsearch}`
  }
  // 这样就不用传/pages/和后面的/index了
  return getFullPath(url, search)
}
/**
 * @description: 为url加上前缀/pages/和后缀/index
 * @param {string} originPath，可以是short path，如 order,也可以是full path，如 /pages/order/index?a=xxx
 * @param {string} search
 * @return {string} fullPath
 * @memberof: 
 */
export function getFullPath(originPath: string, search = '') {
  return originPath
    .replace(PAGE_REGEXP, '/pages/')
    .replace(INDEX_REGEXP, `/index${search}`)
}

/**
 * @description: 获取短路径
 * @param {string} originPath 长路径，如/pages/main/invite/index
 * @return {string} 短路径，如main/invite
 */
export function getShortPath(originPath: string) {
  return originPath.replace(PAGE_REGEXP, '').replace(INDEX_REGEXP, ``)
}

/**
 * @description: 获取当前页短路径
 */
export function getCurrentShortPath() {
  return getShortPath(getPath())
}