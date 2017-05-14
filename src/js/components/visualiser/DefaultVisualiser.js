import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { typeString, getSpacing } from './Visualiser'

function buildCssClass (type, useHljs) {
  let cssSuffix
  switch (type) {
    case 'String':
      cssSuffix = 'string'; break
    case 'Number':
      cssSuffix = 'number'; break
    case 'Boolean':
      cssSuffix = 'literal'; break
    case 'Error':
      cssSuffix = 'error'; break
    case 'Function':
      cssSuffix = 'keyword'; break
    default:
      cssSuffix = 'text'; break
  }
  let cssClass = 'visualiser-' + cssSuffix
  if (useHljs) {
    cssClass += ' hljs-' + cssSuffix
  }
  return cssClass
}

export default class DefaultVisualiser extends Component {
  render () {
    const { data, indent, name, useHljs, path, click = () => {} } = this.props
    const type = typeString(data)
    const repr =
      (type === 'String') ? "'" + String(data) + "'"
      : (type === 'Function') ? 'function()'
      : (type === 'Error') ? (data.stack || String(data)) : String(data)
    const cssClass = buildCssClass(type, useHljs)
    let key = <span className='visualiser-spacing'></span>
    if (name) {
      key = (
        <span className='visualiser-spacing'>
          <span className='visualiser-key' onClick={() => click(name, path)}>
            {name}
          </span>
          {':\u00a0'}
        </span>
      )
    }
    const spaces = getSpacing(indent)

    return (
      <div className='default-visualiser'>
        <span className='visualiser-row'>
          <span className='visualiser-spacing'>{spaces}</span>
            {key}
          <span className={cssClass}>{repr}</span>
        </span>
      </div>
    )
  }
}

DefaultVisualiser.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.func,
    PropTypes.instanceOf(Error),
    PropTypes.instanceOf(Date)
  ]),
  indent: PropTypes.number,
  useHljs: PropTypes.string,
  name: PropTypes.string,
  path: PropTypes.string,
  click: PropTypes.func
}
