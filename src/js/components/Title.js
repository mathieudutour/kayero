import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { updateTitle } from '../actions'

class Title extends Component {
  constructor (props) {
    super(props)
    this.exitEdit = this.exitEdit.bind(this)
  }

  exitEdit () {
    this.props.dispatch(updateTitle(this.field.value))
  }

  render () {
    const { title } = this.props
    return (
      <h1>
        <input type='text' className='title-field'
            placeholder='Notebook title'
            defaultValue={title}
            ref={c => { this.field = c }} title='Notebook title'
            onBlur={this.exitEdit} />
      </h1>
    )
  }
}

Title.propTypes = {
  title: PropTypes.string,
  dispatch: PropTypes.func
}

export default Title
