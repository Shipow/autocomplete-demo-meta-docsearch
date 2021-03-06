import { h, Fragment } from "preact";
import { Bar, Line } from "preact-chartjs-2";
//import Markdown from "preact-markdown";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  elements: {
    line: {
      backgroundColor: "#e7eaff",
      borderColor: "#cfd4ff",
      borderWidth: 1
    },
    point: {
      radius: 0
    }
  },
  tooltips: {
    enabled: false
  },

  scales: {
    yAxes: [
      {
        display: true,
        ticks: {
          autoSkipPadding: 25,
          min: 0
          // max: 1500
        }
      }
    ],
    xAxes: [
      {
        type: "time",
        display: true,
        time: {
          unit: "year"
        }
      }
    ]
  }
};

const options2 = {
  responsive: false,
  legend: {
    display: false
  },
  tooltips: {
    enabled: false
  },
  scales: {
    yAxes: [
      {
        display: false
      }
    ],
    xAxes: [
      {
        display: false
      }
    ]
  }

  // maintainAspectRatio: true,
};

export function ContentPreview({ content }) {
  return (
    <section class="">
      <div className="m-3 shadow rounded overflow-hidden">
        <img
          className="bg-white"
          src={content.documentation.thumbnail}
          alt=""
        />
        <div className="p-3 border-t border-gray-200">
          {
            <div className="">
              <span className="text-xl mr-2">{content.name}</span>
              <span className="text-sm text-gray-500">
                by {content.github.organization}
              </span>
            </div>
          }
          <a
            className="mb-4 text-xs text-indigo-500 no-wrap"
            href={content.documentation.url}
          >
            <img
              className="inline-block align-middle mr-1"
              src={content.documentation.favicon}
              width="16"
              alt=""
            />
            {content.documentation.url}
          </a>
          <p className="my-2 text-xs text-gray-500">
            {content.documentation.description}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ContentPreviewDocsearch({ content }) {
  const chartData = content.docsearch.usageSearchOperations.dates;
  const data = [];
  const labels = [];
  for (const i in chartData) {
    data.push(chartData[i].v);
    labels.push(chartData[i].t);
  }
  const preparedData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: "#5368ff",
        borderWidth: 0,
        barThickness: 4
      }
    ]
  };
  return (
    <section className="">
      <div className="rounded shadow p-3 m-3 text-sm">
        <div className="text-xs text-gray-500">
          <span class="text-lg text-gray-800">
            {content.docsearch.analyticsUsersCount.period30days.count}
          </span>{" "}
          Users on 30 days
        </div>
        <Bar data={preparedData} options={options2} height="50" />
      </div>
      <div className="rounded shadow p-3 m-3 text-sm">
        <div>
          <span class="text-right mr-2 text-gray-500">
            <i className="fas fa-database mr-1"></i>
          </span>
          <a
            target="_blank"
            rel="noreferrer"
            href={
              "https://github.com/algolia/docsearch-configs/blob/master/configs/" +
              content.docsearch.index +
              ".json"
            }
          >
            {content.docsearch.index}
          </a>
          <span className="text-xs text-gray-500">
            {" — "}
            {content.docsearch.usageRecords.max} records
          </span>
        </div>

        <div class="mt-2 flex">
          <span class="text-right mr-2 text-gray-500">
            <i className="fas fa-key mr-1"></i>
          </span>
          <pre class="bg-gray-100 border border-gray-200 text-gray-700 px-1 rounded overflow-ellipsis overflow-hidden w-100">
            {content.docsearch.apiKey}
          </pre>
        </div>
      </div>

      <div className="m-3 text-gray-500 rounded shadow text-xs w-100">
        {content.docsearch.configCommitsList.slice(0, 1).map((commit) => {
          return (
            <div className="p-2 border-b border-gray-200">
              <div className=" text-sm pb-1 text-gray-800">
                <i className="fas fa-code-branch mr-2"></i>
                {commit.message}
              </div>
              <img
                src={commit.author.avatarUrl}
                width="14"
                class="align-middle rounded-full mr-1 border border-gray-300"
                alt=""
              />
              {commit.author.name}
              {" — "}
              {new Date(commit.committedDate).toLocaleDateString("en-US")}
            </div>
          );
        })}
        <div className="px-2 py-1 border-b border-gray-200 bg-gray-100">
          [...] {content.docsearch.configCommitsList.length} commits
        </div>
        {content.docsearch.configCommitsList.slice(-1).map((commit) => {
          return (
            <div className="p-2">
              <div className="pb-1 text-gray-800 text-sm">
                <i className="fas fa-code-branch mr-2"></i>
                {commit.message}
              </div>
              <img
                src={commit.author.avatarUrl}
                width="14"
                class="align-middle rounded-full mr-1 border border-gray-300"
                alt=""
              />
              {commit.author.name}
              {" — "}
              {new Date(commit.committedDate).toLocaleDateString("en-US")}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ContentPreviewGithub({ content }) {
  const chartData = content.github.starHistory;
  const data = [];
  const labels = [];
  for (const i in chartData) {
    data.push(chartData[i].starNum);
    labels.push(chartData[i].date);
  }
  const preparedData = {
    labels,
    datasets: [
      {
        data
      }
    ]
  };
  return (
    <section>
      <div className="rounded shadow p-3 m-3">
        <div className="flex items-center mb-2">
          <img
            className="rounded mr-2"
            src={content.github.avatar}
            width="24"
            alt=""
          />
          <div className="text-md">
            <span className="text-gray-500 mr-2">
              {content.github.organization} /
            </span>
            <a
              className="font-semibold"
              target="_blank"
              rel="noreferrer"
              href={content.github.url}
            >
              {content.github.mainRepo}
            </a>
          </div>
        </div>

        <div className="mb-1">
          {content.github.topics.map((topic) => {
            return (
              <div className="inline-block py-1 px-2 rounded-full bg-indigo-50 mb-1 mr-1 text-xs text-indigo-500 whitespace-pre-wrap">
                {topic}
              </div>
            );
          })}
        </div>

        <p className="mb-2 text-xs text-gray-500">
          {content.github.description}
        </p>

        <div className="mb-2">
          <div className="inline-block border-gray-200 rounded mr-4 text-sm text-gray-700">
            <i className="fas fa-circle text-sm text-gray-300 mr-1"></i>
            {content.github.language}
          </div>
          <div className="inline-block border-gray-200 rounded mr-4 text-sm text-gray-700">
            <i className="fas fa-balance-scale text-sm text-gray-500 mr-1"></i>
            {content.github.license}
          </div>
          <div className="inline-block border-gray-200 rounded text-sm text-gray-700">
            <i className="far fa-calendar text-sm text-gray-500 mr-1"></i>
            {new Date(content.github.createdAt).getFullYear()}
          </div>
        </div>

        <div className="text-sm">
          <div className="inline-block py-1 px-2 border border-gray-200 rounded mr-1">
            <i className="far fa-star text-gray-500 mr-1"></i>
            {content.github.stars}
          </div>
          <div className="inline-block py-1 px-2 border border-gray-200 rounded mr-1">
            <i className="fas fa-code-branch text-gray-500 mr-1"></i>
            {content.github.forks}
          </div>
          <div className="inline-block py-1 px-2 border border-gray-200 rounded">
            <i className="fas fa-exclamation-circle text-gray-500 mr-1"></i>
            {content.github.openIssues}
          </div>
        </div>
      </div>
      <div className="rounded shadow p-3 m-3">
        <div className="mb-4">Stars History</div>
        <Line data={preparedData} options={options} />
      </div>
    </section>
  );
}

export function YahooFinanceContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <pre class="text-xs">{JSON.stringify(content, null, 2)}</pre>
    </section>
  );
}

export function DocsearchRecordContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <pre class="text-xs">{JSON.stringify(content, null, 2)}</pre>
    </section>
  );
}

export function MDNContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <div className="m-3 p-3 shadow rounded overflow-hidden">
        <div class="text-center text-lg">{content.name}</div>
        <div class="text-center text-xs text-gray-400">
          {content.categories.lvl1 || content.categories.lvl0}
        </div>
        <div class="mt-2 text-gray-600 text-sm">
          {content.short_description}
        </div>
        <div class="mt-2">
          {content.tags.slice(0, 4).map((tag) => {
            return (
              <div className="inline-block py-1 px-2 rounded-full bg-indigo-50 mb-1 mr-1 text-xs text-indigo-500 whitespace-pre-wrap">
                {tag}
              </div>
            );
          })}
        </div>
      </div>
      <div className="m-3 p-2 bg-indigo-100 rounded overflow-hidden text-xs">
        <pre class="">{content.syntax}</pre>
        {/* <pre class="">{content.Methods}</pre>
        <pre class="">{content.Properties}</pre> */}
      </div>
      {/* <div class="">
        {content.child_type} of {content.parent}
      </div>
      <div class="">{content.flags}</div> */}
    </section>
  );
}

