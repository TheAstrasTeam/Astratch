/**
 * @description
 * 下方文件来自 blockly\packages\blockly\core\inject.ts
 * 因为实际只修改了一行代码，大部分未修改（行为），所以保留版权声明
 * */

/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/10/25:
 * - 修改注入的工作区
 */

import * as Blockly from 'blockly';
import { ashWorkspaceSvg } from './plugins/workspace';

/**
 * Inject a Blockly editor into the specified container element (usually a div).
 *
 * @param container Containing element, or its ID, or a CSS selector.
 * @param opt_options Optional dictionary of options.
 * @returns Newly created main workspace.
 */
export function inject(
    container: Element | string,
    opt_options?: Blockly.BlocklyOptions,
): Blockly.WorkspaceSvg {
    let containerElement: Element | null;
    if (typeof container === 'string') {
        containerElement = document.getElementById(container) ?? document.querySelector(container);
    } else {
        containerElement = container;
    }
    // Verify that the container is in document.
    if (!document.contains(containerElement) && document !== containerElement?.ownerDocument) {
        throw Error('Error: container is not in current document');
    }
    const options = new Blockly.Options(opt_options ?? {});
    const subContainer = document.createElement('div');
    Blockly.utils.dom.addClass(subContainer, 'injectionDiv');
    if (opt_options?.rtl) {
        Blockly.utils.dom.addClass(subContainer, 'blocklyRTL');
    }
    Blockly.utils.aria.setRole(subContainer, Blockly.utils.aria.Role.APPLICATION);

    containerElement!.appendChild(subContainer);
    const svg = createDom(subContainer, options);

    const workspace = createMainWorkspace(subContainer, svg, options);

    init(workspace);

    // Keep focus on the first workspace so entering keyboard navigation looks
    // correct.
    Blockly.common.setMainWorkspace(workspace);

    Blockly.common.svgResize(workspace);

    subContainer.addEventListener('focusin', function () {
        Blockly.common.setMainWorkspace(workspace);
    });

    Blockly.browserEvents.conditionalBind(
        subContainer,
        'keydown',
        null,
        Blockly.common.globalShortcutHandler,
    );

    Blockly.utils.aria.initializeGlobalAriaLiveRegion(subContainer);

    return workspace;
}

/**
 * Create the SVG image.
 *
 * @param container Containing element.
 * @param options Dictionary of options.
 * @returns Newly created SVG image.
 */
function createDom(container: HTMLElement, options: Blockly.Options): SVGElement {
    // Sadly browsers (Chrome vs Firefox) are currently inconsistent in laying
    // out content in RTL mode.  Therefore Blockly forces the use of LTR,
    // then manually positions content in RTL as needed.
    container.setAttribute('dir', 'LTR');

    // Load CSS.
    Blockly.Css.inject(container, options.hasCss, options.pathToMedia);

    // Build the SVG DOM.
    /*
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:html="http://www.w3.org/1999/xhtml"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
      class="blocklySvg">
      ...
    </svg>
    */
    const svg = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.SVG,
        {
            xmlns: Blockly.utils.dom.SVG_NS,
            'xmlns:html': Blockly.utils.dom.HTML_NS,
            'xmlns:xlink': Blockly.utils.dom.XLINK_NS,
            version: '1.1',
            class: 'blocklySvg',
        },
        container,
    );
    /*
    <defs>
      ... filters go here ...
    </defs>
    */
    const defs = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.DEFS, {}, svg);
    // Each filter/pattern needs a unique ID for the case of multiple Blockly
    // instances on a page.  Browser behaviour becomes undefined otherwise.
    // https://neil.fraser.name/news/2015/11/01/
    const rnd = String(Math.random()).substring(2);

    options.gridPattern = Blockly.Grid.createDom(rnd, options.gridOptions, defs, container);
    return svg;
}

/**
 * Create a main workspace and add it to the SVG.
 *
 * @param svg SVG element with pattern defined.
 * @param options Dictionary of options.
 * @returns Newly created main workspace.
 */
function createMainWorkspace(
    injectionDiv: HTMLElement,
    svg: SVGElement,
    options: Blockly.Options,
): Blockly.WorkspaceSvg {
    options.parentWorkspace = null;
    const mainWorkspace = new ashWorkspaceSvg(options);
    const wsOptions = mainWorkspace.options;
    mainWorkspace.scale = wsOptions.zoomOptions.startScale;
    svg.appendChild(mainWorkspace.createDom('blocklyMainBackground', injectionDiv));

    // Set the theme name and renderer name onto the injection div.
    const rendererClassName = mainWorkspace.getRenderer().getClassName();
    if (rendererClassName) {
        Blockly.utils.dom.addClass(injectionDiv, rendererClassName);
    }
    const themeClassName = mainWorkspace.getTheme().getClassName();
    if (themeClassName) {
        Blockly.utils.dom.addClass(injectionDiv, themeClassName);
    }

    if (!wsOptions.hasCategories && wsOptions.languageTree) {
        // Add flyout as an <svg> that is a sibling of the workspace SVG.
        const flyout = mainWorkspace.addFlyout(Blockly.utils.Svg.SVG);
        injectionDiv.insertBefore(flyout, svg);
    }
    if (wsOptions.hasTrashcan) {
        mainWorkspace.addTrashcan();
    }
    if (wsOptions.zoomOptions.controls) {
        mainWorkspace.addZoomControls();
    }
    // Register the workspace svg as a UI component.
    mainWorkspace.getThemeManager().subscribe(svg, 'workspaceBackgroundColour', 'background-color');

    // A null translation will also apply the correct initial scale.
    mainWorkspace.translate(0, 0);

    mainWorkspace.addChangeListener(Blockly.bumpObjects.bumpIntoBoundsHandler(mainWorkspace));

    // The SVG is now fully assembled.
    Blockly.common.svgResize(mainWorkspace);
    Blockly.WidgetDiv.createDom();
    Blockly.DropDownDiv.createDom();
    Blockly.Tooltip.createDom();
    return mainWorkspace;
}

