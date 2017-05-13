import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Portal from 'react-portal'
import { deleteDatasource, updateDatasource } from '../actions'

export default class Datasources extends Component {
  constructor (props) {
    super(props)
    this.inputs = {}
    this.deleteSource = this.deleteSource.bind(this)
    this.updateSource = this.updateSource.bind(this)
    this.addSource = this.addSource.bind(this)
  }

  deleteSource (name) {
    this.props.dispatch(deleteDatasource(name))
  }

  updateSource (name) {
    this.props.dispatch(
      updateDatasource(name, this.inputs['set-' + name].value)
    )
  }

  addSource () {
    const name = this.inputs['new-name'].value
    const url = this.inputs['new-url'].value
    if (name === '' || name === undefined || url === '' || url === undefined) {
      return
    }
    this.props.dispatch(updateDatasource(name, url))
    this.inputs['new-name'].value = ''
    this.inputs['new-url'].value = ''
  }

  render () {
    const { datasources } = this.props
    const control = (
      <span className='controls'>
        <i className='fa fa-cog' title='Data-sources' />
      </span>
    )
    let result = []
    for (let [name, source] of datasources) {
      result.push(
        <div className='pure-g datasource' key={name}>
          <i className='fa fa-times-circle-o pure-u-1-12 pure-u-md-1-24'
              onClick={() => this.deleteSource(name)} title='Remove datasource' />
          <div className='pure-u-11-12 pure-u-md-7-24 source-name'>
              <p>{name}</p>
          </div>
          <div className='pure-u-1 pure-u-md-2-3 source-url'>
            <input type='text' defaultValue={source} ref={(c) => { this.inputs['set-' + name] = c }}
                onBlur={() => this.updateSource(name)} />
          </div>
        </div>
      )
    }
    return (
      <Portal closeOnEsc closeOnOutsideClick openByClickOn={control}>
        <div className="datasource-portal">
          {result}
          <div className='pure-g datasource'>
            <i className='fa fa-plus pure-u-1-12 pure-u-md-1-24'
              onClick={this.addSource} title='Add datasource' />
            <div className='pure-u-11-12 pure-u-md-7-24 source-name'>
              <input type='text' ref={(c) => { this.inputs['new-name'] = c }} placeholder='Data source name' />
            </div>
            <div className='pure-u-1 pure-u-md-2-3 source-url'>
              <input type='text' ref={(c) => { this.inputs['new-url'] = c }} placeholder='URL' />
            </div>
          </div>
        </div>
      </Portal>
    )
  }
}

Datasources.propTypes = {
  datasources: PropTypes.object,
  dispatch: PropTypes.func
}
