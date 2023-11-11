// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  HASH_LINKS,
  CLASS_NAV_LINK,
  CLASS_NAV_TARGET,
  AttackOptionsInterface,
  KeyFormInput,
  NavLinkInterface,
  TargetInterface,
  TrunksInterface,
} from "./interface.js";

import { getDocumentHeight } from "./functions.js";

export class NavLinks {
  elNav: HTMLElement = document.createElement("div");
  elSrc: HTMLElement = document.createElement("div");
  elContent: HTMLElement = document.createElement("div");
  elIframe: HTMLIFrameElement = document.createElement("iframe");

  constructor(
    public trunks: TrunksInterface,
    public navs: NavLinkInterface[],
  ) {
    const hdr = document.createElement("h3");
    hdr.innerText = "Links";
    hdr.onclick = () => {
      trunks.setContent(HASH_LINKS, null);
    };

    this.elNav.classList.add(CLASS_NAV_TARGET);
    this.elNav.appendChild(hdr);

    this.generateNav();
    this.generateContent();
  }

  generateNav() {
    this.navs.forEach((nav: NavLinkInterface) => {
      const el = document.createElement("div");
      el.classList.add(CLASS_NAV_LINK);
      el.textContent = nav.Text;
      el.onclick = () => {
        this.open(nav);
      };

      this.elNav.appendChild(el);
    });
  }

  generateContent() {
    this.elIframe.width = "100%";
    this.elIframe.height = getDocumentHeight() - 60 + "";

    this.elContent.appendChild(this.elSrc);
    this.elContent.appendChild(this.elIframe);
  }

  open(nav: NavLinkInterface) {
    if (nav.OpenInIFrame) {
      this.elSrc.textContent = "Source: " + nav.Href;
      this.elIframe.src = nav.Href;
      const target: TargetInterface = {
        ID: "nav",
        Name: "",
        BaseUrl: "",
        Opts: {} as AttackOptionsInterface,
        Vars: {} as KeyFormInput,
        HttpTargets: [],
        WebSocketTargets: [],
      };
      this.trunks.contentRenderer(target, null, null, nav, this.elContent);
    } else {
      window.open(nav.Href, "_blank");
    }
  }
}
