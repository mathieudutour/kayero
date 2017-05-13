import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { contentSelector } from '../selectors'
import Codemirror from 'react-codemirror'
import debounce from 'lodash.debounce'
import Visualiser from './visualiser/Visualiser'
import 'codemirror/addon/mode/overlay'
import 'codemirror/addon/edit/continuelist'

import 'codemirror/mode/xml/xml'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/mode/javascript/javascript'

import '../../hypermd/mode/hypermd'
import '../../hypermd/mode/hypermd.css'
import '../../hypermd/mode/hypermd.scss'

import '../../hypermd/theme/hypermd-light.scss'

import '../../hypermd/addon/click'
import '../../hypermd/addon/cursor-debounce'
import '../../hypermd/addon/fold-math'
import '../../hypermd/addon/fold'
import '../../hypermd/addon/hide-token'
import '../../hypermd/addon/hover'
import '../../hypermd/addon/paste-image'
import '../../hypermd/addon/paste'
import '../../hypermd/addon/readlink'

// import 'codemirror/addon/lint/lint'
// import '../code-mirror-linter'
import { updateContent } from '../actions'
import {remote} from 'electron'
const {Menu, MenuItem} = remote

const CODE_MIRROR_CONFIG = {
  mode: 'text/x-hypermd',
  theme: 'hypermd-light',
  lineNumbers: false,
  viewportMargin: Infinity,
  lineWrapping: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'HyperMD-goback'],
  indentUnit: 2,
  // lint: isCodeBlock,
  extraKeys: {
    Enter: 'newlineAndIndentContinueMarkdownList'
    // Tab: (cm) => {
    //   const spaces = Array(cm.getOption('indentUnit') + 1).join(' ')
    //   cm.replaceSelection(spaces)
    // }
  },
  hmdHideToken: '(profile-1)',
  hmdCursorDebounce: true,
  hmdAutoFold: 200,
  hmdPaste: true,
  hmdPasteImage: true,
  hmdFoldMath: { interval: 200, preview: true }
}

class Editor extends Component {
  constructor (props) {
    super(props)
    this.widgets = []
    this.textChanged = debounce(this._textChanged.bind(this), 200)
    this.updateWidgets = debounce(this._updateWidgets.bind(this), 200)
  }

  componentWillUpdate (nextProps) {
    this.updateWidgets(nextProps)
  }

  _updateWidgets (props) {
    if (!this.codemirror) { return }
    const widgetsToUpdate = {}
    this.widgets.filter(({hash, widget, line}) => {
      const block = props.blocks.get(hash)
      if (block && block.get('line') === line) {
        widgetsToUpdate[hash] = widget
        return false
      }
      return true
    }).forEach(({widget}) => {
      ReactDOM.unmountComponentAtNode(widget.node)
      widget.clear()
    })

    const newWidgets = []
    props.blocks.forEach((value, hash) => {
      const line = value.get('line')
      if (widgetsToUpdate[hash]) {
        this.renderVisualizer(props, widgetsToUpdate[hash].node, hash)
        try {
          widgetsToUpdate[hash].changed()
        } catch (e) {
          console.error(e)
        }
        newWidgets.push({
          hash,
          widget: widgetsToUpdate[hash],
          line
        })
      } else {
        const node = document.createElement('div')
        this.renderVisualizer(props, node, hash)
        const widget = this.codemirror.addLineWidget(line, node)
        newWidgets.push({
          hash,
          widget,
          line
        })
      }
    })
    this.widgets = newWidgets
  }

  _textChanged (text) {
    this.props.dispatch(updateContent(text))
  }

  renderVisualizer (props, node, hash) {
    const hasBeenRun = props.blocksExecuted.includes(hash)
    const isRunning = props.blocksRunning.includes(hash)
    const result = props.results.get(hash)
    const element = (
      <div>
        <div hidden={!isRunning} className='resultBlock'>
          loading...
        </div>
        <div hidden={!hasBeenRun} className='graphBlock' id={'kayero-graph-' + hash} />
        <div hidden={!hasBeenRun} className='resultBlock'>
          <Visualiser data={result} useHljs='true' />
        </div>
      </div>
    )

    this.portal = ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      element,
      node
    )
  }

  render () {
    const { content } = this.props
    return (
      <Codemirror value={content} options={CODE_MIRROR_CONFIG}
        onChange={this.textChanged} ref={(c) => { this.codemirror = (c || {}).codeMirror }} />
    )
  }
}

Editor.propTypes = {
  content: PropTypes.string,
  results: PropTypes.object,
  blocksExecuted: PropTypes.object,
  blocksRunning: PropTypes.object,
  dispatch: PropTypes.func
}

export default connect(contentSelector)(Editor)