export function NPMContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <div className="m-3 p-3 shadow rounded overflow-hidden">
        <div class="text-center text-lg">{content.name}</div>
        <div class="mt-2 text-gray-600 text-sm">{content.description}</div>
        <div>DL: {content.downloadsLast30Days}</div>
        <div>Version: {content.version}</div>
        <div>
          <a href={content.repository.url}>
            {content.repository.user}/{content.repository.project}
          </a>
        </div>
        <div class="mt-2">
          {content.keywords.slice(0, 4).map((keyword) => {
            return (
              <div className="inline-block py-1 px-2 rounded-full bg-indigo-50 mb-1 mr-1 text-xs text-indigo-500 whitespace-pre-wrap">
                {keyword}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HNContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <div className="m-3 p-3 shadow rounded overflow-hidden">
        <div class="text-center text-lg">{content.title}</div>
        <div class="mt-2 text-gray-600 text-sm">{content.author}</div>
      </div>
    </section>
  );
}

export function GamesContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <div className="m-3 shadow rounded relative">
        <div className="h-36 bg-gray-200 w-100 overflow-hidden">
          <img
            src={
              content.screenshots &&
              content.screenshots[0] &&
              content.screenshots[0].url &&
              content.screenshots[0].url.replace(
                "/t_thumb",
                "/t_thumb_widescreen_large"
              )
            }
            alt=""
          />
        </div>
        <img
          className="absolute left-3 rounded shadow"
          style={{ bottom: "-30px" }}
          width={110}
          src={
            content.cover &&
            content.cover.url &&
            content.cover.url.replace("/t_thumb", "/t_cover_big")
          }
          alt=""
        />
      </div>
      <div className="mt-4 p-6">
        <a className="text-gray-600 text-sm" href={content.url}>
          <div className="text-lg">
            {content.name} -{" "}
            {new Date(content.first_release_date).getFullYear()}
          </div>
          <div className="mt-2 text-gray-600 text-sm">{content.summary}</div>
        </a>
      </div>
    </section>
  );
}

