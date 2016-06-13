import test from 'ava'

import fs from 'fs'
import Immutable from 'immutable'
import { parse, render } from '../src/js/markdown'

function loadMarkdown (filename) {
  return fs.readFileSync('./fixtures/' + filename + '.md').toString()
}

// Mock stuff for execution
global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.nv = {}

const sampleNotebook = Immutable.fromJS({
  metadata: {
    title: 'A sample notebook',
    created: new Date('2016-04-18T20:48:01.000Z'),
    author: 'Joel Auterson',
    datasources: {},
    original: undefined,
    showFooter: true,
    path: undefined
  },
  content: [ '0', '1', '2' ],
  blocks: {
    '0': {
      type: 'text',
      id: '0',
      content: '## This is a sample Notebook\n\nIt _should_ get correctly parsed.\n\n[This is a link](http://github.com)\n\n![Image, with alt](https://github.com/thing.jpg "Optional title")\n![](https://github.com/thing.jpg)\n\n```python\nprint "Non-runnable code sample"\n```\n\nAnd finally a runnable one...'
    }, '1': {
      type: 'code',
      content: 'console.log("Runnable");',
      language: 'javascript',
      option: 'runnable',
      id: '1'
    }, '2': {
      type: 'text',
      id: '2',
      content: '```\nIsolated non-runnable\n```'
    }
  }
})

test('correctly parses sample markdown', (t) => {
  const sampleMd = loadMarkdown('sampleNotebook')
  t.deepEqual(parse(sampleMd).toJS(), sampleNotebook.toJS())
})

test('uses placeholders for a blank document', (t) => {
  const expected = Immutable.fromJS({
    metadata: {
      title: undefined,
      author: undefined,
      created: undefined,
      showFooter: true,
      original: undefined,
      datasources: {},
      path: undefined
    },
    blocks: {},
    content: []
  })
  t.deepEqual(parse('').toJS(), expected.toJS())
})

test('should correctly render a sample notebook', (t) => {
  const sampleMd = loadMarkdown('sampleNotebook')
  t.deepEqual(render(sampleNotebook), sampleMd)
})

test('should correctly render an empty notebook', (t) => {
  const nb = Immutable.fromJS({
    metadata: {},
    blocks: {},
    content: []
  })
  const expected = '---\n---\n\n\n'
  t.deepEqual(render(nb), expected)
})

test('should render a parsed notebook to the original markdown', (t) => {
  const sampleMd = loadMarkdown('index')
  t.deepEqual(render(parse(sampleMd)), sampleMd)
})
