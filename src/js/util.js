import hljs from 'highlight.js'
import config from './config'

export function highlight (str, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(lang, str).value
    } catch (__) {}
  }
  return '' // use external default escaping
}

export function renderHTML (markdown) {
  let result = '<!DOCTYPE html>\n<html>\n    <head>\n'
  result += '        <meta name="viewport" content="width=device-width, initial-scale=1">\n'
  result += '        <meta http-equiv="content-type" content="text/html; charset=UTF8">\n'
  result += '        <link rel="stylesheet" href="' + config.cssUrl + '">\n'
  result += '    </head>\n    <body>\n        <script type="text/markdown" id="kayero-md">\n'
  result += markdown.split('\n').map((line) => {
    if (line.match(/\S+/m)) {
      return '            ' + line
    }
    return ''
  }).join('\n')
  result += '        </script>\n'
  result += '        <div id="kayero"></div>\n'
  result += '        <script type="text/javascript" src="' + config.scriptUrl + '"></script>\n'
  result += '    </body>\n</html>\n'
  return result
}

export function arrayToCSV (data) {
  return new Promise((resolve, reject) => {
    let CSV = ''
    let header = ''
    Object.keys(data[0]).forEach(colName => {
      header += colName + ','
    })
    header = header.slice(0, -1)
    CSV += header + '\r\n'
    data.forEach((rowData) => {
      let row = ''
      Object.keys(rowData).forEach(colName => {
        row += '"' + rowData[colName] + '",'
      })
      row.slice(0, -1)
      CSV += row + '\r\n'
    })

    resolve(CSV)
  })
}
