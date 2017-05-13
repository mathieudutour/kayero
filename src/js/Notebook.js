import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Header from './components/Header'
import Editor from './components/Editor'
import Footer from './components/Footer'
import SaveDialog from './components/SaveDialog'
import { fetchData, openFile } from './actions'
import { editorSelector } from './selectors'

class Notebook extends Component {
  componentWillMount () {
    this.props.dispatch(openFile())
  }

  componentDidMount () {
    this.props.dispatch(fetchData())
  }

  render () {
    const { saving } = this.props
    const notebookView = (
      <div className='pure-u-1 pure-u-md-3-4 pure-u-lg-2-3'>
        <Header />
        <Editor />
        <Footer />
      </div>
    )
    const saveView = (
      <div className='pure-u-1 pure-u-md-3-4 pure-u-lg-2-3'>
        <SaveDialog />
      </div>
    )
    const content = saving ? saveView : notebookView
    return (
      <div className='pure-g'>
        <div className='offset-col pure-u-1 pure-u-md-1-8 pure-u-lg-1-6'>
          &nbsp;
        </div>
        {content}
      </div>
    )
  }
}

Notebook.propTypes = {
  saving: PropTypes.bool,
  dispatch: PropTypes.func
}

export default connect(editorSelector)(Notebook)
