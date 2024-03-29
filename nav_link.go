// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import "fmt"

// NavLink contains the data for custom navigation link.
type NavLink struct {
	ID   string // Unique ID for this navigation, auto generated from Text.
	Text string // Text to display on navigation. Default to Href if its empty.
	Href string // The URL for navigation.

	// If true, the Href will be opened inside an iframe, otherwise it
	// will opened in new tab.
	OpenInIFrame bool
}

func (nav *NavLink) init() (err error) {
	nav.ID = generateID(nav.Text)
	if len(nav.Href) == 0 {
		return fmt.Errorf("NavLink: empty Href")
	}
	if len(nav.Text) == 0 {
		nav.Text = nav.Href
	}
	return nil
}
