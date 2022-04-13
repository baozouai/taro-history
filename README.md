
<p align="center">
<h1 align="center">taro-history</h1>
</p>

<div align="center">


 [![NPM version][npm-image]][npm-url] ![NPM downloads][download-image]

[npm-image]: https://img.shields.io/npm/v/taro-history.svg?style=flat-square
[npm-url]: http://npmjs.org/package/taro-history


[download-image]: https://img.shields.io/npm/dm/taro-history.svg?style=flat-square
[download-url]: https://npmjs.org/package/taro-history


</div>

## ⌨️ 安装

```sh
yarn add taro-history
# or
npm i taro-history
```

## ✨ api

`app.config.js` 的例子

```ts
export default {
  // 页面路径列表
  pages: ['pages/xxx/index', 'pages/yyy/index'],
  // 底部 tab 栏的表现
  tabBar: {
    list: [
      {
        pagePath: 'pages/tab1/index',
        text: 'tab1',
      },
    ],
  },
  ...
}

```
1.  将 navigateTo 和 switchTab 合到 push 中
```ts
import history from 'taro-history'

// 将 navigateTo 和 switchTab 合到 push 中

// 1. push 到 pages/xxx/index
history.push('pages/xxx/index')
history.push('/pages/xxx/index')
history.push('xxx')
// 携带参数
history.push('xxx?a=1')
history.push({ url: 'xxx?a=1' })
history.push({ url: 'pages/xxx/index?a=1' })
history.push({ url: '/pages/xxx/index?a=1' })
// push 到 tab的 pages/tab1/index
history.push('/pages/tab1/index')
history.push('pages/tab1/index')
history.push('tab1')
// 携带参数
history.push('tab1?a=1')
history.push({url: 'tab1?a=1' })
history.push({url: 'pages/tab1?a=1' })
history.push({url: '/pages/tab1?a=1' })
```
2. `pushBind`，避免写成回调的形式，使代码更优雅
```tsx
<Button onClick={history.pushBind('xxx?a=1&is=true')}>跳转</Button>
```
3. `redirect`、`reLaunch` 和 `navigateBack`
```ts
// `redirect`、`reLaunch` 都支持short url 和 full url，其他用法和 push 类似

history.redirect('pages/xxx/index')
history.redirect('/pages/xxx/index')
history.redirect('xxx')
history.redirect('xxx?a=1')
history.redirect({ url: 'xxx?a=1' })
history.redirect({ url: 'pages/xxx/index?a=1' })
history.redirect({ url: '/pages/xxx/index?a=1' })

history.reLaunch('pages/xxx/index')
history.reLaunch('/pages/xxx/index')
history.reLaunch('xxx')
history.reLaunch('xxx?a=1')
history.reLaunch({ url: 'xxx?a=1' })
history.reLaunch({ url: 'pages/xxx/index?a=1' })
history.reLaunch({ url: '/pages/xxx/index?a=1' })

// 返回
history.navigateBack()
```
4.  `history.addInterceptor` 支持拦截路由，只要有一个拦截了，那么路由就不会执行
```tsx
import history from 'taro-history'
<Button onClick={() => history.push('xxx?a=1&is=true')}>跳转</Button>
/**
 * @description: 接收回调，返回true表示拦截，false表示不拦截
 * @param {short} 短路径
 * @param {full} 全路径
 * @param {Record<string, unknown>} params 传参
 * @return {*}
 * @memberof: 
 */
// 返回了true表示拦截路由，那么就不会跳转了
const cancelIntercept = history.addInterceptor({ short, full, params } => {
  /**
   * 上面push到'xxx?a=1&b=2',那么：
   * {
   *  short: 'xxx',
   *  full: '/pages/xxx/index?a=1&b=2',
   *  params: {
   *    a: 1,
   *    is: true,
   *  }
   * }
   * */
  console.log(short, full, params)
  return true
})
// 去掉拦截
cancelIntercept()
// 返回了false表示不拦截路由
history.addInterceptor({ short, full, params } => {
  console.log(short, full, params)
  return true
})
// 支持返回promise，resolve(true)表示拦截，resolve(false)表示不拦截
history.addInterceptor({ short, full, params } => {
  return new Promise(resolve => {
    // 比如跳转前需要调用接口判断是否有权限，那么请求接口后才判断是否跳转
    setTimeout(() => {
      resolve(true)
    }, 3000)
  })
})

```

5.  `history.addListener` 监听路由，在路由不被拦截的情况下才会执行
```ts
import history from 'taro-history'
/**
 * @description: 监听路由
 * @param {short} 短路径
 * @param {full} 全路径
 * @param {Record<string, unknown>} params 传参
 * @return {*}
 * @memberof: 
 */
// 返回了true表示拦截路由，那么就不会跳转了
const unListener = history.addListener({ short, full, params } => {
  // 参数和addInterceptor的回调一样
  console.log(short, full, params)
  return true
})
// 取消监听
unListener()
```

## utils
1.  获取路径传参
```ts
import { getParams } from 'taro-history'
// history.push('xxx?a=1&is=true')
// a = 1, is = true
const { a, is } = getParams<{a: number, is: boolean}>()
```
2. 获取当前路径
```ts
import { getPath } from 'taro-history'
// 当前路径为 /pages/xxx/index
const path = getPath()
```
3. 是否是当前路径
```ts
// 当前路径为 /pages/xxx/index
import { getPath } from 'taro-history'

console.log(isCurrentPath('/pages/xxx/index')) // true
console.log(isCurrentPath('pages/xxx/index')) // true
console.log(isCurrentPath('xxx/index')) // true
console.log(isCurrentPath('xxx')) // true
console.log(isCurrentPath('/pages/yyy/index')) // false
```
4. 为路径加上前缀/pages/ 和后缀 /index
```ts
import { addPathWithPageAndIndex } from 'taro-history'

console.log(addPathWithPageAndIndex('xxx?a=1')) // /pages/xxx/index?a=1
```

5. `getShortPath`, 获取短路径
```ts
import { getShortPath } from 'taro-history'
/**
 * @description: 获取短路径
 * @param {string} originPath 长路径，如/pages/xxx/index
 * @return {string} 短路径，如xxx
 */
console.log(getShortPath('pages/main/invite/index')) // xxx
```
7. `getCurrentShortPath`, 获取当前页短路径
```ts
import { getCurrentShortPath } from 'taro-history'
// 当前页 pages/xxx/index

console.log(getCurrentShortPath()) // xxx
```