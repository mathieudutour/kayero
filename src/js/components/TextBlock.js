import React from 'react'
import MarkdownIt from 'markdown-it'
import Block, { dragAndDropWrapper } from './Block'
import { highlight } from '../util'

const md = new MarkdownIt({highlight, html: true})

class TextBlock extends Block {

  rawMarkup (markdown) {
    return {__html: md.render(markdown)}
  }

  renderViewerMode (isDragging) {
    const { block } = this.props
    const buttons = this.getButtons()
    const draggingClass = isDragging ? ' dragging' : ''
    /* eslint-disable react/no-danger */
    return (
      <div className={'text-block' + draggingClass} onContextMenu={this.handleContextMenu}>
        <div className='editor-buttons'>
          {buttons}
        </div>
        <div className='text-block-content'
          dangerouslySetInnerHTML={this.rawMarkup(block.get('content'))}
          onClick={this.enterEdit}>
        </div>
      </div>
    )
  }

}

export default dragAndDropWrapper(TextBlock)
