import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { updateTitle } from '../actions'

class Title extends Component {
  constructor (props) {
    super(props)
    this.exitEdit = this.exitEdit.bind(this)
    this.state = {
      title: this.props.title
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.title !== this.props.title) {
      this.setState({title: nextProps.title})
    }
  }

  exitEdit () {
    this.props.dispatch(updateTitle(this.field.value))
  }

  render () {
    return <input type='text' className='title-field'
            placeholder='Give me a name'
            value={this.state.title}
            onInput={(e) => this.setState({title: e.target.value})}
            ref={c => { this.field = c }} title='Notebook title'
            onBlur={this.exitEdit} />
  }
}

Title.propTypes = {
  title: PropTypes.string,
  dispatch: PropTypes.func
}

export default Title
