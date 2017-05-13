import CodeMirror from 'codemirror'

// paste and upload image data (not file) from clipboard

/**
 * @typedef {function(string,string)} UploadCallback
 * 1st param is URL, 2nd is error message.
 */

/**
 * send data to url
 *
 * @param {string} url
 * @param {{[name:string]: string|File}} form
 * @param {UploadCallback} callback
 * @param {string} [method] - if not set, it will be `POST`
 */
function ajaxUpload (url, form, callback, method) {
  var xhr = new window.XMLHttpRequest()
  var formData = new window.FormData()
  for (var name in form) formData.append(name, form[name])

  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      var ret = xhr.responseText
      try { ret = JSON.parse(xhr.responseText) } catch (err) { }

      if (/^20\d/.test(xhr.status)) {
        callback(ret, null)
      } else {
        callback(null, ret)
      }
    }
  }

  xhr.open(method || 'POST', url, true)
  // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
  xhr.send(formData)
}

function Paste (cm) {
  this.cm = cm
  this.enabled = false
  this.uploadTo = 'sm.ms'

  this._pasteHandle = this.pasteHandle.bind(this)
  this.updateUploader(this.uploadTo)
}

/** @type {{[name:string]:function(file:File,callback:UploadCallback)}} */
var builtInUploader = {
  'sm.ms' (file, callback) {
    ajaxUpload(
      'https://sm.ms/api/upload',
      {
        smfile: file,
        format: 'json'
      },
      function (o, e) {
        if (!o) { o = e || {}; o.code = 'error' }
        callback(o.code === 'success' && o.data.url, JSON.stringify(o, null, 2))
      }
    )
  }
}

/**
 * update `this.upload` method with `newVal`
 *
 * @see {@link PasteImageUploader}
 *
 * @param {string | PasteImageUploader} newUploader - the uploader name, or a uploader function.
 * @returns {PasteImageUploader} the final applied uploader function.
 */
Paste.prototype.updateUploader = function (newUploader) {
  var uploadFunc = this.uploader
  var type = typeof newUploader

  if (type === 'function') {
    if (newUploader.length === 1) {
      // transform Promise style into callback style.
      uploadFunc = function (file, callback) {
        newUploader(file)
          .then(function (url) { callback(url, null) })
          .catch(function (err) { callback(null, err) })
      }
    } else {
      // callback style.
      uploadFunc = newUploader
    }
  } else if (type === 'string' && builtInUploader[newUploader]) {
    uploadFunc = builtInUploader[newUploader]
  }

  return (this.uploader = uploadFunc)
}

/**
 * @callback PasteImageUploader
 * @param {File} file
 * @param {UploadCallback} [callback]
 * @returns {Promise<string> | null}
 *
 * PasteImageUploader(aka. PasteImage Upload Function) has two forms:
 *
 * 1. ` ( file:File, callback: (url:string, err:string)=>void ) => void `
 *   - if failed to upload, the `url` shall be `null` and `err` shall be set.
 * 2. ` ( file:File ) => Promise<string> `
 */
/**
 * The default upload function shall be overrided!
 */
Paste.prototype.uploader = function (file, callback) {
  callback(null, 'Uploader is not configured')
}

/**
 * upload a image and insert at the current cursor.
 *
 * @param {File} file
 */
Paste.prototype.doInsert = function (file) {
  var self = this
  var cm = self.cm

  if (!/image\//.test(file.type)) return false

  cm.operation(function () {
    cm.replaceSelection('![](Uploading)')
    var pos = cm.getCursor()

    // add a bookmark before the left paren
    pos.ch -= 11
    var bookmark = cm.setBookmark(pos)

    // start uploading
    self.uploader(file, function (url, err) {
      pos = bookmark.find()
      bookmark.clear()

      // if failed to upload, show message
      if (!url) {
        window.alert('Failed to upload image\n\n' + err)
        cm.setCursor(pos)
        return
      }

      // replace `Uploading` with the URL
      var pos1 = { line: pos.line, ch: pos.ch + 1 }
      var pos2 = { line: pos.line, ch: pos.ch + 10 }
      cm.replaceRange(url, pos1, pos2)

      // update `<img>` if the text is folded
      var marks = cm.findMarksAt(pos1)
      for (var i = 0; i < marks.length; i++) {
        var mark = marks[i]
        if (mark.className === 'hmd-fold-image') {
          mark.replacedWith.src = url
        }
      }
    })
  })
}

/**
 * 'paste' event handler
 *
 * @param {ClipboardEvent} ev
 */
Paste.prototype.pasteHandle = function (cm, ev) {
  var cd = ev.clipboardData || window.clipboardData
  if (!cd || !cd.files || cd.files.length !== 1) return

  this.doInsert(cd.files[0])

  ev.preventDefault()
}
Paste.prototype.bind = function () { this.cm.on('paste', this._pasteHandle) }
Paste.prototype.unbind = function () { this.cm.off('paste', this._pasteHandle) }

/** get Paste instance of `cm`. if not exists, create one. */
function getPaste (cm) {
  if (!cm.hmd) cm.hmd = {}
  else if (cm.hmd.pasteImage) return cm.hmd.pasteImage

  var paste = new Paste(cm)
  cm.hmd.pasteImage = paste
  return paste
}

/**
 * @typedef PasteOption
 * @type {object}
 * @property {boolean} enabled
 * @property {PasteImageUploader | string} uploadTo
 */

/**
 * @type {PasteOption}
 */
var defaultOption = { // exposed options from Paste class
  enabled: false,
  uploadTo: 'sm.ms'
}

CodeMirror.defineOption('hmdPasteImage', false, function (cm, newVal) {
  // complete newCfg with default values
  var paste = getPaste(cm)
  var newCfg = {}

  if (newVal === true) newVal = { enabled: true }
  else if (/string|function/.test(typeof newVal)) newVal = { enabled: true, uploadTo: newVal }
  else {
    // normalize to boolean
    newVal.enabled = !!newVal.enabled
  }

  for (let k in defaultOption) {
    newCfg[k] = newVal.hasOwnProperty(k) ? newVal[k] : defaultOption[k]
  }

  if (paste.enabled !== newCfg.enabled) {
    newCfg.enabled ? paste.bind() : paste.unbind()
  }
  paste.updateUploader(newCfg.uploadTo)

  // write new values into cm
  for (let k in defaultOption) {
    paste[k] = newCfg[k]
  }
})

/** exports, for test */
export default {
  ajaxUpload,
  builtInUploader,
  Paste
}
