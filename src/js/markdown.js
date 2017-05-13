import MarkdownIt from 'markdown-it'
import mathjax from 'markdown-it-mathjax'
import fm from 'front-matter'
import Immutable from 'immutable'
import hash from 'string-hash'

import { codeToText } from './util'

const markdownIt = new MarkdownIt()
markdownIt.use(mathjax)

/*
 * Extracts a code block from the
 * block-parsed Markdown.
 */
function extractCodeBlock (token, lineOffset) {
  const info = token.info.split(';').map(s => s.trim())
  const language = info[0] || undefined
  const option = info[1] || undefined
  if (['runnable', 'auto', 'hidden'].indexOf(option) < 0) {
    // If not an executable block, we just want to represent as Markdown.
    return null
  }
  const content = token.content.trim()
  return {
    type: 'code',
    content,
    language,
    option,
    line: token.map[1] + lineOffset,
    hash: hash(content)
  }
}

export function extractBlocks (md, existingBlocks) {
  const rgx = /(```\w+;\s*?(?:runnable|auto|hidden)\s*?[\n\r]+[\s\S]*?^\s*?```\s*?$)/gm
  const parts = md.split(rgx)

  let lineOffset = 0
  const blockOrder = []
  const blocks = {}

  for (let i = 0; i < parts.length; i++) {
    const tokens = markdownIt.parse(parts[i])
    if (tokens.length === 1 && tokens[0].type === 'fence') {
      const block = extractCodeBlock(tokens[0], lineOffset)
      // If it's an executable block
      if (block) {
        blockOrder.push(block.hash)
        blocks[block.hash] = block
        lineOffset += parts[i].split('\n').length
      } else {
        lineOffset += parts[i].split('\n').length - 2
      }
    } else {
      lineOffset += parts[i].split('\n').length - 2
    }
  }

  return {
    blockOrder,
    blocks
  }
}

export function parse (md, filename) {
  // Separate front-matter and body
  const doc = fm(md)
  const {blockOrder, blocks} = extractBlocks(doc.body)

  return Immutable.fromJS({
    metadata: {
      title: doc.attributes.title,
      author: doc.attributes.author,
      datasources: doc.attributes.datasources || {},
      original: doc.attributes.original,
      showFooter: doc.attributes.show_footer !== false,
      path: filename
    },
    content: doc.body,
    blockOrder,
    blocks
  })
}

/*
 * Functions for rendering blocks back into Markdown
 */

function renderDatasources (datasources) {
  let rendered = 'datasources:\n'
  datasources.map((url, name) => {
    rendered += '    ' + name + ': "' + url + '"\n'
  })
  return rendered
}

function renderMetadata (metadata) {
  let rendered = '---\n'
  if (metadata.get('title') !== undefined) {
    rendered += 'title: "' + metadata.get('title') + '"\n'
  }
  const datasources = metadata.get('datasources')
  if (datasources && datasources.size > 0) {
    rendered += renderDatasources(datasources)
  }
  return rendered + '---\n\n'
}

export function render (notebook) {
  let rendered = ''
  rendered += renderMetadata(notebook.get('metadata'))
  rendered += notebook.get('content')
  return rendered
}
