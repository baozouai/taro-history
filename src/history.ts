import Taro from '@tarojs/taro'
import { addPathWithPageAndIndex, getShortPath, parseSearch } from './util'

interface CallbackParams {
  short: string
  full: string

}
type Interceptor = (url: CallbackParams) => boolean | Promise<boolean>
type Listener = (url: CallbackParams) => void

export class History {
  private interceptors: Interceptor[] = []

  private listeners: Listener[] = []

  constructor() {
    this.interceptors = []
  }

  pushBind(option: Taro.navigateTo.Option | string) {
    return this.push.bind(this, option)
  }

  navigateBack() {
    Taro.navigateBack()
  }

  reLaunch(option: Taro.reLaunch.Option | string) {
    this.common(option, 'reLaunch')
  }

  private async common<T extends { url: string }>(
    option: T | string,
    method: 'redirectTo' | 'switchTab' | 'reLaunch' | 'navigateTo' | 'push',
  ) {
    if (typeof option === 'string') {
      option = { url: option } as T
    }
    const origionUrl = option.url
    option = { ...option, url: addPathWithPageAndIndex(origionUrl) }
    const [full, search = ''] = option.url.split('?')
    const params = {
      short: getShortPath(full),
      full,
      params: parseSearch(search),
    }
    const isBlock = await this.canJump(params)
    if (!isBlock) {
      this.notifyListeners(params)
      if (method === 'push') {
        method = 'navigateTo'
      }

      Taro[method](option).catch(() => {
        Taro.switchTab(option as any)
      })
    }
  }

  redirectTo(option: Taro.redirectTo.Option | string) {
    this.common(option, 'redirectTo')
  }

  push(option: Taro.navigateTo.Option | Taro.switchTab.Option | string) {
    this.common(option, 'push')
  }

  addInterceptor(interceptor: Interceptor) {
    this.interceptors.push(interceptor)
    return () => {
      this.interceptors = this.interceptors.filter(
        (item) => item !== interceptor,
      )
    }
  }

  addListener(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener)
    }
  }

  private notifyListeners(params: CallbackParams) {
    this.listeners.forEach((listener) => listener(params))
  }

  private async canJump(params: CallbackParams) {
    for (const interceptor of this.interceptors) {
      const isBlock = await Promise.resolve(interceptor(params))
      if (isBlock) return true
    }
    return false
  }
}

export default History
