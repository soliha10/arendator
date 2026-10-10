import common from './common'
import enums from './enums'
import server from './server'
import home from './home'
import catalog from './catalog'
import listing from './listing'
import calculator from './calculator'
import compare from './compare'
import form from './form'
import dealers from './dealers'
import auth from './auth'
import pages from './pages'
import cabinet from './cabinet'
import admin from './admin'

const messages = {
  common,
  enums,
  server,
  home,
  catalog,
  listing,
  calculator,
  compare,
  form,
  dealers,
  auth,
  pages,
  cabinet,
  admin,
}

export type Messages = typeof messages
export default messages
