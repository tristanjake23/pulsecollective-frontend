import { useWorkspace } from "../state/WorkspaceContext.jsx";
import Modal from "./Modal.jsx";
export default function LogoutDialog() {
  const { modal, setModal, onLogout } = useWorkspace();
  return (
    modal === "logout" && (
      <Modal title="Log out of your workspace?" onClose={() => setModal("")}>
        <div className="space-y-5 p-6 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_input:not([type=checkbox])]:mt-2 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-xl [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-slate-300 [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-4 [&_input:not([type=checkbox])]:py-3 [&_input]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-brand-100 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 [&_textarea]:min-h-28 [&_textarea]:outline-none [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-brand-100">
          <p>
            Your clinic records are saved on the server. You will return to the
            public home page.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
              onClick={() => setModal("")}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </Modal>
    )
  );
}
