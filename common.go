// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"strings"
	"unicode"
)

// generateID replace non-letter and non-number from input string with '_'.
func generateID(in string) (out string) {
	var r = make([]rune, 0, len(in))
	in = strings.ToLower(in)
	for _, c := range in {
		if unicode.IsLetter(c) || unicode.IsNumber(c) {
			r = append(r, c)
		} else {
			r = append(r, '_')
		}
	}
	return string(r)
}
