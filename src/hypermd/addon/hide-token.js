/* eslint-disable camelcase, no-sequences */
import CodeMirror from 'codemirror'

// Auto show/hide markdown tokens like `##` or `*`
// Works with `hypermd` mode

/**
 * check if every element in `search` can be found in `bigarray`
 *
 * ( search ⊂ bigarray )
 *
 * [EDGE CASE] if `search` is empty, this will return `false`
 *
 * @param {any[]} bigarray
 * @param {any[]} search
 * @returns {boolean}
 */
function arrayContainsArray (bigarray, search) {
  if (!search.length) return false
  var search2 = search.slice(0)
  for (var i = 0; i < bigarray.length; i++) {
    var cmp1 = bigarray[i]
    for (var j = 0; j < search2.length; j++) {
      var cmp2 = search2[j]
      if (cmp1 === cmp2) {
        search2.splice(j--, 1)
      }
    }
  }
  return search2.length === 0
}

/**
 * get class name list
 *
 * @param {Element} ele
 * @returns {string[]}
 */
function getClassList (ele) {
  return (ele && ele.className && ele.className.trim().split(/[\s\r\n]+/)) || []
}

/**
 * get LineView
 *
 * @param {object} cm       editor instance
 * @param {number} line     line number since 0
 * @returns {object}
 */
function getLineView (cm, line) {
  var i = line - cm.display.viewFrom
  var vl
  if (i >= cm.display.view.length) i = cm.display.view.length - 1
  var v = cm.display.view[i]
  if (!v || (vl = v.line.lineNo()) === line) return v
  if (vl < line) {
    while (vl < line && ++i < cm.display.view.length) {
      v = cm.display.view[i]
      if (!v || (vl = v.line.lineNo()) === line) return v
    }
    return null
  }
  if (vl > line) {
    while (vl > line && i--) {
      v = cm.display.view[i]
      if (!v || (vl = v.line.lineNo()) === line) return v
    }
  }
  return null
}

/**
 * (for patchFormattingSpan) line style checker
 *
 * @param {NodeList} spans
 */
function _IsIndentCodeBlock (spans) {
  if (!(spans.length >= 2 && /^\s+$/.test(spans[0].textContent))) return false
  for (var i = 1; i < spans.length; i++) {
    if (!/\bcm-(?:tab|inline-code)\b/.test(spans[i].className)) return false
  }
  return true
}

/**
 * adding/removing `cm-formatting-hidden` to/from the <span>s that contain Markdown tokens (eg. `### ` or `~~`)
 *
 * a member of class `HideToken`
 *
 * @param {object} cm                       CodeMirror editor instance
 * @param {Element} line                    The <pre> element
 * @param {{line:number, ch?:number}} pos   Current cursor position. Nearby Markdown tokens will show up.
 * @param {boolean} [rebuildCache]          Empty cursor position cache data or not. Expensive. (see `cursorCoords`)
 */
