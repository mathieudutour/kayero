import test from 'ava'

import fs from 'fs'
import Immutable from 'immutable'
import * as util from '../src/js/util'

// Mock stuff for execution
global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.nv = {}

test('should correctly transform a code block to text', (t) => {
  const codeBlock = Immutable.fromJS({
    type: 'code',
    language: 'javascript',
    option: 'hidden',
    content: 'return 1 + 2;'
  })
  const expected = '```javascript\nreturn 1 + 2;\n```'
  t.is(util.codeToText(codeBlock), expected)
})

test('should include option if includeOption is true ', (t) => {
  const codeBlock = Immutable.fromJS({
    type: 'code',
    language: 'javascript',
    option: 'hidden',
    content: 'return 1 + 2;'
  })
  const expected = '```javascript; hidden\nreturn 1 + 2;\n```'
  t.is(util.codeToText(codeBlock, true), expected)
})

test('correctly highlights code', (t) => {
  const expected = '<span class="hljs-built_in">console</span>' +
            '.log(<span class="hljs-string">"hello"</span>);'
  t.is(util.highlight('console.log("hello");', 'javascript'), expected)
})

test('returns nothing for an unsupported language', (t) => {
  t.is(util.highlight('rubbish', 'dfhjf'), '')
})

test('should correctly render the index.html from its markdown', (t) => {
  const indexMd = fs.readFileSync('./fixtures/index.md').toString()
  const indexHTML = fs.readFileSync('./fixtures/index.html').toString()
  t.is(util.renderHTML(indexMd), indexHTML)
})

test.todo('arrayToCSV')
