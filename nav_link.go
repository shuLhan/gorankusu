// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import "fmt"

// NavLink contains the data for custom navigation link.
type NavLink struct {
	Text string // Text to display on navigation. Default to Href if its empty.
	Href string // The URL for navigation.
}

func (nav *NavLink) init() (err error) {
	if len(nav.Href) == 0 {
		return fmt.Errorf("NavLink: empty Href")
	}
	if len(nav.Text) == 0 {
		nav.Text = nav.Href
	}
	return nil
}
