// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

/*
Module trunks is a library and HTTP service that provide web user interface
to test HTTP service, similar to Postman, and for load testing.

For the load testing we use vegeta [1] as the backend.

Usage

See the example package on how to programmatically use and create service
using this module, or

	* clone this repository,
	* execute `make run`, and
	* open http://127.0.0.1:8217.


Screen shots

The following screenshot display the main interface to Run or Attack the
registered HTTP service,

https://git.sr.ht/~shulhan/trunks/blob/main/_screenshots/trunks_example.png

The following screenshot display the result of attack in two forms, vegeta
metrics and vegeta histogram,

https://git.sr.ht/~shulhan/trunks/blob/main/_screenshots/trunks_attack_result.png


Web user interface

By default, the Trunks user interface can be viewed by opening in browser at
http://127.0.0.1:8217.
One can change address through Environment's ListenAddress.


File name format

Each attack result is saved in Environment's ResultsDir with the following
file name format,

	<Target.ID> "." <HttpTarget.ID> "." <DateTime> "." <Rate> "x" <Duration> "." <ResultsSuffix>

The "DateTime" is in the following layout,

	YearMonthDate "_" HourMinuteSeconds

The "ResultsSuffix" is the one that defined in Environment.


License

Copyright 2021, Shulhan <ms@kilabit.info>.
All rights reserved.
Use of this source code is governed by a BSD-style license that can be found in the LICENSE file.


References

[1] https://github.com/tsenart/vegeta

*/
package trunks
