![Kayero](https://cdn.rawgit.com/mathieudutour/kayero/master/assets/kayero-logo.svg)

[![Build Status](https://travis-ci.org/mathieudutour/kayero.svg?branch=master)](https://travis-ci.org/mathieudutour/kayero)
[![Dependency Status](https://david-dm.org/mathieudutour/kayero.svg)](https://david-dm.org/mathieudutour/kayero)

Kayero is an interactive JavaScript notebooks editor, built on [Electron](https://github.com/atom/electron) and [Kajero](https://github.com/JoelOtter/kajero).

You can view an online sample notebook [here](http://www.joelotter.com/kajero).

![](https://raw.githubusercontent.com/mathieudutour/kayero/master/doc/screenshot.png)

## Features

- It's just Markdown - a Kayero notebook is just a Markdown document with a script attached.
- Every notebook is fully editable and can be saved as a Markdown file.
- JavaScript code blocks can be executed. They're treated as functions, with their return value visualised. Kayero can visualise arrays and objects, similar to the Chrome object inspector.
    - Code blocks can be set to run automatically when the notebook loads. They can also be set to hidden, so that only the result is visible.
- Data sources can be defined. These will be automatically fetched when the notebook is loaded, and made available for use inside code blocks. A datasource can be either:
    - a url returning a json object
    - a mongodb URL (the db will be available as a [monk](https://github.com/Automattic/monk) instance)
- Includes D3, NVD3 and [Jutsu](https://github.com/JoelOtter/jutsu), a very simple graphing library which uses Reshaper to transform arbitrary data into a form that can be graphed.


## Installing

### OS X

[![mac app store logo](https://devimages.apple.com.edgekey.net/app-store/marketing/guidelines/mac/images/badge-download-on-the-mac-app-store.svg)](https://itunes.apple.com/us/app/kayero/id1134758887?ls=1&mt=12)

or

Download the latest [Kayero release](https://github.com/mathieudutour/kayero/releases/latest).

### Windows

Download the latest [KayeroSetup.exe installer](https://github.com/mathieudutour/kayero/releases/latest).

## Building your own version

1. Clone the repository
2. Install the dependencies with `npm i`
2. Run `npm run build` to build the app.
