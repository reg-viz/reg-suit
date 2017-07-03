# reg-suit
A tool for visual regression testing.

* *Easy to setup*
* *Easy to integrate your CI flow*
* *Easy to extend*

## Getting Started

```sh
$ npm install -g reg-suit
$ cd path-to-your-project
$ reg-suit init
# Answer a few questions...
```

```sh
$ reg-suit run
```

## How it works

reg-suit calls installed plugins according to the following procedure:

* Determine the key of snapshot which will be used as the expected images via installed key-generator plugin. This step will be skipped if key-generator plugin is not set.
* Fetch the previous snapshot images as the expected snapshot via installed publisher plugin. This step will be skipped if publisher plugin is not set.
* Compare images using [reg-cli](https://github.com/bokuweb/reg-cli) and create report.
* Determine the key of the current snapshot via installed key-generator plugin. If key-Generator is not set, time stamp is used.
* Publish the current snapshot and report via installed publisher-plugin. This step will be skipped if publisher plugin is not set.
* Notify result via installed notifier-plugin.

## CLI Usage

### `run` command [default]

### `prepare` command

```sh
reg-suit prepare
```

It's useful to configure reg-suit and plugins.


## License
The MIT License (MIT)

Copyright 2017 Quramy

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
