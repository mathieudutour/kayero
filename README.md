![Kayero](https://raw.githubusercontent.com/mathieudutour/kayero/master/assets/kayero-logo.svg)

[![Build Status](https://travis-ci.org/mathieudutour/kayero.svg?branch=master)](https://travis-ci.org/mathieudutour/kayero)
[![Dependency Status](https://david-dm.org/mathieudutour/kayero.svg)](https://david-dm.org/mathieudutour/kayero)

Kayero is an interactive JavaScript notebooks editor, built on [Electron](https://github.com/atom/electron) and [Kajero](https://github.com/JoelOtter/kajero).

You can view an online sample notebook [here](http://www.joelotter.com/kajero).

![](https://raw.githubusercontent.com/mathieudutour/kayero/master/doc/screenshot.png)

## Features

- It's just Markdown - a Kayero notebook is just a Markdown document with a script attached.
- Every notebook is fully editable and can be saved as a Markdown file.
- Notebooks can also be published as Gists, generating a unique URL for your notebook.
- JavaScript code blocks can be executed. They're treated as functions, with their return value visualised. Kayero can visualise arrays and objects, similar to the Chrome object inspector.
    - Code blocks can be set to run automatically when the notebook loads. They can also be set to hidden, so that only the result is visible.
- Data sources can be defined. These will be automatically fetched when the notebook is loaded, and made available for use inside code blocks. A datasource can be either:
    - a url returning a json object
    - a mongodb URL (the db will be available as a [monk](https://github.com/Automattic/monk) instance)
- Includes D3, NVD3 and [Jutsu](https://github.com/JoelOtter/jutsu), a very simple graphing library which uses Reshaper to transform arbitrary data into a form that can be graphed.


## Installing

### OS X

Download the latest [Kayero release](https://github.com/mathieudutour/kayero/releases/latest).

Atom will automatically update when a new release is available.

### Windows

Download the latest [KayeroSetup.exe installer](https://github.com/mathieudutour/kayero/releases/latest).

Atom will automatically update when a new release is available.

### Debian Linux (Ubuntu)

Currently only a 64-bit version is available.

1. Download `kayero-amd64.deb` from the [Kayero releases page](https://github.com/mathieudutour/kayero/releases/latest).
2. Run `sudo dpkg --install kayero-amd64.deb` on the downloaded package.
3. Launch Atom using the installed `kayero` command.

The Linux version does not currently automatically update so you will need to
repeat these steps to upgrade to future releases.

### Red Hat Linux (Fedora 21 and under, CentOS, Red Hat)

Currently only a 64-bit version is available.

1. Download `kayero.x86_64.rpm` from the [Kayero releases page](https://github.com/mathieudutour/kayero/releases/latest).
2. Run `sudo yum localinstall kayero.x86_64.rpm` on the downloaded package.
3. Launch Atom using the installed `kayero` command.

The Linux version does not currently automatically update so you will need to
repeat these steps to upgrade to future releases.

### Fedora 22+

Currently only a 64-bit version is available.

1. Download `kayero.x86_64.rpm` from the [Atom releases page](https://github.com/mathieudutour/kayero/releases/latest).
2. Run `sudo dnf install ./kayero.x86_64.rpm` on the downloaded package.
3. Launch Atom using the installed `kayero` command.

The Linux version does not currently automatically update so you will need to
repeat these steps to upgrade to future releases.

## Building your own version

1. Clone the repository
2. Install the dependencies with `npm i`
2. Run `npm run build` to build the app.
