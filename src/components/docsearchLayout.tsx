import { h, Fragment, render } from "preact";

function iconHit(type) {
  switch (type) {
    case "lvl1":
      return "far fa-file";
    case "lvl2":
      return "fas fa-hashtag";
    case "lvl3":
      return "fas fa-hashtag";
    case "lvl4":
      return "fas fa-hashtag";
    case "content":
      return "fas fa-align-justify";
    default:
  }
}

export function DocsearchHitTemplate(item, root) {
  // todo icon
  // todo: debug fragment
  render(
    <div class="flex w-full">
      <div class="aa-ItemSourceIcon">
        <i class={iconHit(item.type)}></i>
      </div>

      {item.hierarchy[item.type] && item.type === "lvl1" && (
        <div className="aa-ItemContent aa-ItemContent--dual">
          <div class="aa-ItemContentTitle">{item.hierarchy.lvl1}</div>
          <div class="aa-ItemContentSubtitle">{item.hierarchy.lvl0}</div>
        </div>
      )}

      {item.hierarchy[item.type] &&
        (item.type === "lvl2" ||
          item.type === "lvl3" ||
          item.type === "lvl4" ||
          item.type === "lvl5" ||
          item.type === "lvl6") && (
          <div className="aa-ItemContent  aa-ItemContent--dual">
            <div class="aa-ItemContentTitle">{item.hierarchy[item.type]}</div>
            <div class="aa-ItemContentSubtitle">
              {item.hierarchy.lvl0}
              {item.hierarchy.lvl0 && item.hierarchy.lvl1 && (
                <i className="fas fa-chevron-right mx-1 fa-sm"></i>
              )}
              {item.hierarchy.lvl1}
            </div>
          </div>
        )}

      {item.type === "content" && (
        <div className="aa-ItemContent aa-ItemContent--dual">
          <div class="aa-ItemContentTitle">{item.content}</div>
          <div class="aa-ItemContentSubtitle">{item.hierarchy.lvl1}</div>
        </div>
      )}
      <button class="aa-ItemActionButton" type="button" title="select">
        <i class="mdi mdi-subdirectory-arrow-left"></i>
      </button>
    </div>,
    root
  );
}