function patchFormattingSpan (cm, line, pos, rebuildCache) {
  if (!line) return

  var line2 = line.children[0]   // the container of <span>s. <pre class='CodeMirror-line'><span style=''> ... real content ...
  var spans = line2.childNodes

  // FIXME: partial-cross-line marks are currently not supported
  var textmark_itered = 0
  var char_itered = 0

  /** @type {HTMLElement} */
  var span = null
  var span_i = 0

  /** @type {{[index:number]: any}} */
  var visible_span_indices = {}

  var lineView = getLineView(cm, pos.line)
  var tokenState = (lineView && lineView.line.stateAfter) ||  // use cached data is much faster
    cm.getTokenAt({ line: pos.line + 1, ch: 0 }).state      // but sometimes the data does not exists.
  var tokenStateBase = tokenState // raw token state from Markdown
  while (tokenStateBase.base) tokenStateBase = tokenStateBase.base

  /// adding className to <pre> for some special lines

  function findSpanWithClass (className) {
    if (!spans) return null
    for (var i = 0; i < spans.length; i++) {
      var rtn = spans[i]
      if (rtn.classList && rtn.classList.contains(className)) return rtn
    }
    return null
  }

  // adding cm-quote indent placeholder
  if (
    tokenStateBase.quote
  ) {
    line.classList.add('hmd-quote-indent')
    line.classList.add('hmd-quote-indent-' + tokenStateBase.quote)
  }

  // adding class to code block (GFM)
  if (tokenStateBase.fencedChars) {
    if (line2.querySelector('.cm-formatting-code-block')) {
      line.classList.add('hmd-codeblock-end')
    } else {
      line.classList.add('hmd-codeblock')
    }
  } else if (line2.querySelector('.cm-formatting-code-block')) {
    line.classList.add('hmd-codeblock-start')
  }

  // adding class to code block (indent)
  if (_IsIndentCodeBlock(spans)) {
    line.classList.add('hmd-codeblock-indent')
    line.classList.add('hmd-codeblock')
  }

  // adding footnote
  if (findSpanWithClass('cm-hmd-footnote')) {
    line.classList.add('hmd-footnote-line')
  }

  // adding class to code block (GFM)
  if (tokenStateBase.listStack && findSpanWithClass('cm-list-' + tokenStateBase.listStack.length)) {
    line.classList.add('hmd-list')
    line.classList.add('hmd-list-' + tokenStateBase.listStack.length)
  }

  // adding header stuff
  var _cnextLineToken = cm.getTokenTypeAt({ line: pos.line + 1, ch: 0 })
  var _hlevel = null
  if (_cnextLineToken && (_hlevel = /hmd-stdheader-(\d)/.exec(_cnextLineToken))) _hlevel = _hlevel[1]
  else if (spans[0] && (_hlevel = /cm-header-(\d)/.exec(spans[0].className))) _hlevel = _hlevel[1]
  if (_hlevel) {
    line.classList.add('hmd-stdheader')
    line.classList.add('hmd-stdheader-' + _hlevel)
  }

  /// Find the span where cursor is on, then hide/show spans

  if (typeof pos.ch === 'number') {
    for (span_i = 0; span_i < spans.length; span_i++) {
      span = spans[span_i]
      if (span.classList && span.classList.contains('CodeMirror-widget')) {
        if (lineView) { // FIXME: remove this and scroll to reproduce the bug
          var local_mark = lineView.line.markedSpans[textmark_itered++]
          char_itered += local_mark.to - local_mark.from
          span = spans[span_i + 1]
        }
      } else {
        var text = span.textContent
        char_itered += text.length
      }
      if (char_itered >= pos.ch) break
    }

    if (span && span.nodeType === window.Node.ELEMENT_NODE) {
      var classList1 = getClassList(span)

      // if current cursor is on a token, set `span` to the content and re-retrive its class string[]
      if (span.classList.contains('cm-formatting')) {
        visible_span_indices[span_i] = true // if the token is incompleted, it's still visible

        if (arrayContainsArray(classList1, getClassList(span.nextSibling))) {
          span = span.nextSibling
          span_i++
        } else if (arrayContainsArray(classList1, getClassList(span.previousSibling))) {
          span = span.previousSibling
          span_i--
        }

        classList1 = getClassList(span)
      }

      // a trick
      classList1.push('cm-formatting')

      // forward search
      var span_tmp = span
      var span_tmp_i = span_i
      while (span_tmp_i++, span_tmp = span_tmp.nextSibling) {
        let classList2 = getClassList(span_tmp)
        visible_span_indices[span_tmp_i] = true

        if (arrayContainsArray(classList2, classList1)) break
      }

      // backward search
      span_tmp = span
      span_tmp_i = span_i
      while (span_tmp_i--, span_tmp = span_tmp.previousSibling) {
        let classList2 = getClassList(span_tmp)
        visible_span_indices[span_tmp_i] = true

        if (arrayContainsArray(classList2, classList1)) break
      }
    }
  }

  for (var i = 0; i < spans.length; i++) {
    span = spans[i]
    if (
      span.nodeType === window.Node.ELEMENT_NODE &&
      this.matchRegex.test(span.className)
    ) {
      if (!visible_span_indices[i]) {
        span.classList.add('cm-formatting-hidden')
      } else {
        span.classList.remove('cm-formatting-hidden')
      }
    }
  }

  if (rebuildCache) {
    getLineView(cm, pos.line).measure.cache = {}
  }
}

function HideToken (cm) {
  this.cm = cm
  this.eventBinded = false
  this.tokenTypes = ''
  this.matchRegex = /^$/

  this._renderLine = this.renderLine.bind(this)

  this.lastCursorPos = { line: 0, ch: 0 }
  this._cursorHandler = this.cursorHandler.bind(this)
}

HideToken.prototype.setTokenTypes = function (tokenTypes) {
  this.tokenTypes = tokenTypes
  this.matchRegex = new RegExp('\\scm-formatting-(' + tokenTypes + ')(?:\\s|$)')

  if (this.eventBinded ^ !!tokenTypes) {
    var cm = this.cm
    if (tokenTypes) {
      cm.on('renderLine', this._renderLine)
      cm.on('cursorActivity', this._cursorHandler)
    } else {
      cm.off('renderLine', this._renderLine)
      cm.off('cursorActivity', this._cursorHandler)
    }
    this.eventBinded = !!tokenTypes
  }
}

HideToken.prototype.renderLine = function (cm, line_handle, ele) {
  var pos = cm.getCursor()
  var line = ele
  var linenum = line_handle.lineNo()
  this.patchFormattingSpan(cm, line, ((linenum === pos.line) && pos) || { line: linenum })
}

HideToken.prototype.cursorHandler = function (cm) {
  var pos = cm.getCursor()
  var lastCursorPos = this.lastCursorPos
  if (lastCursorPos.line !== pos.line) {
    let line = getLineView(cm, lastCursorPos.line)
    if (line) {
      this.patchFormattingSpan(cm, line.text, { line: lastCursorPos.line })
      if (line.measure) line.measure.cache = {}
    }
  }
  var line = getLineView(cm, pos.line)
  if (line) {
    this.patchFormattingSpan(cm, line.text, pos, true)
  }
  this.lastCursorPos = pos
}

HideToken.prototype.patchFormattingSpan = patchFormattingSpan

/** get Hide instance of `cm`. if not exists, create one. */
function getHide (cm) {
  if (!cm.hmd) cm.hmd = {}
  else if (cm.hmd.hideToken) return cm.hmd.hideToken

  var fold = new HideToken(cm)
  cm.hmd.hideToken = fold
  return fold
}

var defaultTokenTypes = 'em|code-block|strong|strikethrough|quote|code|header|task|link|escape-char|footref|hmd-stdheader'
CodeMirror.defineOption('hmdHideToken', '', function (cm, newVal) {
  // complete newCfg with default values
  var hide = getHide(cm)
  if (newVal === '(profile-1)') newVal = defaultTokenTypes

  hide.setTokenTypes(newVal)
  cm.refresh() // force re-render lines
})
