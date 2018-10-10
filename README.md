# TagReleaseLog

Generate release log between tags to `changeLog.md`.

Each tag's changelogs will be saved @ `/trlog`

# program

```js
Usage: tagchanges [options] [command]

Options:

  -V, --version                  output the version number
  -r, --repository [repository]  Path for repository
  -f, --file [file]              Path for changelog.md(default to root of repository), e.g. xxx.md (default: changeLog.md)
  -n, --no-save                  Print only and donot save
  -h, --head                     Enable changelog from HEAD
  -l, --list                     Generate the change files between tags
  -h, --help                     output usage information

Commands:

  gen                            generate changelogs
```

# Getting started

- Before installing, download and install Node.js. Node.js 8.0.0 or higher is required

1. global
  - npm install: `npm -g install tagchanges`
  - enter the target project & run tagchanges: `cd my-project && tagchanges gen`

2. script
  - npm install: `npm install tagchanges --save-dev`
  - add script : `changelog: "tagchanges gen"`
  - run : `npm run changelog`

3. run in node
  - require: `const changelog = require('tagchanges');`
  - run : `changelog({ repository: '.', save: false }).then(result => {/*...*/}).catch(err => {})`
