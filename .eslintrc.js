const merge = require('@nikifilini/codestyle/tools')
const base = require('@nikifilini/codestyle/configs/eslint/node')

module.exports = merge(base, { rules: { 'no-console': 'off' } })