export function MoviesContentPreview({ content }) {
  return (
    <section class="animate__animated animate__fadeIn animate__faster">
      <div className="m-3 shadow rounded relative">
        <div className="h-36 bg-gray-200 w-100 overflow-hidden"></div>
        <img
          className="absolute left-3 rounded shadow"
          style={{ bottom: "-30px" }}
          width={110}
          src={content.image}
          alt=""
        />
      </div>
      <div className="mt-4 p-6">
        <a className="text-gray-600 text-sm" href="#">
          <div className="text-lg">{content.title}</div>
          <div className="mt-2 text-gray-600 text-sm">
            {content.description}
          </div>
        </a>
      </div>
    </section>
  );
}

//   "created_at": "2021-01-26T23:53:45.000Z",
//   "title": "Agent fired from literary agency for using Parler and Gab",
//   "url": "https://www.newsweek.com/agent-fired-literary-agency-using-parler-gab-1564687",
//   "author": "DeusExMachina",
//   "points": 230,
//   "story_text": null,
//   "comment_text": null,
//   "num_comments": 254,
//   "story_id": null,
//   "story_title": null,
//   "story_url": null,
//   "parent_id": null,
//   "created_at_i": 1611705225,
//   "_tags": [
//     "story",
//     "author_DeusExMachina",
//     "story_25922486",
//     "front_page"
//   ],
//   "objectID": "25922486",

//   "name": "po",
//   "downloadsLast30Days": 51,
//   "humanDownloadsLast30Days": "51",
//   "version": "4.5.2",
//   "description": "po = promiseify + co",
//   "repository": {
//     "url": "https://github.com/cloudcome/nodejs-po",
//     "project": "nodejs-po",
//     "user": "cloudcome",
//     "host": "github.com",
//     "path": "",
//     "head": "aa51ab286ed85e37f039cf43197243d1f4c75565",
//     "branch": "aa51ab286ed85e37f039cf43197243d1f4c75565"
//   },
//   "owner": {
//     "name": "cloudcome",
//     "avatar": "https://github.com/cloudcome.png",
//     "link": "https://github.com/cloudcome"
//   },
//   "deprecated": false,
//   "homepage": null,
//   "license": null,
//   "keywords": [
//     "po",
//     "co",
//     "coify",
//     "promise",
//     "promiseify",
//     "es6",
//     "generator",
//     "koa",
//     "koajs",
//     "cloudcome",
//     "ydr.me"
//   ],
//   "modified": 1554660858251,
//   "types": {
//     "ts": false
//   },
//   "objectID": "po",
