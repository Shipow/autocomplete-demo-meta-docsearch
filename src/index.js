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
  GamesContentPreview,
  ContentPreviewGithub,
  ContentPreviewDocsearch,
  MDNContentPreview,
  NPMContentPreview,
  HNContentPreview,
  DocsearchRecordContentPreview
} from "./components/contentPreviewDocsearch";

//debug console
// import { StateConsole } from "./components/stateConsole.jsx";

// static sources
import colors from "./data/colors.json";
import spacing from "./data/spacing.json";

// todo: recent searches
/* import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: "navbar"
}); */

//
function createRef(initialValue) {
  return {
    current: initialValue
  };
}

// hn
const hnSearchClient = algoliasearch(
  "UJ5WYC0L7X",
  "8ece23f8eb07cd25d40262a1764599b1"
);

// npm
const npmSearchClient = algoliasearch(
  "OFCNCOG2CU",
  "f54e21fa3a2a0160595bb058179bfb1e"
);

// mdn
const mdnSearchClient = algoliasearch(
  "BU16S1B9J9",
  "01cdd67acae098cf2fc908685b6aa9bc"
);

// discourse
const algoliaDiscourseSearchClient = algoliasearch(
  "G25OKIW19Q",
  "33bcdc2abeb087998c63e65c41c17543"
);

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

// answers algolia docs
const acctDetails = {
  appId: "B1G2GM9NG0",
  apiKey: "56184c0a739f3a6c6a00b6d8473c3a8f",
  indexName: "documentation_production"
};

function callNluEngine(query, callback) {
  const data = qaParams(query);
  const URL = `https://${acctDetails.appId}-2.algolia.net/1/answers/${acctDetails.indexName}/prediction`;

  fetch(URL, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": acctDetails.appId,
      "X-Algolia-API-Key": acctDetails.apiKey
    },
    body: JSON.stringify(data)
  })
    .then((response) => response.json())
    .then((res) => callback(res.hits))
    .catch(console.error);
}

function qaParams(query) {
  return {
    query: query,
    attributesForPrediction: ["page_title", "title", "description"],
    queryLanguages: ["en"],
    threshold: 0,
    nbHits: 1,
    params: {
      typoTolerance: "min",
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>"
    }
  };
}

function debounce(fn, time) {
  var timerId = undefined;
  return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(function () {
      return fn.apply(void 0, args);
    }, time);
  };
}

const debounceGetAnswers = debounce(callNluEngine, 400);

const answersRef = {
  current: []
};

// todo: move to fetch
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

