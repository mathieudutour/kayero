import React from 'react'
import MarkdownIt from 'markdown-it'
import Block, { dragAndDropWrapper } from './Block'
import Visualiser from './visualiser/Visualiser'
import { codeToText, highlight } from '../util'
import {
    executeCodeBlock, changeCodeBlockOption, clearGraphData
} from '../actions'

const md = new MarkdownIt({highlight})

export class CodeBlock extends Block {
  constructor (props) {
    super(props)
    this.clickPlay = this.clickPlay.bind(this)
    this.clickOption = this.clickOption.bind(this)
    this.getRunButton = this.getRunButton.bind(this)
    this.getOptionButton = this.getOptionButton.bind(this)
    this.setContextMenuActions = this.setContextMenuActions.bind(this)
  }

  rawMarkup (codeBlock) {
    return {
      __html: md.render(codeToText(codeBlock))
    }
  }

  clickPlay () {
    const { dispatch, block } = this.props
    dispatch(executeCodeBlock(block.get('id')))
  }

  clickOption () {
    const { dispatch, block } = this.props
    dispatch(changeCodeBlockOption(block.get('id')))
  }

  getOptionButton () {
    const option = this.props.block.get('option')
    if (!this.props.editable) {
      return null
    }
    let icon, text
    switch (option) {
      case 'runnable':
        icon = 'users'
        text = 'Code is run by readers, by clicking the play button.'
        break
      case 'auto':
        icon = 'gear'
        text = 'Code is run when the notebook is loaded.'
        break
      case 'hidden':
        icon = 'user-secret'
        text = 'Code is run when the notebook is loaded, and only the results are displayed.'
        break
      default:
        return null
    }
    return (
      <i className={'fa fa-' + icon} onClick={this.clickOption} key='option' title={text} />
    )
  }

  getRunButton () {
    const option = this.props.block.get('option')
    const icon = this.props.hasBeenRun ? 'fa-refresh' : 'fa-play-circle-o'
    const showIconOptions = ['runnable', 'auto', 'hidden']
    if (showIconOptions.indexOf(option) > -1) {
      return (
        <i className={'fa ' + icon} onClick={this.clickPlay} key='run'
            title={this.props.hasBeenRun ? 'Re-run code' : 'Run code'} />
      )
    }
  }

  componentDidMount () {
    const { dispatch, block } = this.props
    if (block.get('graphType')) {
      dispatch(clearGraphData(block.get('id')))
      dispatch(executeCodeBlock(block.get('id')))
    }
  }

  setContextMenuActions (menu, MenuItem) {
    const { dispatch, block } = this.props
    const option = block.get('option')
    menu.append(new MenuItem({type: 'separator'}))
    menu.append(new MenuItem({
      label: 'Runnable',
      type: 'checkbox',
      checked: option === 'runnable',
      click () { dispatch(changeCodeBlockOption(block.get('id'), 'runnable')) }
    }))
    menu.append(new MenuItem({
      label: 'Autorun',
      type: 'checkbox',
      checked: option === 'auto',
      click () { dispatch(changeCodeBlockOption(block.get('id'), 'auto')) }
    }))
    menu.append(new MenuItem({
      label: 'Hidden autorun',
      type: 'checkbox',
      checked: option === 'hidden',
      click () { dispatch(changeCodeBlockOption(block.get('id'), 'hidden')) }
    }))
  }

  renderViewerMode (isDragging) {
    const { block, hasBeenRun, result, editable, isRunning } = this.props
    let buttons = this.getButtons()
    const runButton = this.getRunButton()
    const optionButton = this.getOptionButton()
    const hideBlock = !editable && block.get('option') === 'hidden'
    const containerClass = hideBlock ? ' hiddenCode' : ''
    const draggingClass = isDragging ? ' dragging' : ''
    if (buttons == null) {
      buttons = [runButton, optionButton]
    } else {
      buttons.unshift(optionButton)
      buttons.unshift(runButton)
    }

    /* eslint-disable react/no-danger */
    return (
      <div className={'codeContainer' + containerClass + draggingClass} onContextMenu={this.handleContextMenu}>
        <div className='codeBlock'>
          <div className='editor-buttons'>
            {buttons}
          </div>
          <div onClick={this.enterEdit} dangerouslySetInnerHTML={this.rawMarkup(block)} />
        </div>
        <div hidden={!isRunning} className='resultBlock'>
          loading...
        </div>
        <div hidden={!hasBeenRun} className='graphBlock' id={'kayero-graph-' + block.get('id')} />
        <div hidden={!hasBeenRun} className='resultBlock'>
          <div className='editor-buttons'>
            {hideBlock ? buttons : null}
          </div>
          <Visualiser data={result} useHljs='true' />
        </div>
      </div>
    )
  }
}

export default dragAndDropWrapper(CodeBlock)
