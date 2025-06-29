# Gorankusu

Gorankusu is a Go library that provide HTTP service with web user interface
to test HTTP and/or WebSocket endpoints and for load testing HTTP endpoints.

For testing HTTP endpoints it use the
[lib/http](https://pkg.go.dev/git.sr.ht/~shulhan/pakakeh.go/lib/http)
package as the client, a wrapper for standard Go HTTP package.
For testing WebSocket endpoints it use the
[lib/websocket](https://pkg.go.dev/git.sr.ht/~shulhan/pakakeh.go/lib/websocket)
package as the client.
For the load testing we use
[vegeta](https://github.com/tsenart/vegeta)
as the backend.

[Go documentation](https://pkg.go.dev/git.sr.ht/~shulhan/gorankusu)

## Usage

See the
[example](https://git.sr.ht/~shulhan/gorankusu/tree/main/item/example.go)
code on how to programmatically use and create service using this module,
or,

* clone this repository,
* execute `make dev`, and
* open http://127.0.0.1:8217.


## Screenshots

The following screenshot display the main interface to Run or Attack the
registered HTTP service,

![Main interface](https://git.sr.ht/~shulhan/gorankusu/blob/main/_screenshots/gorankusu_example.png "Main interface")

The following screenshot display the result of attack in two forms, vegeta
metrics and vegeta histogram,

![Attack result](https://git.sr.ht/~shulhan/gorankusu/blob/main/_screenshots/gorankusu_attack_result.png "Attack result")


## Web user interface (WUI)

By default, the Gorankusu user interface can be viewed by opening in browser at
http://127.0.0.1:8217.
One can change address through Environment's ListenAddress.


## File name format

Each attack result is saved in Environment's ResultsDir with the following
file name format,

```
<Target.ID> "." <HttpTarget.ID> "." <DateTime> "." <Rate> "x" <Duration> "." <ResultsSuffix>
```

The "DateTime" is in the following layout,

```
YearMonthDate "_" HourMinuteSeconds
```

The "ResultsSuffix" is the one that defined in Environment.


## Development

Clone the repository and its submodule,

```
$ git clone https://git.sr.ht/~shulhan/gorankusu
$ git submodule update --init
```

Install the node tools inside the _www/ sub directory using `yarn`,

```
$ cd _www && yarn install
```

Made some changes and finally, run `make` to run lint and test the code.


## Links

[Repository](https://git.sr.ht/~shulhan/gorankusu):: Link to the source code.

[Mailing list](https://lists.sr.ht/~shulhan/gorankusu):: Link to discussion and
where to send patches.

[Issues](https://todo.sr.ht/~shulhan/gorankusu):: Link to report for bug or
feature.

[Changelog](https://kilabit.info/project/gorankusu/CHANGELOG.html):: Log for
each releases.


## Credits

The Gorankusu icon and image is provided by <https://www.spriters-resource.com/>.


## License

Copyright (C) 2021 M. Shulhan &lt;ms@kilabit.info&gt;

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
this program.  If not, see <https://www.gnu.org/licenses/>.
