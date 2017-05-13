import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { contentSelector } from '../selectors'
import TextBlock from './TextBlock'
import CodeBlock from './CodeBlock'
import GraphBlock from './GraphBlock'
import AddControls from './AddControls'

class Content extends Component {
  render () {
    const {
      dispatch, content, results, blocksExecuted, editable, activeBlock, blocksRunning
    } = this.props
    let blocks = []
    for (let i = 0; i < content.size; i++) {
      const block = content.get(i)
      const id = block.get('id')
      const isFirst = (i === 0)
      const isLast = (i === content.size - 1)
      blocks.push(
        <AddControls key={'add' + i} dispatch={dispatch}
          id={block.get('id')} editable={editable} />
      )
      switch (block.get('type')) {
        case 'text':
          blocks.push(
            <TextBlock editable={editable} dispatch={dispatch}
              block={block} key={id} isFirst={isFirst}
              isLast={isLast} editing={id === activeBlock} index={i} id={id} />
          )
          break
        default:
          const hasBeenRun = blocksExecuted.includes(id)
          const isRunning = blocksRunning.includes(id)
          const result = results.get(id)
          const BlockClass = block.get('type') === 'code' ? CodeBlock : GraphBlock
          blocks.push(
            <BlockClass
                block={block} result={result} editable={editable}
                key={id} hasBeenRun={hasBeenRun} dispatch={dispatch}
                isFirst={isFirst} isLast={isLast} isRunning={isRunning}
                editing={id === activeBlock} index={i} id={id} />
          )
      }
    }
    blocks.push(
      <AddControls key='add-end' dispatch={dispatch} editable={editable} />
    )
    return <div>{blocks}</div>
  }

}

Content.propTypes = {
  content: React.PropTypes.object,
  results: React.PropTypes.object,
  blocksExecuted: React.PropTypes.object,
  editable: React.PropTypes.bool,
  activeBlock: React.PropTypes.string,
  blocksRunning: React.PropTypes.object,
  dispatch: React.PropTypes.func
}

export default DragDropContext(HTML5Backend)(connect(contentSelector)(Content))