/**
 * Initialize Blockly with various handlers.
 *
 * @param mainWorkspace Newly created main workspace.
 */
function init(mainWorkspace: Blockly.WorkspaceSvg) {
    const options = mainWorkspace.options;
    const svg = mainWorkspace.getParentSvg();

    // Suppress the browser's context menu.
    Blockly.browserEvents.conditionalBind(
        svg.parentNode as Element,
        'contextmenu',
        null,
        function (e: Event) {
            if (!Blockly.browserEvents.isTargetInput(e)) {
                e.preventDefault();
            }
        },
    );

    const workspaceResizeHandler = Blockly.browserEvents.conditionalBind(
        window,
        'resize',
        null,
        function () {
            // Don't hide all the chaff. Leave the dropdown and widget divs open if
            // possible.
            Blockly.Tooltip.hide();
            mainWorkspace.hideComponents(true);
            Blockly.common.svgResize(mainWorkspace);
            Blockly.DropDownDiv.repositionForWindowResize();
            Blockly.WidgetDiv.repositionForWindowResize();
            Blockly.bumpObjects.bumpTopObjectsIntoBounds(mainWorkspace);
        },
    );
    mainWorkspace.setResizeHandlerWrapper(workspaceResizeHandler);

    bindDocumentEvents();

    if (options.languageTree) {
        const toolbox = mainWorkspace.getToolbox();
        const flyout = mainWorkspace.getFlyout(true);
        if (toolbox) {
            toolbox.init();
        } else if (flyout) {
            // Build a fixed flyout with the root blocks.
            flyout.init(mainWorkspace);
            flyout.show(options.languageTree);
            if (typeof flyout.scrollToStart === 'function') {
                flyout.scrollToStart();
            }
        }
    }

    if (options.hasTrashcan) {
        mainWorkspace.trashcan!.init();
    }
    if (options.zoomOptions.controls) {
        mainWorkspace.zoomControls_!.init();
    }

    if (options.moveOptions.scrollbars) {
        const horizontalScroll =
            options.moveOptions.scrollbars === true || options.moveOptions.scrollbars.horizontal;
        const verticalScroll =
            options.moveOptions.scrollbars === true || options.moveOptions.scrollbars.vertical;
        mainWorkspace.scrollbar = new Blockly.ScrollbarPair(
            mainWorkspace,
            horizontalScroll,
            verticalScroll,
            'blocklyMainWorkspaceScrollbar',
        );
        mainWorkspace.scrollbar.resize();
    } else {
        mainWorkspace.setMetrics({ x: 0.5, y: 0.5 });
    }

    // Load the sounds.
    if (options.hasSounds) {
        void loadSounds(options.pathToMedia, mainWorkspace);
    }
}

/**
 * Whether event handlers have been bound. Document event handlers will only
 * be bound once, even if Blockly is destroyed and reinjected.
 */
let documentEventsBound = false;

/**
 * Bind document events, but only once.  Destroying and reinjecting Blockly
 * should not bind again.
 * Bind events for scrolling the workspace.
 * Most of these events should be bound to the SVG's surface.
 * However, 'mouseup' has to be on the whole document so that a block dragged
 * out of bounds and released will know that it has been released.
 */
function bindDocumentEvents() {
    if (!documentEventsBound) {
        Blockly.browserEvents.conditionalBind(document, 'scroll', null, function () {
            const workspaces = Blockly.common.getAllWorkspaces();
            for (const workspace of workspaces) {
                if (workspace instanceof Blockly.WorkspaceSvg) {
                    workspace.updateInverseScreenCTM();
                }
            }
        });
        // longStop needs to run to stop the context menu from showing up.  It
        // should run regardless of what other touch event handlers have run.
        Blockly.browserEvents.bind(document, 'touchend', null, Blockly.Touch.longStop);
        Blockly.browserEvents.bind(document, 'touchcancel', null, Blockly.Touch.longStop);
        Blockly.browserEvents.bind(document, 'keydown', null, function (e: KeyboardEvent) {
            if (e.key === 'Tab') {
                Blockly.keyboardNavigationController.setIsActive(true);
            }
        });
    }
    documentEventsBound = true;
}

/**
 * Load sounds for the given workspace.
 *
 * @param pathToMedia The path to the media directory.
 * @param workspace The workspace to load sounds for.
 */
async function loadSounds(pathToMedia: string, workspace: Blockly.WorkspaceSvg) {
    const audioMgr = workspace.getAudioManager();
    await audioMgr.load([`${pathToMedia}click.mp3`], 'click');
    await audioMgr.load([`${pathToMedia}disconnect.mp3`], 'disconnect');
    await audioMgr.load([`${pathToMedia}delete.mp3`], 'delete');
    await audioMgr.load([`${pathToMedia}drop.mp3`], 'drop');
}
