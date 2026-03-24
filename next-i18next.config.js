const path = require('path')

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['de-DE', 'en', 'es', 'zh-CN', 'hi', 'id', 'tr-TR', 'vi-VN', 'zh-TW']
  },
  localePath: path.resolve('public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  keySeparator: false,
  namespaceSeparator: false,
  pluralSeparator: '——',
  contextSeparator: '——'
}
