/* eslint-disable camelcase */
import CodeMirror from 'codemirror'

// trace the footnote, finding the url

/**
 * get link footnote content like
 *
 * ```markdown
 *  [icon]: http://laobubu.net/icon.png
 * ```
 *
 * @param {string} footNoteName case-insensive name, without '[' or ']'
 * @param {number} [line]       current line. if not set, the first definition will be returned
 * @returns {{line: number, content: string}}
 */
function readlink (footNoteName, line) {
  var defs = getCacheDB(this)[footNoteName.trim().toLowerCase()] || []
  var def = null
  if (typeof line !== 'number') line = 1e9
  for (var i = 0; i < defs.length; i++) {
    def = defs[i]
    if (def.line > line) break
  }
  return def
}

/**
 * re cache datas
 */
function recache () {
  var cm = this
  // debugger
  if (!cm.hmd) cm.hmd = {}
  var cache = cm.hmd.linkCache = {}
  cm.eachLine(function (line) {
    var txt = line.text
    var mat = /^(?:>\s+)*>?\s{0,3}\[([^\]]+)\]:\s*(.+)$/.exec(txt)
    if (mat) {
      var key = mat[1].trim().toLowerCase()
      var content = mat[2]
      if (!cache[key]) cache[key] = []
      cache[key].push({
        line: line.lineNo(),
        content
        // lineHandle: line
      })
    }
  })
}

/**
 * return the object reference to `cm`'s link cache
 *
 * [NOTE] the array is sorted.
 *
 * @returns {{[lowerTrimmedKey: string]: Array<{line: number, content: string}>}}
 */
function getCacheDB (cm) {
  if (!cm.hmd) cm.hmd = {}
  if (!cm.hmd.linkCache) {
    cm.hmd.linkCache = {}
    init(cm)
  }
  return cm.hmd.linkCache
}

function init (cm) {
  var delay
  var recache_delay = function () {
    recache.call(cm)
    delay = 0
  }
  recache_delay()
  cm.on('changes', function () { delay = delay || setTimeout(recache_delay, 100) })
}

CodeMirror.defineExtension('hmdReadLink', readlink)
