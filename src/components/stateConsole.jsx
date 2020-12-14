import { h, Fragment } from "preact";

export function StateConsole(update) {
  return (
    <Fragment>
      <div class="p-2 text-green-600" id="user-flow">
        <div class="text-green-500 text-xl pb-4">Event Logs</div>
        <ul class="user-activity float-left w-3/6"></ul>

        <div class="state float-right w-3/6">
          <ul>
            <li>Current Query: {update.state.query}</li>
            <li>Previous Query:</li>
            <li>Hit Selected: {update.state.selectedItemId}</li>
            <li>Hit Highlighted:</li>
            <li>Nb Sources: {update.state.collections.length}</li>
            <li>Step Label: {update.state.context.stepLabel}</li>
            <li>Step Action: {update.state.context.stepAction}</li>
            <li>Current Flow: </li>
            <li>User Context:</li>
          </ul>
        </div>
      </div>
    </Fragment>
  );
}
