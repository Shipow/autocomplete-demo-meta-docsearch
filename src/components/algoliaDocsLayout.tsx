import { h, Fragment, render } from "preact";

function iconHit(type) {
  switch (type) {
    case "guide":
      return "far fa-file";
    case "faq":
      return "far fa-question-circle";
    case "how_to":
      return "fas fa-graduation-cap";
    case "tutorial":
      return "fas fa-graduation-cap";
    case "solution":
      return "fas fa-clipboard-check";
    case "widget":
      return "fas fa-box";
    case "framework_integration":
      return "fas fa-plug";
    case "integration":
      return "fas fa-plug";
    case "method":
      return "fas fa-code";
    case "rest_api":
      return "fas fa-code";
    case "parameter":
      return "fas fa-code";
    case "api_client":
      return "fas fa-code";
    case "in_depth":
      return "fas fa-book";
    case "tool":
      return "fas fa-wrench";
    default:
  }
}

export function AlgoliaDocsHitTemplate(item, root) {
  // todo icon
  //
  render(
    <a class="aa-ItemLink">
      <div class="aa-ItemSourceIcon">
        <i class={"faw " + iconHit(item.type)}></i>
      </div>
      <div class="aa-ItemContent aa-ItemContent--dual">
        <div class="aa-ItemContentTitle">{item.title}</div>
        <div class="aa-ItemContentSubtitle">
          {item.content_structure.lvl0} &gt; {item.content_structure.lvl1}
        </div>
      </div>
      <button class="aa-ItemActionButton" type="button" title="select">
        <i class="mdi mdi-subdirectory-arrow-left"></i>
      </button>
    </a>,
    root
  );
}
