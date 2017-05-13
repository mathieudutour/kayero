import CodeMirror from 'codemirror'

// When a user clicks to move the cursor, releasing mouse button,
// the user's hand might shake and an unexcepted selection will be made.
// This addon suppresses the shake.

var duration = 100
var distance = 5

function cmMouseDownHandler (/* duration, distance, */cm, ev) {
  var handler = mouseMoveSuppress.bind(this, ev.clientX, ev.clientY/* , distance */)
  document.addEventListener('mousemove', handler, true)
  if (cm.hmdCursorDebounceTimeout) clearTimeout(cm.hmdCursorDebounceTimeout)
  cm.hmdCursorDebounceTimeout = setTimeout(function () {
    document.removeEventListener('mousemove', handler, true)
    cm.hmdCursorDebounceTimeout = 0
  }, duration)
}

function mouseMoveSuppress (originX, originY/* , distance */, ev) {
  if ((Math.abs(ev.clientX - originX) <= distance) && (Math.abs(ev.clientY - originY) <= distance)) {
    ev.stopPropagation()
  }
}

CodeMirror.defineOption('hmdCursorDebounce', true, function (cm, newVal, oldVal) {
  if (oldVal === 'CodeMirror.Init') oldVal = false
  if (oldVal && !newVal) { // close this feature
    cm.off('mousedown', cm.hmd.cursorDebounceCallback)
    cm.hmd.cursorDebounceCallback = null
  }
  if (!oldVal && newVal) {
    if (!cm.hmd) cm.hmd = {}
    cm.hmd.cursorDebounceCallback = cmMouseDownHandler.bind(cm)
    cm.on('mousedown', cm.hmd.cursorDebounceCallback)
  }
})
