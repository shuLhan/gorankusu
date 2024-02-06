// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { Gorankusu } from "./gorankusu.js";
async function main() {
    const gorankusu = new Gorankusu();
    await gorankusu.init();
}
main();