function hitLayoutSmart(item, { main, extra, icon, url, description, wrap }) {
  // todo: add highlighting with better utils
  // todo: reverse with flex direction + css var?
  // todo: inline + dual compo?
  const imageExt = /\.svg|\.ico|\.png|\.jpg|\.jpeg|data:image/g;
  // support material design and font awesome icons
  const iconSet = /^fa|mdi/g;

  if (icon && icon.match(imageExt)) {
    icon = `<img src="${icon}"/>`;
  } else if (icon && icon.match(iconSet)) {
    icon = `<i class="${icon}"></i>`;
  }

  return `${!!url ? '<a class="aa-ItemLink" href="{url}">' : ""}
      ${icon ? '<div class="aa-ItemSourceIcon">' + icon + "</div>" : ""}
      <div class="aa-ItemContent ${!!wrap ? "aa-ItemContent--dual" : ""}">
        <span class="aa-ItemContentTitle">${main}</span>
        ${
          typeof extra === "string"
            ? `<span class="aa-ItemContentSubtitle">${extra}</span>`
            : ""
        }
        ${
          typeof extra === "number"
            ? `<span class="aa-ItemContentSubtitle"><span class="aa-ItemContentTag">${extra}</span></span>`
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
    x.setAttribute("class", "inputTagRemoveIcon fas fa-backspace align-middle");
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
      return `far fa-${item.name}`;
    case "solid":
      return `fas fa-${item.name}`;
    case "brands":
      return `fab fa-${item.name}`;
    default:
  }
}
// Icon for mdi
function buildIcon_MDI(item) {
  return `mdi mdi-${item.name}`;
}

// escape html for HTML docs
function escapeHtml(html) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const activeItemRef = createRef(null);
const lastStateRef = createRef({});

const aaDemo = autocomplete({
  panelContainer: ".aa-Panel",
  placeholder: "Search OSS or type / to display shortcuts",
  debug: true,
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
    if (
      state.context.index === "algoliaAnswers" &&
      prevState.query !== state.query
    ) {
      debounceGetAnswers(state.query, (answers) => {
        answersRef.current = answers;
        aaDemo.refresh();
        aaDemo.setIsOpen(true);
      });
    }
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
              case "searchGames":
                setContext({ index: "Games" });
                setTag("Games");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchAlgoliaAnswersDocs":
                setContext({ index: "algoliaAnswers" });
                setTag("Ask");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchYahooFinance":
                setContext({ index: "Stonks" });
                setTag("Stonks");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchHackerNews":
                setContext({ index: "HN" });
                setTag("HN");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchNPM":
                setContext({ index: "npm-search" });
                setTag("NPM");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchAlgoliaDiscourse":
                setContext({ index: "algolia-discourse" });
                setTag("Discourse");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchMDN":
                setContext({ index: "mdn" });
                setTag("MDN");
                setQuery("");
                setIsOpen(true);
                refresh();
                break;
              case "searchAlgoliaStackoverflow":
                setContext({ index: "algolia-stackoverflow" });
                setTag("Stack-Overflow");
                setQuery("");
                setIsOpen(true);
                refresh();
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
              {
                label: "Search Games",
                action: "searchGames",
                keyword: ["games"],
                icon: "fas fa-gamepad"
              },
              {
                label: "Algolia Answers",
                action: "searchAlgoliaAnswersDocs",
                keyword: ["ask", "anwsers"],
                icon: "fas fa-question"
              },
              {
                label: "Yahoo Finance",
                action: "searchYahooFinance",
                keyword: ["stonks", "$$$"],
                icon: "fas fa-chart-line"
              },
              {
                label: "Search Algolia Docs",
                action: "searchAlgoliaDocs",
                keyword: ["al", "docs"],
                icon: "fab fa-algolia"
              },
              {
                label: "Search Algolia's GitHub",
                action: "searchGithub",
                keyword: ["git"],
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
                action: "searchAlgoliaStackoverflow",
                keyword: ["so"],
                icon: "fab fa-stack-overflow"
              },
              {
                label: "Search Algolia Discourse",
                action: "searchAlgoliaDiscourse",
                keyword: ["forum"],
                icon: "fab fa-discourse"
              },
              {
                label: "Search MDN",
                action: "searchMDN",
                keyword: ["mdn"],
                icon: "fab fa-firefox"
              },
              {
                label: "Search NPM",
                action: "searchNPM",
                keyword: ["npm"],
                icon: "fab fa-npm"
              },
              {
                label: "Search Hacker News",
                action: "searchHackerNews",
                keyword: ["hn", "news"],
                icon: "fab fa-hacker-news"
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
                keyword: ["css"],
                icon: "far fa-moon"
              },
              {
                label: "Set Primary Color",
                action: "startColorFlow",
                attribute: "--primary-color",
                keyword: ["css"],
                icon: "fas fa-palette"
              },
              {
                label: "Set Icon Color",
                action: "startColorFlow",
                attribute: "--icon-color",
                keyword: ["css"],
                icon: "fas fa-palette"
              },
              {
                label: "Set Spacing",
                action: "startSpacingFlow",
                attribute: "--spacing-factor",
                keyword: ["css"],
                icon: "fas fa-compress"
              },
              {
                label: "Reset CSS",
                action: "resetCss",
                keyword: ["soon"],
                icon: "fas fa-undo"
              },
              {
                label: "Set Debug Mode",
                action: "setDebugMode",
                keyword: ["soon"],
                icon: "fas fa-bug"
              },
              {
                label: "Apply to DocSearch",
                action: "applyDocsearch",
                keyword: ["apply"],
                url: "https://docsearch.algolia.com/",
                icon: "fab fa-algolia"
              },
              {
                label: "Subscribe to Newsletter",
                action: "subscribeNewsletter",
                keyword: ["soon"],
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
            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(<ContentPreview content={item} />, preview, section);
            }, 100);
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
    } else if (state.context.index === "algoliaAnswers") {
      return [
        {
          // ----------------
          // Source: Algolia Answers
          // ----------------
          slugName: "Answers",
          onSelect: ({ item }) => {
            setContext({ icon: false });
          },
          getItems() {
            return answersRef.current;
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "Algolia Answers" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.title
              });
            }
          }
        }
      ];
    } else if (state.context.index === "mdn") {
      return [
        {
          // ----------------
          // Filters: Mdn tags
          // ----------------
          slugName: "mdnTags",
          onSelect: ({ item }) => {
            setContext({ mdnTag: item.value });
            setTag(item.value);
            setIsOpen(true);
            refresh();
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return mdnSearchClient
              .initIndex("MDN")
              .searchForFacetValues("tags", query, { maxFacetHits: 5 })
              .then(({ facetHits }) => {
                return facetHits.filter((item) => {
                  return !state.context.mdnTag;
                });
              });
          },
          templates: {
            header({ items }) {
              return headerLayout({ items, sourceTitle: "MDN Tags" });
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.value,
                extra: item.count
              });
            }
          }
        },
        {
          // ----------------
          // Source: Mozilla Developer Network
          // ----------------
          slugName: "MDN",
          onHighlight({ item }) {
            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(<MDNContentPreview content={item} />, preview, section);
            }, 100);
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: mdnSearchClient,
              queries: [
                {
                  indexName: "MDN",
                  query,
                  params: {
                    hitsPerPage: 12
                  }
                }
              ]
            });
          },
          templates: {
            header() {
              return `
              <span>Mozilla Developer Network</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: escapeHtml(item.name),
                extra: item.categories.lvl1 || item.categories.lvl0
              });
            }
          }
        }
      ];
    } else if (state.context.index === "npm-search") {
      return [
        {
          // ----------------
          // Source: NPM
          // ----------------
          slugName: "NPM",
          onHighlight({ item }) {
            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(<NPMContentPreview content={item} />, preview, section);
            }, 100);
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: npmSearchClient,
              queries: [
                {
                  indexName: "npm-search",
                  query,
                  params: {
                    hitsPerPage: 12
                  }
                }
              ]
            });
          },
          templates: {
            header() {
              return `
              <span>NPM</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name
              });
            }
          }
        }
      ];
    } else if (state.context.index === "HN") {
      return [
        {
          // ----------------
          // Source: Hacker News
          // ----------------
          slugName: "HackerNews",
          onHighlight({ item }) {
            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(<HNContentPreview content={item} />, preview, section);
            }, 100);
          },
          getItemInputValue: () => "",
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: hnSearchClient,
              queries: [
                {
                  indexName: "Item_production_ordered",
                  query,
                  params: {
                    hitsPerPage: 12
                  }
                }
              ]
            });
          },
          templates: {
            header() {
              return `
              <span>Hacker News</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.title
              });
            }
          }
        }
      ];
    } else if (state.context.index === "Stonks") {
      return [
        {
          // ----------------
          // Source: Yahoo Finance
          // ----------------
          slugName: "YahooFinance",
          getItemInputValue: () => "",
          getItems({ query }) {
            return fetch(
              `https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete?q=${
                query || "tesl"
              }&region=US`,
              {
                method: "GET",
                headers: {
                  "x-rapidapi-key":
                    "4cff447292msh8a5dcb18c862932p119b1ejsnd262e0bfcb4c",
                  "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com"
                }
              }
            )
              .then((response) => {
                return response.json();
              })
              .then((data) => {
                return data.quotes;
              })

              .catch((err) => {
                console.error(err);
              });
          },
          templates: {
            header() {
              return `
              <span>Yahoo Finance</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.shortname,
                extra: item.symbol
              });
            }
          }
        }
      ];
    } else if (state.context.index === "Games") {
      return [
        {
          // ----------------
          // Source: Games (IGDB proxy)
          // ----------------
          slugName: "Games",
          getItemInputValue: () => "",
          onHighlight({ item }) {
            activeItemRef.current = item;
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(<GamesContentPreview content={item} />, preview, section);
            }, 100);
          },
          getItems({ query }) {
            return fetch(
              `https://aa-red.herokuapp.com/games?query=${query || ""}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json"
                }
              }
            )
              .then((response) => {
                return response.json();
              })
              .then((data) => {
                return data;
              })

              .catch((err) => {
                console.error(err);
              });
          },
          templates: {
            header() {
              return `
              <span>Video Games</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.name,
                icon: (item.cover && item.cover.url) || "fas fa-desktop",
                extra: item.genres && item.genres[0].name,
                wrap: true
              });
            }
          }
        }
      ];
    } else if (state.context.index === "algolia-discourse") {
      return [
        {
          // ----------------
          // Source: Algolia Discourse
          // ----------------
          slugName: "algolia-discourse",
          getItemInputValue: () => "",
          getItems({ query }) {
            return getAlgoliaHits({
              searchClient: algoliaDiscourseSearchClient,
              queries: [
                {
                  indexName: "discourse-posts",
                  query,
                  params: {
                    hitsPerPage: 12
                  }
                }
              ]
            });
          },
          templates: {
            header() {
              return `
              <span>Algolia Discourse Forum</span>
              <div class="aa-SourceHeaderLine"></div>
            `;
            },
            item({ item }) {
              return hitLayoutSmart(item, {
                main: item.topic.title,
                extra: item.topic.tags,
                description: item.content
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
        }
      ];
    } else if (state.context.index === "algolia-stackoverflow") {
      return [
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

              const section = document.querySelector(
                "#autocomplete-preview > section"
              );

              switch (item.action) {
                case "previewGithub":
                  render(
                    <ContentPreviewGithub
                      content={state.context.docsearchProject}
                    />,
                    preview,
                    section
                  );
                  break;
                case "previewDocsearch":
                  render(
                    <ContentPreviewDocsearch
                      content={state.context.docsearchProject}
                    />,
                    preview,
                    section
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
          onHighlight({ item }) {
            setTimeout(() => {
              const preview = document.querySelector("#autocomplete-preview");
              const section = document.querySelector(
                "#autocomplete-preview > section"
              );
              render(
                <DocsearchRecordContentPreview content={item} />,
                preview,
                section
              );
            }, 100);
          },
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
                      "version",
                      "url"
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
