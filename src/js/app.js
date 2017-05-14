import 'whatwg-fetch'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import bindStoreToMenu from './bindStoreToMenu'

import reducer from './reducers'
import Notebook from './Notebook'

require('../scss/main.scss')

const middlewares = [
  thunk
]

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(require('redux-logger').default)
}

const store = compose(
    applyMiddleware(...middlewares)
)(createStore)(reducer)

bindStoreToMenu(store)

render(
  <Provider store={store}>
    <div>
      <Notebook />
    </div>
  </Provider>,
  document.getElementById('kayero')
)
