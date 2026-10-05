const parentWindow = window.opener as Window | null;
const isChildWindow = !!parentWindow;
const childID: string | undefined = isChildWindow ? window.name : undefined;
export { parentWindow, isChildWindow, childID };
