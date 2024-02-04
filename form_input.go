// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

// FormInputKind define type for form input.
type FormInputKind string

// List of valid value for field [FormInput] Kind.
const (
	// FormInputKindBoolean only used for convertion, for example
	// ToJSONObject.
	// In the WUI, it will be rendered as string.
	FormInputKindBoolean = `boolean`

	// FormInputKindFile define the input for uploading file.
	// This form will rendered as "<input type='file' ...>" on the web
	// user interface.
	// Once submitted, the file name, type, size, and lastModification
	// will be stored under [FormInput] Filename, Filetype, Filesize,
	// and Filemodms.
	FormInputKindFile = `file`

	FormInputKindNumber = `number`
	FormInputKindString = `string`
)

// FormInput provide the information to create an input component.
//
// The Label field define the input text.
// The Hint field provide a description about the input.
// The Kind field describe the type of input (number, string, and so on).
// The Value field contains default value for input.
//
// The Max and Min fields is optional, it only affect if the Kind is
// FormInputKindNumber.
//
// If the Kind is FormInputKindFile, the Filename, Filetype, Filesize, and
// Filemodms will be filled by request based on the file name, type, size,
// and modification time.
type FormInput struct {
	// FormDataName define function to map FormInputKindFile name
	// into different name.
	// For example, instead of,
	//
	//	Content-Disposition: form-data; name="filesize"
	//
	// One can change the "filesize" to "size" using this function, so
	// generated request body would be,
	//
	//	Content-Disposition: form-data; name="size"
	FormDataName func(string) string `json:"-"`

	Label string        `json:"label"`
	Hint  string        `json:"hint"`
	Kind  FormInputKind `json:"kind"`
	Value string        `json:"value"`

	// The name of file for FormInputKindFile.
	Filename string `json:"filename"`

	Filetype string `json:"filetype"`

	// The file size for FormInputKindFile.
	Filesize int64 `json:"filesize"`

	// The file modification in millisecond.
	Filemodms int64 `json:"filemodms"`

	Max float64 `json:"max,omitempty"`
	Min float64 `json:"min,omitempty"`
}

func (fi *FormInput) init() {
	if fi.FormDataName == nil {
		fi.FormDataName = defaultFormDataName
	}
}

func defaultFormDataName(in string) string {
	return in
}
