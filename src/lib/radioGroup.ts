/*
  Keyboard behaviour for the calculators' segmented controls (W842), following the WAI-ARIA
  Authoring Practices radio group pattern. Behaviour only: the markup, copy and styling stay with
  each component, and the calculation never lives here.

  The markup already carries role="radiogroup" (with an accessible name) on the group and
  role="radio" plus aria-checked on each option. This adds what that markup promises:

  - One Tab stop per group (roving tabindex). The checked option has tabindex="0" and the others
    "-1". If none is checked, the first option has tabindex="0".
  - Right Arrow and Down Arrow move to the next option and select it. Left Arrow and Up Arrow move
    to the previous one and select it. Both wrap at the ends.
  - Space selects the focused option. A <button> already does this natively, so no code is needed.

  Selecting by keyboard calls click() on the option, so it runs the same handler as a mouse click
  and has exactly the same effect on the calculation.

  Tabindex follows aria-checked wherever that changes, including from code that is not a click:
  changing the unit on the plate calculator resets the bar choice in the other group.
*/

const RADIO = '[role="radio"]';

// The options that can currently be reached: not disabled and not hidden.
const options = (group: HTMLElement) =>
  Array.from(group.querySelectorAll<HTMLElement>(RADIO)).filter((r) => !r.hasAttribute('disabled') && !r.hidden);

// Roving tabindex: the checked option is the one Tab stop, or the first option if none is checked.
const syncTabStop = (group: HTMLElement) => {
  const all = options(group);
  const stop = all.find((r) => r.getAttribute('aria-checked') === 'true') ?? all[0];
  all.forEach((r) => {
    r.tabIndex = r === stop ? 0 : -1;
  });
};

export function initRadioGroup(group: HTMLElement): void {
  syncTabStop(group);
  new MutationObserver(() => syncTabStop(group)).observe(group, {
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-checked', 'disabled', 'hidden'],
  });

  group.addEventListener('keydown', (e) => {
    // Leave browser and system shortcuts alone (for example Alt+Left for back).
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    const all = options(group);
    const from = all.indexOf((e.target as Element).closest<HTMLElement>(RADIO) as HTMLElement);
    if (from < 0) return;
    // Arrow keys would otherwise scroll the page.
    e.preventDefault();
    const to = all[(from + step + all.length) % all.length];
    to.focus();
    to.click();
    syncTabStop(group);
  });
}

export function initRadioGroups(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('[role="radiogroup"]').forEach(initRadioGroup);
}
