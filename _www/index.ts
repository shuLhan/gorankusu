// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Trunks } from "./trunks.js";

async function main() {
  const trunks = new Trunks();

  await trunks.init();
}

main();
