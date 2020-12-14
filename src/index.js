import algoliasearch from "algoliasearch/lite";
import { autocomplete, getAlgoliaHits } from "@algolia/autocomplete-js";

import { h, render } from "preact";
import dayjs from "dayjs";
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

// todo: rename components
// load tailwind 2
// custom templates for hits when smart template is not enough
import { DocsearchHitTemplate } from "./components/docsearchLayout.tsx";
import { AlgoliaDocsHitTemplate } from "./components/algoliaDocsLayout.tsx";

// preview - made with preact + tailwind
import {
  ContentPreview,
  ContentPreviewGithub,
  ContentPreviewDocsearch
} from "./components/contentPreviewDocsearch";

//debug console
// import { StateConsole } from "./components/stateConsole.jsx";

// static sources
import colors from "./data/colors.json";
import spacing from "./data/spacing.json";

// todo: recent searches
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: "navbar"
});

//
function createRef(initialValue) {
  return {
    current: initialValue
  };
}

// stack overflow algolia
const stackoverflowAlgoliaSearchClient = algoliasearch(
  "T2ZX9HO66V",
  "4439a58848ba6db08b26775e4c881530"
);

// algolia www
const algoliaWebsiteSearchClient = algoliasearch(
  "latency",
  "af044fb0788d6bb15f807e4420592bc5"
);

// algolia docs
const algoliaDocsSearchClient = algoliasearch(
  "B1G2GM9NG0",
  "3ec8b05f457a8e2637cb430fb3806569"
);
// fa
const fontAwesomeSearchClient = algoliasearch(
  "M19DXW5X0Q",
  "c79b2e61519372a99fa5890db070064c"
);
// mdi
const mdiSearchClient = algoliasearch(
  "CYV4BPSNZP",
  "8644782c23aba3eeca43d4e99bcb6b73"
);

// HUB (+ github issue and PR for Algolia OSS)
const initialSearchClient = algoliasearch(
  "DSW01O6QPF",
  "e55d03a808bad4e426d28fd4a1a18338"
);

// HUB (+ github issue and PR for Algolia OSS)
const githubSearchClient = algoliasearch(
  "DSW01O6QPF",
  "3266a0c952d007ef7e7bae0e600eb63d"
);

const searchClientRef = createRef(initialSearchClient);

