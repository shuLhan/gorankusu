// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

// FormInputKind define type for form input.
type FormInputKind string

// List of valid value for field FormInput.Kind.
const (
	// FormInputKindBoolean only used for convertion, for example
	// ToJSONObject.
	// In the WUI, it will be rendered as string.
	FormInputKindBoolean = `boolean`
	FormInputKindNumber  = `number`
	FormInputKindString  = `string`
)

// FormInput provide the information to create an input component.
//
// The Label field define the input text, the Hint field provide a
// description about the input, the Kind field describe the type of input
// (number, string, and so on), and the Value field contains default value for
// input.
//
// The Max and Min fields is optional, it only affect if the Kind is
// FormInputKindNumber.
type FormInput struct {
	Label string        `json:"label"`
	Hint  string        `json:"hint"`
	Kind  FormInputKind `json:"kind"`
	Value string        `json:"value"`
	Max   float64       `json:"max,omitempty"`
	Min   float64       `json:"min,omitempty"`
}
