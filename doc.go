// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
Module trunks is a library and HTTP service that provide web user interface
to test HTTP service, similar to Postman, and for load testing.

For the load testing we use vegeta [1] as the backend.


Web user interface

By default, the Trunks user interface can be viewed by opening http://127.0.0.1:8217.
One can change address through Environment's ListenAddress.


File name format

Each attack result is saved in Environment's ResultsDir with the following
file name format,

	<Target.ID> "." <HttpTarget.ID> "." <DateTime> "." <Rate> "x" <Duration> "." <ResultsSuffix>

The "DateTime" is in the following layout,

	YearMonthDate "_" HourMinuteSeconds

The "ResultsSuffix" is the one that defined in Environment.


License

Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.

Use of this source code is governed by a BSD-style
license that can be found in the LICENSE file.


References

[1] https://github.com/tsenart/vegeta

*/
package trunks
