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
import { GetDocumentHeight } from "./functions.js";

export class NavLinks {
  el_nav: HTMLElement = document.createElement("div");
  el_src: HTMLElement = document.createElement("div");
  el_content: HTMLElement = document.createElement("div");
  el_iframe: HTMLIFrameElement = document.createElement("iframe");

  constructor(
    public trunks: TrunksInterface,
    public navs: NavLinkInterface[],
  ) {
    let hdr = document.createElement("h3");
    hdr.innerText = "Links";
    hdr.onclick = () => {
      trunks.SetContent(HASH_LINKS, null);
    };

    this.el_nav.classList.add(CLASS_NAV_TARGET);
    this.el_nav.appendChild(hdr);

    this.generateNav();
    this.generateContent();
  }

  generateNav() {
    this.navs.forEach((nav: NavLinkInterface) => {
      let el = document.createElement("div");
      el.classList.add(CLASS_NAV_LINK);
      el.textContent = nav.Text;
      el.onclick = () => {
        this.open(nav);
      };

      this.el_nav.appendChild(el);
    });
  }

  generateContent() {
    this.el_iframe.width = "100%";
    this.el_iframe.height = GetDocumentHeight() - 60 + "";

    this.el_content.appendChild(this.el_src);
    this.el_content.appendChild(this.el_iframe);
  }

  open(nav: NavLinkInterface) {
    if (nav.OpenInIFrame) {
      this.el_src.textContent = "Source: " + nav.Href;
      this.el_iframe.src = nav.Href;
      let target: TargetInterface = {
        ID: "nav",
        Name: "",
        BaseUrl: "",
        Opts: {} as AttackOptionsInterface,
        Vars: {} as KeyFormInput,
        HttpTargets: [],
        WebSocketTargets: [],
      };
      this.trunks.ContentRenderer(target, null, null, nav, this.el_content);
    } else {
      window.open(nav.Href, "_blank");
    }
  }
}
