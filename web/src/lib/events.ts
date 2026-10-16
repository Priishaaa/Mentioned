/** Ask the question accordion to open a question and scroll to it. */
export const OPEN_QUESTION = "mentioned:open-question";

export function openQuestion(id: number) {
  window.dispatchEvent(new CustomEvent<number>(OPEN_QUESTION, { detail: id }));
}
