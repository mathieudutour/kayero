import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Title from './Title'
import Datasources from './Datasources'
import { metadataSelector } from '../selectors'
import { toggleSave } from '../actions'

class Header extends Component {
  constructor (props) {
    super(props)
    this.toggleSaveClicked = this.toggleSaveClicked.bind(this)
  }

  toggleSaveClicked () {
    this.props.dispatch(toggleSave())
  }

  render () {
    const { metadata, dispatch } = this.props
    const title = metadata.get('title')
    document.title = title
    return (
      <div>
        <Title title={title} dispatch={dispatch} />
        <Datasources dispatch={dispatch} datasources={metadata.get('datasources')} />
      </div>
    )
  }

}

Header.propTypes = {
  metadata: PropTypes.object,
  dispatch: PropTypes.func
}

export default connect(metadataSelector)(Header)