function makeRequest(method, url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

function hitLayoutSmart(item, { main, extra, icon, url, description }) {
  // todo: add highlighting with better utils
  // todo: reverse with flex direction + css var?
  // todo: inline + dual compo?
  const imageExt = /\.svg|\.ico|\.png|data:image/g;
  // support material design and font awesome icons
  const iconSet = /^fa|mdi/g;

  if (icon && icon.match(imageExt)) {
    icon = `<img src="${icon}"/>`;
  } else if (icon && icon.match(iconSet)) {
    icon = `<i class="faw ${icon}"></i>`;
  }

  return `${!!url ? '<a class="aa-ItemLink" href="{url}">' : ""}
      ${icon ? '<div class="aa-ItemSourceIcon">' + icon + "</div>" : ""}
      <div class="aa-ItemContent">
        <span class="aa-ItemContentTitle">${main}</span>
        ${
          typeof extra === "string" || typeof extra === "number"
            ? `<span class="aa-ItemContentSubtitle"><span class="aa-ItemContentDash">—</span> ${extra}</span>`
            : ""
        }
        ${
          typeof extra === "object" && extra
            ? `<div class="aa-ItemContentSubtitle">${extra
                .map((tag) => `<span class="aa-ItemContentTag">${tag}</span>`)
                .join("")}</div>`
            : ""
        }
        ${
          description
            ? '<div class="aa-ItemContentDescription">' + description + "</div>"
            : ""
        }
      </div>
      <button class="aa-ItemActionButton" type="button" title="select">
        <i class="mdi mdi-subdirectory-arrow-left"></i>
      </button>
    ${!!url ? "</a>" : ""}</div>`;
}

function githubLayout(item) {
  const template = {};
  switch (item.type) {
    case "Issue":
      template.icon = "fas fa-exclamation-circle";
      break;
    case "PR":
      template.icon = "fas fa-code-branch";
      break;
    default:
      break;
  }
  switch (item.state) {
    case "open":
      template.iconClass = "text-green-500";
      break;
    case "closed":
      if (item.merged_at) {
        template.iconClass = "text-indigo-500";
      } else {
        template.iconClass = "text-red-500";
      }
      break;
    default:
      break;
  }

  return `
    <a class="aa-ItemLink" href="https://github.com/${item.owner}/${
    item.repo
  }/issues/${item.number}">
      <div class="aa-ItemSourceIcon"><i class="${template.icon} ${
    template.iconClass
  }"></i></div>
      <div class="aa-ItemContent aa-ItemContent--dual">
        <span class="aa-ItemContentTitle">${item.title}</span>
        <span class="aa-ItemContentSubtitle">
          <span class="aa-ItemContentDash">#</span>${item.number}
          <span class="aa-ItemContentDash">-</span>${dayjs().to(
            dayjs(item.created_at)
          )}
          <span class="aa-ItemContentDash">by </span>${item.user.login}
          <span class="aa-ItemContentDash">on </span>${item.repo}
        </span>

      </div>
      <button class="aa-ItemActionButton" type="button" title="select">
        <i class=""></i>
      </button>
    </a>`;
}

// experiment with animation
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// temp tag manager
function setTag(tag) {
  const container = document.querySelector(".aa-InputWrapperPrefix");
  let tags = document.getElementById("tagsWrapper");
  if (!tags) {
    const tagsWrapper = document.createElement("div");
    tagsWrapper.setAttribute("id", "tagsWrapper");
    container.appendChild(tagsWrapper);
    tags = tagsWrapper;
  }
  tags.innerHTML = "";
  if (!!tag) {
    const t = document.createElement("div");
    t.setAttribute(
      "class",
      "inputTag animate__animated animate__bounceIn animate__faster"
    );
    t.textContent = tag;
    const x = document.createElement("span");
    x.setAttribute("class", "inputTagRemoveIcon fas fa-times");
    t.appendChild(x);
    tags.appendChild(t);
    t.addEventListener("click", () => {
      t.setAttribute("class", "animate__animated animate__backOutLeft");
      sleep(220).then(() => setTag(null));
      aaDemo.setContext({
        githubTopic: null,
        githubProject: null,
        index: null,
        stepAction: null,
        stepLabel: null,
        icon: null
      });
      document.querySelector(".aa-InputWrapper input").focus();
      aaDemo.refresh();
    });
  }
}

// generic header for section
function headerLayout({ items, sourceTitle }) {
  if (items.length === 0) {
    return "";
  }
  // if items.length > 0
  // count ?
  // show more ?
  return `<span>${sourceTitle}</span>
  <div class="aa-SourceHeaderLine"></div>`;
}

// action set css
function setCssVar(attribute, value) {
  document.documentElement.style.setProperty(attribute, value);
  setTag(null);
  aaDemo.setContext({
    stepAction: null,
    stepLabel: null
  });
  aaDemo.setQuery("css");
  aaDemo.setIsOpen(true);
  aaDemo.refresh();
}

//icon for fa
function buildIcon_FA(item) {
  switch (item.styles && item.styles[0]) {
    case "regular":
      return `far fa-${item.name} faw`;
    case "solid":
      return `fas fa-${item.name} faw`;
    case "brands":
      return `fab fa-${item.name} faw`;
    default:
  }
}
// Icon for mdi
function buildIcon_MDI(item) {
  return `mdi mdi-${item.name}`;
}

const activeItemRef = createRef(null);
const lastStateRef = createRef({});

const aaDemo = autocomplete({
  panelContainer: ".aa-Panel",
  placeholder: "Search OSS or type / to display shortcuts",
  //debug: true,
  autoFocus: true,
  openOnFocus: true,
  defaultSelectedItemId: 0,
  container: "#autocomplete",
  //todo update templates for plugins
  //plugins: [recentSearchesPlugin],
  initialState: {
    context: {
      appID: "BH4D9OD16A",
      apiKey: null,
      index: null
    }
  },
  onReset() {
    setTag(null);
    aaDemo.setContext({
      index: null,
      apiKey: null,
      docsearchProject: null
    });
    aaDemo.refresh();
  },
  getInputProps({ props, inputElement, state }) {
    return {
      ...props,
      onKeyDown(event) {
        const activeItem = activeItemRef.current;

        if (inputElement.selectionStart === 0 && event.key === "Backspace") {
          setTag(null);
          aaDemo.setContext({
            githubTopic: null,
            githubProject: null,
            index: null,
            stepAction: null,
            stepLabel: null,
            icon: null
          });
          aaDemo.refresh();
        }
        if (event.key === "Tab" && activeItem) {
          event.preventDefault();
          setTag(activeItem.docsearch.index);
          aaDemo.setQuery("");
          aaDemo.setContext({
            index: activeItem.docsearch.index,
            apiKey: activeItem.docsearch.apiKey,
            docsearchProject: activeItem
          });
          aaDemo.refresh();
        }
        if (
          event.key === " " &&
          activeItem.docsearch?.index === lastStateRef.current.query
        ) {
          event.preventDefault();
          setTag(activeItem.docsearch.index);
          aaDemo.setQuery("");
          aaDemo.setContext({
            index: activeItem.docsearch.index,
            apiKey: activeItem.docsearch.apiKey,
            docsearchProject: activeItem
          });
          aaDemo.refresh();
        }
        props.onKeyDown(event);
      }
    };
  },
  onStateChange({ prevState, state }) {
    lastStateRef.current = state;
    if (prevState.context.index !== state.context.index) {
      if (state.context.index === null) {
        searchClientRef.current = initialSearchClient;
      } else {
        searchClientRef.current = algoliasearch(
          state.context.appID,
          state.context.apiKey
        );
      }
    }
  },
  getSources({ query, state, setContext, setIsOpen, refresh, setQuery }) {
    // !state.context.index && !state.context.icon
    // state.context.icon === "fa" || "mdi"
    // state.context.index === "algolia-docs" // activeFlow ?

    // const flows = [
    //   {
    //     id: "searchicon",
    //     conditions: { query: "icon" },
    //     sources: ["fa", "mdi", "algoliaIcons"],
    //     collection: collection.group("topics").balance("50"),
    //     layout: smartLayout(this.collection, {
    //       cols: 2,
    //       slot1: ["sourceType:icon"],
    //       slot2: ["mdi"]
    //     })
    //     //update: {hitsPerPage:40}
    //   }
    // ];

    if (!state.context.index && !state.context.icon) {
      return [
        {
          // ----------------
          // Keyword Actions: CSS Customization + Social
          // ----------------
          slugName: "actionKeywords",
          sourceType: "keyword",
          onSelect: ({ item }) => {
            switch (item.action) {
              case "showHelp":
                break;
              case "applyDocsearch":
                break;
              case "searchAlgoliaCode":
                setContext({ index: "github-code" });
                setTag("Code");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchGithub":
                setContext({ index: "docsearch-github" });
                setTag("GitHub");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchAlgoliaDocs":
                setContext({ index: "algolia-docs" });
                setTag("Algolia");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchIconFA":
                setContext({ icon: "fa" });
                setTag("FA");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchIconMDI":
                setContext({ icon: "mdi" });
                setTag("MDI");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "subscribeNewsletter":
                break;
              case "setDebugMode":
                break;
              case "startColorFlow":
                setContext({
                  stepLabel: item.label,
                  stepAction: "selectColor",
                  action: (value) => setCssVar(item.attribute, value)
                });
                setTag(item.label);
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "startSpacingFlow":
                setContext({
                  stepLabel: item.label,
                  stepAction: "selectSpacing",
                  action: (value) => setCssVar(item.attribute, value)
                });
                setTag(item.label);
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "setDarkmode":
                const darkSwitch = document.getElementById("darkSwitch");
                darkSwitch.checked ^= 1;
                const changeEvent = new Event("change");
                darkSwitch.dispatchEvent(changeEvent);
                setQuery("css");
                setIsOpen(true);
                refresh();
                break;
              default:
            }
          },
          getItems({ query }) {
            return [
              // {
              //   label: "Help",
              //   action: "showHelp",
              //   keyword: ["help"],
              //   icon: "fas fa-life-ring"
              // },
              {
                label: "Search Algolia Docs",
                action: "searchAlgoliaDocs",
                keyword: ["al", "docs", "so"],
                icon: "fab fa-algolia"
              },
              {
                label: "Search Algolia's GitHub",
                action: "searchGithub",
                keyword: ["git", "issue", "pr"],
                icon: "fab fa-github"
              },
              {
                label: "Search Algolia Code",
                action: "searchAlgoliaCode",
                keyword: ["code"],
                icon: "fas fa-terminal"
              },
              {
                label: "Search Stack-Overflow",
                action: "searchAlgoliaDocs",
                keyword: ["so"],
                icon: "fab fa-stack-overflow"
              },
              {
                label: "Search Font-Awesome",
                action: "searchIconFA",
                keyword: ["icon", "fa"],
                icon: "fab fa-fort-awesome"
              },
              {
                label: "Search Material Design",
                action: "searchIconMDI",
                keyword: ["icon", "mdi"],
                icon: "mdi mdi-material-design"
              },
              {
                label: "Toggle Darkmode",
                action: "setDarkmode",
                keyword: "css",
                icon: "far fa-moon"
              },
              {
                label: "Set Color Primary",
                action: "startColorFlow",
                attribute: "--primary-color",
                keyword: "css",
                icon: "fas fa-palette"
              },
              {
                label: "Set Color Background",
                action: "startColorFlow",
                attribute: "--background-color",
                keyword: "css",
                icon: "fas fa-palette"
              },
              {
                label: "Set Spacing",
                action: "startSpacingFlow",
                attribute: "--spacing-factor",
                keyword: "css",
                icon: "fas fa-compress"
              },
              {
                label: "Reset CSS",
                action: "resetCss",
                keyword: "reset(soon)",
                icon: "fas fa-undo"
              },
              {
                label: "Set Debug Mode",
                action: "setDebugMode",
                keyword: "debug(soon)",
                icon: "fas fa-bug"
              },
              {
                label: "Apply to DocSearch",
                action: "applyDocsearch",
                keyword: "apply",
                url: "https://docsearch.algolia.com/",
                icon: "fab fa-algolia"
              },
              {
                label: "Subscribe to Newsletter",
                action: "subscribeNewsletter",
                keyword: "news(soon)",
                icon: "far fa-envelope"
              }
            ].filter((item) => {
              return (
                query.includes("/") ||
                (query.length >= 2 &&
                  item.keyword.includes(query.toLowerCase())) ||
                (query.length >= 4 &&
                  item.label
                    .toLowerCase()
                    .includes(query.toLowerCase().replace(item.keyword, "")))
              );
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Shortcuts" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.label,
                extra: item.keyword,
                icon: item.icon
              });
            }
          }
        },
        {
          // ----------------
          // Source: CSS Colors
          // ----------------
          slugName: "cssColors",
          onSelect: ({ item }) => {
            state.context.action(item.hex);
            setContext({ stepLabel: null, stepAction: null });
            setTag(null);
          },
          getItems({ query }) {
            return [...colors]
              .filter((item) => {
                return (
                  state.context.stepAction === "selectColor" &&
                  item.name.toLowerCase().includes(query.toLowerCase())
                );
              })
              .slice(0, 6);
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Colors" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: state.context.stepLabel + " to " + item.name,
                extra: item.hex,
                icon:
                  `<i class="fa fa-tint" style="color:` + item.hex + `;"></i>`
              });
            }
          }
        },
        {
          // ----------------
          // Source: CSS Spacing
          // ----------------
          slugName: "cssSpacing",
          onSelect: ({ item }) => {
            state.context.action(item.value);
            setContext({ stepLabel: null, stepAction: null });
          },
          getItems({ query }) {
            return [...spacing].filter((item) => {
              return (
                state.context.stepAction === "selectSpacing" &&
                item.keyword.toLowerCase().includes(query.toLowerCase())
              );
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Spacing" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: state.context.stepLabel + " to " + item.name,
                extra: item.keyword,
                icon: "fas fa-compress"
              });
            }
          }
        },
        {
          // ----------------
          // Source: DocSearch HUB
          // ----------------
          slugName: "docsearchHub",
          onHighlight({ item }) {
            //const wrapper = document.querySelector("#autocomplete-preview");
            //const iframe = document.createElement("iframe");
            //iframe.setAttribute("src", item.documentation.url);
            //wrapper.appendChild(iframe);

            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              render(<ContentPreview content={item} />, preview);
            }, 200);
          },
          onSelect: ({ item }) => {
            setContext({
              index: item.docsearch.index,
              apiKey: item.docsearch.apiKey,
              docsearchProject: item
            });
            setQuery("");
            setTag(item.docsearch.index);
            setIsOpen(true);
            refresh();
          },
          getItemInputValue: ({ item }) => item.docsearch.index,
          getItems({ query }) {
            function tagFilter() {
              if (state.context.githubTopic) {
                return ` AND github.topics:${state.context.githubTopic}`;
              } else {
                return "";
              }
            }
            return getAlgoliaHits({
              searchClient: searchClientRef.current,
              queries: [
                {
                  indexName: "live-demo",
                  query,
                  params: {
                    hitsPerPage: 10,
                    filters: `status.stage:"Live"` + tagFilter()
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "DocSearch HUB" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name,
                extra: item.docsearch.index,
                icon: item.documentation.favicon || "fas fa-book"
              });
            }
          }
        },
        {
          // ----------------
          // Source: Github Topics
          // ----------------
          slugName: "githubTopics",
          onSelect: ({ item }) => {
            setContext({ githubTopic: item.value });
            setTag(item.value);
            setIsOpen(true);
            refresh();
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return searchClientRef.current
              .initIndex("live-demo")
              .searchForFacetValues("github.topics", query, { maxFacetHits: 5 })
              .then(({ facetHits }) => {
                return facetHits.filter((item) => {
                  return !state.context.githubTopic;
                });
              });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "GitHub Topics" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.value,
                extra: item.count
              });
            }
          }
        }
      ];
    } else if (state.context.icon === "fa") {
      return [
        {
          // ----------------
          // Source: Font-Awesome Icons
          // ----------------
          slugName: "faIcons",
          onSelect: ({ item }) => {
            setContext({ icon: false });
          },
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: fontAwesomeSearchClient,
              queries: [
                {
                  indexName: "fontawesome_com-5.15.1",
                  query,
                  params: {
                    hitsPerPage: 10,
                    filters:
                      "(membership.free:regular OR membership.free:solid OR membership.free:brands)"
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Font Awesome Icons" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name,
                extra: item.membership.free,
                icon: buildIcon_FA(item)
              });
            }
          }
        }
      ];
    } else if (state.context.icon === "mdi") {
      return [
        {
          // ----------------
          // Source: Material design Icons
          // ----------------
          slugName: "mdiIcons",
          onSelect: ({ item }) => {
            setContext({ icon: false });
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: mdiSearchClient,
              queries: [
                {
                  indexName: "MDI",
                  query,
                  params: {
                    hitsPerPage: 10
                  }
                }
              ]
            });
          },
          templates: {
            header() {
              return `
                <span>Material Design Icons</span>
                <div class="aa-SourceHeaderLine"></div>
              `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name,
                icon: buildIcon_MDI(item)
              });
            }
          }
        }
      ];
    } else if (state.context.index === "docsearch-github") {
      return [
        {
          // ----------------
          // GitHub Projects
          // ----------------
          onSelect: ({ item }) => {
            setContext({ githubProject: item.value });
            setTag("GitHub:" + item.value);
            setQuery("");
            setIsOpen(true);
            refresh();
          },
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return githubSearchClient
              .initIndex("docsearch-github")
              .searchForFacetValues("repo", query, { maxFacetHits: 6 })
              .then(({ facetHits }) => {
                return facetHits.filter((item) => {
                  return !state.context.githubProject;
                });
              });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "Algolia Projects"
              });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.value,
                icon: "fab fa-algolia"
              });
            }
          }
        },
        {
          // ----------------
          // GitHub Issues and Pull Requests
          // ----------------
          slugName: "githubIssuesPR",
          getItemUrl: ({ item }) =>
            `https://github.com/${item.owner}/${item.repo}/issues/${item.number}`,
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: githubSearchClient,
              queries: [
                {
                  indexName: "docsearch-github",
                  query,
                  params: {
                    hitsPerPage: 15,
                    filters: `repo:${state.context.githubProject} AND NOT user.login:renovate[bot] AND NOT user.login:dependabot[bot]`
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "GitHub Issues and PR"
              });
            },
            item({ item }) {
              return githubLayout(item);
            }
          }
        }
      ];
    } else if (state.context.index === "github-code") {
      return [
        {
          // ----------------
          // GitHub Projects
          // ----------------
          slugName: "githubProjects",
          onSelect: ({ item }) => {
            setContext({ githubProject: item.value });
            setTag(item.value);
            setQuery("");
            setIsOpen(true);
            refresh();
          },
          // getItemUrl: ({ item }) =>
          //   `https://github.com/${item.owner}/${item.repo}/issues/${item.number}`,
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return githubSearchClient
              .initIndex("docsearch-github")
              .searchForFacetValues("repo", query, { maxFacetHits: 10 })
              .then(({ facetHits }) => {
                return facetHits.filter((item) => {
                  return !state.context.githubProject;
                });
              });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "Algolia Projects"
              });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.value,
                icon: "fab fa-algolia"
              });
            }
          }
        },
        {
          // ----------------
          // Source: Github Code Search
          // https://docs.github.com/en/free-pro-team@latest/github/searching-for-information-on-github/searching-code
          // ----------------
          slugName: "githubCodeSearch",
          getItems({ query }) {
            if (!state.context.githubProject) {
              return [];
            }
            return makeRequest(
              "GET",
              `https://api.github.com/search/code?q=${query}+repo:algolia/${state.context.githubProject}`
            )
              .then(function (data) {
                return JSON.parse(data).items;
              })
              .catch(function (err) {
                return [];
              });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Search Github Code" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name,
                extra: item.repository.full_name + " - " + item.path,
                url: item.html_url,
                icon: "fab fa-github"
              });
            }
          }
        }
      ];
    } else if (state.context.index === "algolia-docs") {
      return [
        {
          // ----------------
          // Algolia Docs
          // ----------------
          slugName: "algoliaDocs",
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: algoliaDocsSearchClient,
              queries: [
                {
                  indexName: "documentation_production",
                  query,
                  params: {
                    hitsPerPage: 10
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "Algolia Docs"
              });
            },
            item({ item, root }) {
              return AlgoliaDocsHitTemplate(item, root);
            }
          }
        },
        {
          // ----------------
          // Algolia Website
          // ----------------
          slugName: "algoliaWebsite",
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: algoliaWebsiteSearchClient,
              queries: [
                {
                  indexName: "PROD_algolia_com_site",
                  query,
                  params: {
                    hitsPerPage: 5
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "Algolia Website"
              });
            },
            item({ item, root }) {
              return hitLayoutSmart(item, {
                main: item.title.en,
                extra: item.path,
                description: item.metaDescription
              });
            }
          }
        },
        {
          // ----------------
          // Stackoverflow #Algolia
          // ----------------
          slugName: "stackoverflowAlgolia",
          getItemUrl: ({ item }) =>
            `https://github.com/${item.owner}/${item.repo}/issues/${item.number}`,
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: stackoverflowAlgoliaSearchClient,
              queries: [
                {
                  indexName: "instantsearch-so-algolia",
                  query,
                  params: {
                    hitsPerPage: 5
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: "StackOverflow"
              });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.title,
                extra: item.tags,
                icon: "fab fa-stack-overflow text-yellow-500"
              });
            }
          }
        }
      ];
    } else {
      return [
        {
          // ----------------
          // DocSearch Actions
          // ----------------
          slugName: "docsearchActions",
          onHighlight({ item }) {
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              switch (item.action) {
                case "previewGithub":
                  render(
                    <ContentPreviewGithub
                      content={state.context.docsearchProject}
                    />,
                    preview
                  );
                  break;
                case "previewDocsearch":
                  render(
                    <ContentPreviewDocsearch
                      content={state.context.docsearchProject}
                    />,
                    preview
                  );
                  break;
                default:
              }
            }, 150);
          },
          onSelect: ({ item }) => {
            switch (item.action) {
              // todo
              default:
            }
          },
          getItems({ query }) {
            return [
              {
                label: "DocSearch info",
                icon: "fab fa-algolia",
                action: "previewDocsearch"
              },
              {
                label: "GitHub info",
                icon: "fab fa-github",
                action: "previewGithub"
              }
              // {
              //   label: "Twitter info",
              //   icon: "fab fa-twitter",
              //   action: "previewTwitter"
              // },
              // {
              //   label: "StackOverflow info",
              //   icon: "fab fa-stack-overflow",
              //   action: "previewStackoverflow"
              // },
              // { label: "Send Feedback", icon: "far fa-comment", action: "" }
            ].filter((item) => {
              return query.length === 0;
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "HUB Infos" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.label,
                icon: item.icon
              });
            }
          }
        },
        {
          // ----------------
          // DocSearch Customer Index
          // ----------------
          slugName: "docsearchCustomer",
          getItemInputValue: ({ state }) => state.query,
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: searchClientRef.current,
              queries: [
                {
                  indexName: state.context.index,
                  query,
                  params: {
                    hitsPerPage: 12,
                    attributesToRetrieve: [
                      "type",
                      "hierarchy",
                      "content",
                      "language",
                      "version"
                    ]
                    //filters: `language:"en"`
                  }
                }
              ]
            });
          },
          templates: {
            header({ items }) {
              return headerLayout({
                items,
                sourceTitle: `${state.context.docsearchProject.name} Docs <i class="ml-1 text-indigo-600 fab fa-algolia"></i>`
              });
            },
            item({ item, root }) {
              return DocsearchHitTemplate(item, root);
            }
          }
        }
      ];
    }
  },
  render({ root, sections, state }) {
    // todo plug layout here
    const leftColumn = document.createElement("div");
    const rightColumn = document.createElement("aside");

    rightColumn.setAttribute("id", "autocomplete-preview");
    rightColumn.setAttribute("class", "col-preview");
    leftColumn.setAttribute("class", "col-results");

    for (const section of sections) {
      leftColumn.appendChild(section);
    }
    root.appendChild(leftColumn);
    root.appendChild(rightColumn);
  }
});

// function updateStateConsole(state) {
//   render(<StateConsole state={state} />, document.body);
// }
