// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"strings"
	"unicode"
)

//
// generateID replace non-letter and non-number from input string with '_'.
//
func generateID(in string) (out string) {
	var r []rune = make([]rune, 0, len(in))
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
