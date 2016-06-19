import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import Codemirror from 'react-codemirror'
import { DragSource, DropTarget } from 'react-dnd'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/addon/lint/lint'
import '../code-mirror-linter'
import {
    updateBlock, deleteBlock, moveBlock, editBlock
} from '../actions'
import {remote} from 'electron' // eslint-disable-line
const {Menu, MenuItem} = remote

const dragSource = {
  beginDrag (props) {
    return {
      id: props.id,
      index: props.index
    }
  }
}

const dragTarget = {
  hover (props, monitor, component) {
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return
    }

    // Time to actually perform the action
    props.dispatch(moveBlock(monitor.getItem().id, hoverIndex))
  }
}

export default class Block extends Component {

  constructor (props) {
    super(props)
    this.enterEdit = this.enterEdit.bind(this)
    this.textChanged = this.textChanged.bind(this)
    this.getButtons = this.getButtons.bind(this)
    this.deleteBlock = this.deleteBlock.bind(this)
    this.handleContextMenu = this.handleContextMenu.bind(this)
  }

  enterEdit (e) {
    const { dispatch, block, editable } = this.props
    if (editable) {
      e.stopPropagation && e.stopPropagation()
      this.setState({
        text: block.get('content')
      })
      dispatch(editBlock(block.get('id')))
    }
  }

  textChanged (text) {
    this.setState({text})
  }

  componentDidUpdate () {
    if (this.refs.editarea) {
      this.refs.editarea.focus()
      const domNode = findDOMNode(this.refs.editarea)
      if (domNode.scrollIntoViewIfNeeded) {
        findDOMNode(this.refs.editarea).scrollIntoViewIfNeeded(false)
      }
    }
  }

  componentWillReceiveProps (newProps) {
    if (this.props.editing && !newProps.editing &&
      this.props.block.get('content') === newProps.block.get('content')) {
      // If exiting edit mode, save text (unless it's an undo))
      this.props.dispatch(
        updateBlock(this.props.block.get('id'), this.state.text)
      )
    }
  }

  deleteBlock () {
    this.props.dispatch(deleteBlock(this.props.block.get('id')))
  }

  handleContextMenu (e) {
    e.preventDefault()
    const { dispatch, id, index, editable } = this.props
    const menu = new Menu()
    menu.append(new MenuItem({
      label: 'Move block up',
      click () { dispatch(moveBlock(id, index - 1)) }
    }))
    menu.append(new MenuItem({
      label: 'Move block down',
      click () { dispatch(moveBlock(id, index + 1)) }
    }))
    if (editable) {
      menu.append(new MenuItem({type: 'separator'}))
      menu.append(new MenuItem({
        label: 'Edit block',
        click: this.enterEdit.bind(this)
      }))
    }
    if (this.setContextMenuActions) {
      this.setContextMenuActions(menu, MenuItem)
    }
    menu.append(new MenuItem({type: 'separator'}))
    menu.append(new MenuItem({
      label: 'Delete block',
      click () { dispatch(deleteBlock(id)) }
    }))

    menu.popup(remote.getCurrentWindow())
  }

  getButtons () {
    if (!this.props.editable) {
      return null
    }
    let buttons = [
      <i className='fa fa-times-circle-o' key='delete'
        onClick={this.deleteBlock} title='Remove block' />
    ]
    return buttons
  }

  render () {
    const { block, editable, editing, connectDragSource, connectDropTarget, isDragging } = this.props
    if (!(editable && editing)) {
      return connectDragSource(connectDropTarget(this.renderViewerMode(isDragging)))
    }
    const isCodeBlock = block.get('type') === 'code'
    const options = {
      mode: isCodeBlock ? 'javascript' : 'markdown',
      theme: 'base16-tomorrow-light',
      lineNumbers: true,
      gutters: ['CodeMirror-lint-markers'],
      indentUnit: 2,
      lint: isCodeBlock,
      extraKeys: {
        Tab: (cm) => {
          const spaces = Array(cm.getOption('indentUnit') + 1).join(' ')
          cm.replaceSelection(spaces)
        }
      }
    }
    return (
      <div className='edit-box' onClick={(e) => { e.stopPropagation() }}>
        <Codemirror value={this.state.text} options={options}
          onChange={this.textChanged} ref='editarea' />
      </div>
    )
  }

}

Block.propTypes = {
  block: React.PropTypes.object,
  editable: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  isFirst: React.PropTypes.bool,
  isLast: React.PropTypes.bool,
  dispatch: React.PropTypes.func,
  index: React.PropTypes.number.isRequired,
  id: React.PropTypes.string.isRequired,
  connectDragSource: React.PropTypes.func.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  isDragging: React.PropTypes.bool
}

export const dragAndDropWrapper = (component) => {
  return DropTarget('block', dragTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  }))(
  DragSource('block', dragSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))(component))
}
