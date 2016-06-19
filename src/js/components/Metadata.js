import React, { Component } from 'react'
import { updateAuthor, toggleFooter } from '../actions'
import Datasources from './Datasources'

export default class Metadata extends Component {

  constructor (props) {
    super(props)
    this.updateAuthor = this.updateAuthor.bind(this)
    this.toggleFooter = this.toggleFooter.bind(this)
  }

  updateAuthor () {
    this.props.dispatch(updateAuthor(this.refs.authorField.value))
  }

  toggleFooter () {
    this.props.dispatch(toggleFooter())
  }

  render () {
    const { editable, metadata, dispatch } = this.props
    const author = metadata.get('author')
    if (editable) {
      const iconFooter = metadata.get('showFooter') ? 'check-circle' : 'circle-o'
      return (
        <div className='metadata'>
          <div className='metadata-row'>
            <i className='fa fa-user' />
            <input type='text' defaultValue={author}
              ref='authorField' onBlur={this.updateAuthor} title='Author' />
          </div>
          <div className='metadata-row'>
            <i className={'fa fa-' + iconFooter + ' clickable'}
                onClick={this.toggleFooter} />
            <span>Show footer</span>
          </div>
          <hr/>
          <p>Data sources</p>
          <Datasources dispatch={dispatch}
              datasources={metadata.get('datasources')} />
        </div>
      )
    }
    return (
      <div className='metadata'>
        <span className='metadata-item'>
            <i className='fa fa-user' />{'\u00a0' + author}
        </span>
      </div>
    )
  }

}

Metadata.propTypes = {
  metadata: React.PropTypes.object,
  editable: React.PropTypes.bool,
  dispatch: React.PropTypes.func
}
