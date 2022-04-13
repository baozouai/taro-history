import Taro from '@tarojs/taro'
import { addPathWithPageAndIndex, getShortPath, parseSearch } from './util'
/**
 * @description: 拦截器 `Interceptor` 和 监听器 `Listener` 
 */
interface CallbackParams {
  /** short url，如 xxx */
  short: string
  /** full url, 如 /pages/xxx/index */
  full: string
  /** 传参，如 xxx?a=1&is=true => params = { a: 1, is: true } */
  params: Record<string, unknown>
}
/**
 * @description: 拦截器，返回boolean或者promise，return false或者resolve(false)表示不拦截，否则拦截
 */
type Interceptor = (url: CallbackParams) => boolean | Promise<boolean>
/**
 * @description: 监听器，路由变化时监听
 */
type Listener = (url: CallbackParams) => void

export class History {
  /**
   * 拦截器
   */  
  private interceptors: Interceptor[] = []
  // 
  /**
   * 监听器
   */  
  private listeners: Listener[] = []
  /**
   * @description: 同 `push`，但是返回了`bind`， 避免写成回调的形式，使代码更优雅
   * @param {Taro.navigateTo.Option | Taro.switchTab.Option | string} option
   * 
   * ```ts
   * <Button onClick={history.pushBind('xxx?a=1&is=true')}>跳转</Button>
   * ```
   */  
  pushBind(option: Taro.navigateTo.Option | Taro.switchTab.Option | string) {
    return this.push.bind(this, option)
  }
  /** 返回，同 `Taro.navigateBack()` */
  navigateBack() {
    Taro.navigateBack()
  }
  /** 
   * @description 支持 `Taro.reLaunch.Option` 或者 string
   * @example
   * history.reLauch('xxx')
   * history.reLauch('/pages/xxx/index')
   * history.reLauch({ url: 'index' })
   * history.reLauch({ url: '/pages/xxx/index' })
   * */
  reLaunch(option: Taro.reLaunch.Option | string) {
    this.common(option, 'reLaunch')
  }
  /**
   * @description: 私有公共方法
   */  
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
   /** 
   * @description 支持 `Taro.redirectTo.Option` 或者 string
   * @example
   * history.redirectTo('xxx')
   * history.redirectTo('/pages/xxx/index')
   * history.redirectTo({ url: 'index' })
   * history.redirectTo({ url: '/pages/xxx/index' })
   * */
  redirectTo(option: Taro.redirectTo.Option | string) {
    this.common(option, 'redirectTo')
  }
  /** 
   * @description 支持 `Taro.navigateTo.Option`、 `Taro.switchTab.Option` 或者 string
   *              将 `Taro.navigateTo` 和 `Taro.switchTab` 合并为一个方法
   * @example
   * // 非tab
   * history.push('xxx')
   * history.push('/pages/xxx/index')
   * history.push({ url: 'index' })
   * history.push({ url: '/pages/xxx/index' })
   * // tab
   * history.push('tab')
   * history.push('/pages/tab/index')
   * history.push({ url: 'index' })
   * history.push({ url: '/pages/tab/index' })
   * */
  push(option: Taro.navigateTo.Option | Taro.switchTab.Option | string) {
    this.common(option, 'push')
  }
  /** 
   * @description 添加拦截器，只有有一个拦截器返回true，那么路由就被拦截，无法跳转
   * 
   * ```tsx
   * import history from 'taro-history'
   * <Button onClick={() => history.push('xxx?a=1&is=true')}>跳转</Button>
   * // 返回了true表示拦截路由，那么就不会跳转了
   * const cancelIntercept = history.addInterceptor({ short, full, params } => {
   * // 上面push到'xxx?a=1&b=2',那么：
   * // {
   * //  short: 'xxx',
   * //  full: '/pages/xxx/index?a=1&b=2',
   * //  params: {
   * //    a: 1,
   * //    is: true,
   * //  }
   * // }
   * console.log(short, full, params)
   * return true
   * })
   * // 去掉拦截
   * cancelIntercept()
   * // 返回了false表示不拦截路由
   * history.addInterceptor({ short, full, params } => {
   *  console.log(short, full, params)
   *  return true
   * })
   * // 支持返回promise，resolve(true)表示拦截，resolve(false)表示不拦截
   * history.addInterceptor({ short, full, params } => {
   *  return new Promise(resolve => {
   *    // 比如跳转前需要调用接口判断是否有权限，那么请求接口后才判断是否跳转
   *    setTimeout(() => resolve(true), 3000)
   *     })
   * })
   * ```
   * */
  addInterceptor(interceptor: Interceptor) {
    this.interceptors.push(interceptor)
    return () => {
      this.interceptors = this.interceptors.filter(
        (item) => item !== interceptor,
      )
    }
  }
  /**
   * @description: 监听路由，在路由不被拦截的情况下才会执行
   * @param {Listener} listener 监听回调函数
   * ```ts
   * import history from 'taro-history'
   *
   *   // 返回了true表示拦截路由，那么就不会跳转了
   *   const unListener = history.addListener({ short, full, params } => {
   *     // 参数和addInterceptor的回调一样
   *     console.log(short, full, params)
   *     return true
   *   })
   *   // 取消监听
   *   unListener()
   * ```
   */  
  addListener(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener)
    }
  }
  /**
   * @description: 通知listeners
   */ 
  private notifyListeners(params: CallbackParams) {
    this.listeners.forEach((listener) => listener(params))
  }
  /**
   * @description: 判断是否可跳转
   */  
  private async canJump(params: CallbackParams) {
    for (const interceptor of this.interceptors) {
      const isBlock = await Promise.resolve(interceptor(params))
      if (isBlock) return true
    }
    return false
  }
}

export default History
